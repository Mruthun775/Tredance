export const SparsityExplainer = () => {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Formula card */}
      <div className="surface-card rounded-xl p-6">
        <div className="text-xs font-display uppercase tracking-widest text-muted-foreground mb-4">
          Loss Formulation
        </div>
        <div className="font-mono text-foreground bg-surface-deep rounded-lg p-5 border border-border overflow-x-auto">
          <div className="text-base md:text-lg leading-relaxed whitespace-nowrap">
            <span className="text-foreground">Total Loss</span>
            <span className="text-muted-foreground"> = </span>
            <span className="text-primary">L_CE(ŷ, y)</span>
            <span className="text-muted-foreground"> + </span>
            <span className="text-accent">λ</span>
            <span className="text-muted-foreground"> × </span>
            <span className="text-accent">Σ|σ(s_ij)|</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3 text-[11px] text-muted-foreground font-display">
            <div className="text-center">───── Task Loss ─────</div>
            <div className="text-center">─── Sparsity Loss ───</div>
          </div>
        </div>

        <ul className="mt-6 space-y-3">
          {[
            { icon: "→", text: "L1 gradient is constant ±λ → always pushes toward 0" },
            { icon: "⬇", text: "As s_ij → −∞, σ(s_ij) → 0 → weight is zeroed" },
            { icon: "✂️", text: "L2 weakens near 0; L1 does not → true zeros, not small values" },
          ].map((row) => (
            <li key={row.text} className="flex items-start gap-3 text-sm">
              <span className="font-mono-num text-primary text-base w-6 shrink-0 text-center">
                {row.icon}
              </span>
              <span className="text-foreground/90">{row.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Analogy card */}
      <div className="rounded-xl p-6 bg-accent/5 border border-accent/30 transition hover:shadow-[0_0_24px_hsl(38_92%_50%/0.25)]">
        <div className="text-xs font-display uppercase tracking-widest text-accent mb-4">
          Mental Model
        </div>
        <h3 className="text-2xl font-display text-foreground mb-4">
          💡 The Dimmer Switch Analogy
        </h3>
        <blockquote className="border-l-2 border-accent pl-5 text-foreground/85 leading-relaxed text-base">
          "Each gate is a dimmer switch on a weight. The L1 penalty charges a flat
          fee per unit of <span className="text-accent font-medium">'light'</span> used.
          The optimizer turns off dimmers on weights that don't justify their cost.
          Higher <span className="font-mono text-accent">λ</span> = higher fee = more dimmers
          switched off = higher sparsity."
        </blockquote>
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { l: "Low λ", v: "🔆", s: "Most lights on" },
            { l: "Med λ", v: "💡", s: "Selective" },
            { l: "High λ", v: "🌑", s: "Mostly off" },
          ].map((c) => (
            <div key={c.l} className="rounded-lg bg-surface-deep border border-border p-3">
              <div className="text-2xl">{c.v}</div>
              <div className="text-xs font-display text-accent mt-1">{c.l}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{c.s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
