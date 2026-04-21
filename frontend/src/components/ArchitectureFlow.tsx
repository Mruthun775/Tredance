interface Block {
  label: string;
  sub?: string;
  prunable?: boolean;
}

const BLOCKS: Block[] = [
  { label: "INPUT", sub: "3 × 32 × 32" },
  { label: "Conv Block 1", sub: "32 filters" },
  { label: "Conv Block 2", sub: "64 filters" },
  { label: "Flatten", sub: "4096" },
  { label: "FC 4096 → 256", sub: "PrunableLinear", prunable: true },
  { label: "FC 256 → 128", sub: "PrunableLinear", prunable: true },
  { label: "Output", sub: "10 classes" },
];

const Arrow = () => (
  <svg
    className="shrink-0 mx-1"
    width="56"
    height="24"
    viewBox="0 0 56 24"
    fill="none"
    aria-hidden
  >
    <line
      x1="2"
      y1="12"
      x2="48"
      y2="12"
      stroke="hsl(var(--primary))"
      strokeWidth="1.5"
      className="flow-arrow"
    />
    <path d="M44 6 L52 12 L44 18" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" />
  </svg>
);

export const ArchitectureFlow = () => {
  return (
    <div className="surface-card rounded-xl p-6 overflow-x-auto">
      <div className="flex items-stretch min-w-max gap-1">
        {BLOCKS.map((b, i) => (
          <div key={b.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={[
                  "scan-line relative w-[140px] h-[88px] rounded-lg flex flex-col items-center justify-center px-3 text-center transition",
                  b.prunable
                    ? "border-2 border-primary/70 bg-primary/5 glow-cyan"
                    : "border border-border bg-surface-raised",
                ].join(" ")}
              >
                <div className="font-display text-sm font-bold text-foreground leading-tight">
                  {b.label}
                </div>
                {b.sub && !b.prunable && (
                  <div className="font-mono-num text-[11px] text-muted-foreground mt-1">
                    {b.sub}
                  </div>
                )}
                {b.prunable && (
                  <div className="font-mono-num text-[11px] text-primary mt-1">
                    {b.sub}
                  </div>
                )}
              </div>
              {b.prunable && (
                <div className="mt-2 text-[10px] font-display tracking-wider text-primary">
                  ⚡ PrunableLinear
                </div>
              )}
              {!b.prunable && <div className="mt-2 h-[14px]" />}
            </div>
            {i < BLOCKS.length - 1 && <Arrow />}
          </div>
        ))}
      </div>
    </div>
  );
};
