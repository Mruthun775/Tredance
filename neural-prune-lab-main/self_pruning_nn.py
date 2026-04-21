"""
=============================================================================
 Self-Pruning Neural Network on CIFAR-10
 Tredence Analytics – AI Engineering Internship Case Study
=============================================================================
 Author  : (Mruthun)
 Date    : 2026
 Purpose : Demonstrate learned weight pruning via sigmoid-gated linear layers
           trained with an L1 sparsity regulariser (λ penalty).
=============================================================================
"""

import os
import copy
import numpy as np
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torch.utils.data import Subset
import torchvision
import torchvision.transforms as transforms

SEED = 42
torch.manual_seed(SEED)
np.random.seed(SEED)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[INFO] Using device: {DEVICE}")


class PrunableLinear(nn.Module):
    """
    A drop-in replacement for nn.Linear that learns *which weights to prune*.

    Each weight w_ij is multiplied by a learned gate g_ij = σ(s_ij), where
    s_ij is a trainable 'gate score'.  When the L1 penalty pushes s_ij → -∞
    the gate g_ij → 0, effectively zeroing (pruning) that weight.

    Parameters
    ----------
    in_features  : int  – size of each input sample
    out_features : int  – size of each output sample
    bias         : bool – whether to learn an additive bias (default True)
    """

    def __init__(self, in_features: int, out_features: int, bias: bool = True):
        super().__init__()
        self.in_features  = in_features
        self.out_features = out_features

        self.weight      = nn.Parameter(torch.empty(out_features, in_features))
        self.bias_param  = nn.Parameter(torch.zeros(out_features)) if bias else None

        self.gate_scores = nn.Parameter(torch.zeros(out_features, in_features))

        nn.init.kaiming_uniform_(self.weight, a=np.sqrt(5))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass:
            1. gates        = σ(gate_scores)           ∈ (0, 1)
            2. pruned_weight = weight ⊙ gates           element-wise
            3. output        = x @ pruned_weight.T + bias
        """
        gates = torch.sigmoid(self.gate_scores)
        pruned_weight = self.weight * gates
        return nn.functional.linear(x, pruned_weight, self.bias_param)

    def get_gates(self) -> torch.Tensor:
        """Return current gate values (detached from the graph)."""
        return torch.sigmoid(self.gate_scores).detach()

    def sparsity_level(self, threshold: float = 1e-2) -> float:
        """Fraction of gates below *threshold* (i.e. effectively pruned)."""
        gates = self.get_gates()
        return (gates < threshold).float().mean().item()

    def extra_repr(self) -> str:
        return (f"in_features={self.in_features}, "
                f"out_features={self.out_features}, "
                f"bias={self.bias_param is not None}")


class PrunableNet(nn.Module):
    """
    A lightweight CNN for CIFAR-10.

    Architecture:
      • Two convolutional blocks (Conv → BN → ReLU → MaxPool)
      • Flatten
      • Two PrunableLinear layers as the classification head
      • Final softmax-compatible output via a plain nn.Linear

    Only the PrunableLinear layers carry gate parameters and contribute to
    the sparsity loss.
    """

    def __init__(self):
        super().__init__()

        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
        )

        self.prunable1 = PrunableLinear(64 * 8 * 8, 256)
        self.relu1     = nn.ReLU(inplace=True)
        self.dropout   = nn.Dropout(0.3)

        self.prunable2 = PrunableLinear(256, 128)
        self.relu2     = nn.ReLU(inplace=True)

        self.output    = nn.Linear(128, 10)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.features(x)
        x = x.view(x.size(0), -1)
        x = self.relu1(self.prunable1(x))
        x = self.dropout(x)
        x = self.relu2(self.prunable2(x))
        return self.output(x)

    def prunable_layers(self) -> list:
        """Return all PrunableLinear instances in the model."""
        return [m for m in self.modules() if isinstance(m, PrunableLinear)]

    def all_gates(self) -> torch.Tensor:
        """Concatenate all gate values into a single 1-D tensor."""
        return torch.cat([l.get_gates().view(-1) for l in self.prunable_layers()])

    def network_sparsity(self, threshold: float = 1e-2) -> float:
        """Overall fraction of pruned gates across all PrunableLinear layers."""
        gates = self.all_gates()
        return (gates < threshold).float().mean().item()


def sparsity_loss(model: PrunableNet) -> torch.Tensor:
    """
    L1 norm of ALL sigmoid gate values across every PrunableLinear layer.

    Minimising Σ |g_ij| = Σ σ(s_ij) pushes gate values toward 0,
    which corresponds to s_ij → -∞.  This is the sparsity-inducing term.
    """
    total = torch.tensor(0.0, device=DEVICE)
    for layer in model.prunable_layers():
        gates = torch.sigmoid(layer.gate_scores)
        total = total + gates.abs().sum()
    return total


def total_loss(logits: torch.Tensor,
               targets: torch.Tensor,
               model: PrunableNet,
               lam: float,
               criterion: nn.Module) -> torch.Tensor:
    """
    Total Loss = CrossEntropyLoss(logits, targets) + λ × SparsityLoss(model)
    """
    clf_loss = criterion(logits, targets)
    spar_loss = sparsity_loss(model)
    return clf_loss + lam * spar_loss


def get_dataloaders(batch_size: int = 128,
                    num_workers: int | None = None,
                    max_train_samples: int | None = None,
                    max_test_samples: int | None = None):
    """
    Download CIFAR-10 and return (train_loader, test_loader).

    Augmentations applied to training set only:
      • RandomHorizontalFlip
      • RandomCrop with padding
    Both sets are normalised with CIFAR-10 channel statistics.
    """
    mean = (0.4914, 0.4822, 0.4465)
    std  = (0.2023, 0.1994, 0.2010)

    train_transform = transforms.Compose([
        transforms.RandomCrop(32, padding=4),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize(mean, std),
    ])
    test_transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean, std),
    ])

    data_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

    train_set = torchvision.datasets.CIFAR10(
        root=data_root, train=True,  download=True, transform=train_transform)
    test_set  = torchvision.datasets.CIFAR10(
        root=data_root, train=False, download=True, transform=test_transform)

    if max_train_samples is not None:
        max_train_samples = min(max_train_samples, len(train_set))
        train_set = Subset(train_set, list(range(max_train_samples)))

    if max_test_samples is not None:
        max_test_samples = min(max_test_samples, len(test_set))
        test_set = Subset(test_set, list(range(max_test_samples)))

    if num_workers is None:
        num_workers = 0 if os.name == "nt" else 2

    pin_memory = torch.cuda.is_available()

    train_loader = DataLoader(train_set, batch_size=batch_size,
                              shuffle=True,  num_workers=num_workers,
                              pin_memory=pin_memory)
    test_loader  = DataLoader(test_set,  batch_size=256,
                              shuffle=False, num_workers=num_workers,
                              pin_memory=pin_memory)
    return train_loader, test_loader


def train_one_epoch(model: PrunableNet,
                    loader: DataLoader,
                    optimizer: optim.Optimizer,
                    criterion: nn.Module,
                    lam: float) -> float:
    """Train for a single epoch; return average total loss."""
    model.train()
    running_loss = 0.0
    for images, labels in loader:
        images, labels = images.to(DEVICE), labels.to(DEVICE)

        optimizer.zero_grad()
        logits = model(images)
        loss   = total_loss(logits, labels, model, lam, criterion)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)

    return running_loss / len(loader.dataset)


@torch.no_grad()
def evaluate(model: PrunableNet, loader: DataLoader) -> float:
    """Return top-1 accuracy on *loader*."""
    model.eval()
    correct, total = 0, 0
    for images, labels in loader:
        images, labels = images.to(DEVICE), labels.to(DEVICE)
        preds   = model(images).argmax(dim=1)
        correct += (preds == labels).sum().item()
        total   += labels.size(0)
    return correct / total


def train_model(lam: float,
                train_loader: DataLoader,
                test_loader: DataLoader,
                num_epochs: int = 20) -> dict:
    """
    Train a fresh PrunableNet for *num_epochs* with sparsity coefficient *lam*.

    Returns a dict with:
      • 'model'       – trained model (on CPU)
      • 'test_acc'    – final test accuracy (%)
      • 'sparsity'    – gate sparsity level (%)
      • 'train_losses'– list of per-epoch losses
    """
    print(f"\n{'='*60}")
    print(f"  Training with lambda = {lam}")
    print(f"{'='*60}")

    model     = PrunableNet().to(DEVICE)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=num_epochs)

    train_losses = []
    best_acc     = 0.0
    best_state   = None

    for epoch in range(1, num_epochs + 1):
        epoch_loss = train_one_epoch(model, train_loader, optimizer, criterion, lam)
        test_acc   = evaluate(model, test_loader)
        sparsity   = model.network_sparsity()
        scheduler.step()

        train_losses.append(epoch_loss)

        if test_acc > best_acc:
            best_acc   = test_acc
            best_state = copy.deepcopy(model.state_dict())

        if epoch % 5 == 0 or epoch == 1:
            print(f"  Epoch [{epoch:>2}/{num_epochs}] | "
                  f"Loss: {epoch_loss:.4f} | "
                  f"Test Acc: {test_acc*100:.2f}% | "
                  f"Sparsity: {sparsity*100:.1f}%")

    model.load_state_dict(best_state)
    final_acc      = evaluate(model, test_loader)
    final_sparsity = model.network_sparsity()

    print(f"\n  [OK] Final Test Accuracy : {final_acc*100:.2f}%")
    print(f"  [OK] Final Sparsity      : {final_sparsity*100:.1f}%")

    return {
        "lam"         : lam,
        "model"       : model.cpu(),
        "test_acc"    : final_acc * 100,
        "sparsity"    : final_sparsity * 100,
        "train_losses": train_losses,
    }


def plot_gate_distribution(model: PrunableNet, lam: float, save_path: str):
    """
    Plot a histogram of all gate values (σ(gate_scores)) for *model*.

    A well-pruned model will show:
      • A large spike near 0 → many weights have been zeroed out
      • A second cluster near 1 → surviving, informative weights
    """
    model.eval()
    gates = model.all_gates().numpy()

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.hist(gates, bins=100, color="#2563EB", edgecolor="white",
            linewidth=0.3, alpha=0.85)

    ax.axvline(x=0.01, color="#DC2626", linestyle="--", linewidth=1.5,
               label="Pruning threshold (0.01)")

    ax.set_xlabel("Gate Value  σ(s)", fontsize=12)
    ax.set_ylabel("Count",            fontsize=12)
    ax.set_title(f"Gate Value Distribution  |  λ = {lam}",
                 fontsize=13, fontweight="bold")
    ax.legend()
    ax.grid(axis="y", alpha=0.3)

    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.close()
    print(f"[INFO] Gate distribution plot saved -> {save_path}")


def plot_training_curves(results: list, save_path: str):
    """Plot training loss curves for all λ values on a single axes."""
    fig, ax = plt.subplots(figsize=(8, 4))
    colors  = ["#16A34A", "#D97706", "#DC2626"]

    for res, color in zip(results, colors):
        ax.plot(res["train_losses"], label=f"λ = {res['lam']}", color=color,
                linewidth=1.8)

    ax.set_xlabel("Epoch",        fontsize=12)
    ax.set_ylabel("Total Loss",   fontsize=12)
    ax.set_title("Training Loss Curves for Different λ Values",
                 fontsize=13, fontweight="bold")
    ax.legend()
    ax.grid(alpha=0.3)

    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.close()
    print(f"[INFO] Training curves saved -> {save_path}")


def print_results_table(results: list):
    """Print a nicely-formatted results table to stdout."""
    print("\n" + "="*55)
    print(f"  {'Lambda':<12} {'Test Accuracy':<20} {'Sparsity Level'}")
    print("="*55)
    for r in results:
        print(f"  {r['lam']:<12} {r['test_acc']:.2f}%{'':<13} {r['sparsity']:.1f}%")
    print("="*55 + "\n")


def main():
    FAST_RUN = True

    if FAST_RUN:
        LAMBDA_VALUES = [1e-5, 1e-4, 1e-3]
        NUM_EPOCHS = 2
        BATCH_SIZE = 512
        MAX_TRAIN_SAMPLES = 2000
        MAX_TEST_SAMPLES = 500
    else:
        LAMBDA_VALUES = [1e-5, 1e-4, 1e-3]   # low, medium, high sparsity pressure
        NUM_EPOCHS = 20                        # increase for better accuracy
        BATCH_SIZE = 128
        MAX_TRAIN_SAMPLES = None
        MAX_TEST_SAMPLES = None

    OUTPUT_DIR    = "outputs"
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"[INFO] FAST_RUN={FAST_RUN} | epochs={NUM_EPOCHS} | batch_size={BATCH_SIZE}")

    train_loader, test_loader = get_dataloaders(
        batch_size=BATCH_SIZE,
        max_train_samples=MAX_TRAIN_SAMPLES,
        max_test_samples=MAX_TEST_SAMPLES,
    )

    results = []
    for lam in LAMBDA_VALUES:
        res = train_model(lam, train_loader, test_loader, num_epochs=NUM_EPOCHS)
        results.append(res)

    print_results_table(results)

    best_result = max(results, key=lambda r: r["test_acc"])
    print(f"[INFO] Best model -> lambda = {best_result['lam']} "
          f"(Acc: {best_result['test_acc']:.2f}%)")

    plot_gate_distribution(
        model     = best_result["model"],
        lam       = best_result["lam"],
        save_path = os.path.join(OUTPUT_DIR, "gate_distribution_best.png"),
    )

    plot_training_curves(
        results   = results,
        save_path = os.path.join(OUTPUT_DIR, "training_curves.png"),
    )

    print("\n[INFO] All outputs saved to ./outputs/")
    print("[INFO] Done [OK]")


if __name__ == "__main__":
    main()
