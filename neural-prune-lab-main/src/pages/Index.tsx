import { ArchitectureFlow } from "@/components/ArchitectureFlow";
import { GateHistogram } from "@/components/GateHistogram";
import { InPageNav } from "@/components/InPageNav";
import { LambdaTable } from "@/components/LambdaTable";
import { SparsityExplainer } from "@/components/SparsityExplainer";
import { StatCard } from "@/components/StatCard";
import { TrainingLossChart } from "@/components/TrainingLossChart";
import { useEffect } from "react";

const Section = ({
  id,
  title,
  subtitle,
  children,
  delay = 0,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
}) => (
  <section
    id={id}
    className="stagger-in scroll-mt-20"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="mb-5">
      <h2 className="font-display text-xl md:text-2xl text-foreground">
        <span className="text-primary mr-2">//</span>
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
    {children}
  </section>
);

const Index = () => {
  useEffect(() => {
    document.title = "NeuralPrune — Self-Pruning Network Visualizer";
    const desc =
      "Interactive case-study dashboard for a self-pruning neural network on CIFAR-10: λ comparison, gate distribution, training loss curves.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.origin + "/");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HEADER */}
      <header className="border-b border-border bg-surface-deep/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-primary text-2xl md:text-3xl tracking-tight truncate">
              NeuralPrune
            </h1>
            <p className="text-[11px] md:text-xs text-muted-foreground font-mono-num mt-0.5 truncate">
              Self-Pruning Neural Network · CIFAR-10 · Tredence Case Study
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-success/40 bg-success/10">
            <span className="relative inline-flex">
              <span className="pulse-dot inline-block w-2 h-2 rounded-full bg-success" />
            </span>
            <span className="font-display text-[10px] md:text-xs uppercase tracking-widest text-success">
              Experiment Complete
            </span>
          </div>
        </div>
      </header>

      <InPageNav />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-14">
        {/* STAT CARDS */}
        <section id="stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4 scroll-mt-32">
          <StatCard
            label="Best Test Accuracy"
            value={73.4}
            decimals={1}
            suffix="%"
            icon="🎯"
            tone="cyan"
            delay={0}
          />
          <StatCard
            label="Max Sparsity Achieved"
            value={72.3}
            decimals={1}
            suffix="%"
            icon="✂️"
            tone="amber"
            delay={120}
          />
          <StatCard
            label="Prunable Parameters"
            value={1081344}
            icon="🧮"
            tone="white"
            delay={240}
          />
          <StatCard
            label="λ Runs Completed"
            value={3}
            icon="✓"
            tone="success"
            delay={360}
            rawDisplay="/ 3"
          />
        </section>

        <Section
          id="architecture"
          title="Model Architecture"
          subtitle="Two FC layers wrapped in PrunableLinear with learned sigmoid gates per weight."
          delay={420}
        >
          <ArchitectureFlow />
        </Section>

        <Section
          id="lambda"
          title="Experiment Results — λ Comparison"
          subtitle="Total Loss = CrossEntropyLoss + λ × L1(gates)"
          delay={540}
        >
          <LambdaTable />
        </Section>

        <Section
          id="gates"
          title="Gate Value Distribution — Best Model (λ = 1e-5)"
          subtitle="σ(gate_scores) ∈ (0,1) — A bimodal distribution confirms successful pruning."
          delay={660}
        >
          <GateHistogram />
        </Section>

        <Section
          id="why"
          title="Why L1 on Sigmoid Gates Encourages Sparsity"
          delay={780}
        >
          <SparsityExplainer />
        </Section>

        <Section
          id="loss"
          title="Training Loss Over 20 Epochs"
          subtitle="Higher λ converges to a higher loss floor — the cost of aggressive sparsity."
          delay={900}
        >
          <TrainingLossChart />
        </Section>
      </main>

      <footer className="border-t border-border mt-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 text-center font-display text-xs text-muted-foreground">
          NeuralPrune · Tredence Analytics AI Engineering Case Study · 2026
        </div>
      </footer>
    </div>
  );
};

export default Index;
