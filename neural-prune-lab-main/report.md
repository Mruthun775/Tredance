# Self-Pruning Neural Network Report

## Run configuration

- Device: CPU
- Mode: `FAST_RUN=True`
- Epochs: 2
- Batch size: 512
- Train subset: 2000 samples
- Test subset: 500 samples
- Lambda sweep: `[1e-5, 1e-4, 1e-3]`

## Final results

| Lambda | Test Accuracy | Sparsity Level (< 0.01) |
|---|---:|---:|
| `1e-5` | `25.00%` | `0.0%` |
| `1e-4` | `28.60%` | `0.0%` |
| `1e-3` | `23.60%` | `0.0%` |

Best run: **lambda = 1e-4** with **28.60%** test accuracy.

## Plot verification

- `outputs/training_curves.png`: higher lambda gives higher total loss (expected due to stronger sparsity penalty).
- `outputs/gate_distribution_best.png`: gate values are **not yet strongly bimodal** in this fast run.

## Analysis

This fast run was used for quick completion and debugging, not final performance.
Because training was very short and on a small subset, the gates did not have enough time/pressure to move below the pruning threshold, leading to `0.0%` measured sparsity.

## Recommendation for final-quality results

For a stronger case-study result, rerun with:

- `FAST_RUN=False`
- `NUM_EPOCHS = 30` (or more)
- Full CIFAR-10 dataset

That setup is expected to improve accuracy and produce a clearer sparse/bimodal gate distribution.
