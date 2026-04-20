import { useEffect, useMemo, useRef, useState } from "react";

type LambdaKey = "1e-5" | "1e-4" | "1e-3";

const DATASETS: Record<LambdaKey, number[]> = {
  // λ=1e-5 — original (sparsity ~8% but retains the bimodal flavor for the case study)
  "1e-5": [
    18400, 1200, 680, 490, 380, 310, 270, 250, 240, 260, 280, 310, 390, 510, 780,
    1100, 2200, 3800, 5600, 7400,
  ],
  // λ=1e-4 — balanced (more pruned mass at 0, smaller right cluster)
  "1e-4": [
    24800, 1600, 820, 560, 430, 360, 300, 270, 250, 240, 250, 280, 330, 410, 560,
    760, 1500, 2400, 3400, 4200,
  ],
  // λ=1e-3 — aggressive (massive spike at 0, thin tail near 1)
  "1e-3": [
    32800, 2400, 1100, 700, 520, 410, 340, 290, 260, 240, 230, 240, 260, 300, 380,
    500, 780, 1200, 1900, 2600,
  ],
};

const RANGES = Array.from({ length: 20 }, (_, i) => {
  const a = (i * 0.05).toFixed(2);
  const b = ((i + 1) * 0.05).toFixed(2);
  return `${a}–${b}`;
});

const META: Record<LambdaKey, { sparsity: number; tone: string }> = {
  "1e-5": { sparsity: 8.2, tone: "primary" },
  "1e-4": { sparsity: 34.7, tone: "accent" },
  "1e-3": { sparsity: 72.3, tone: "destructive" },
};

const colorForBin = (i: number, n: number) => {
  const t = i / (n - 1);
  if (t < 0.5) {
    const k = t / 0.5;
    return `hsl(${0 + (38 - 0) * k} ${84 + (92 - 84) * k}% ${60 + (50 - 60) * k}%)`;
  }
  const k = (t - 0.5) / 0.5;
  return `hsl(${38 + (187 - 38) * k} ${92 + (85 - 92) * k}% ${50 + (53 - 50) * k}%)`;
};

export const GateHistogram = () => {
  const [visible, setVisible] = useState(false);
  const [lambda, setLambda] = useState<LambdaKey>("1e-5");
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const counts = DATASETS[lambda];
  const yMax = useMemo(() => {
    const m = Math.max(...Object.values(DATASETS).flat());
    // Round up to nice 5k step
    return Math.ceil(m / 5000) * 5000;
  }, []);

  const W = 880;
  const H = 360;
  const padL = 56;
  const padR = 16;
  const padT = 16;
  const padB = 44;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const barW = innerW / counts.length;

  const ticks = Array.from({ length: 5 }, (_, i) => Math.round((yMax / 4) * i));

  const totalGates = counts.reduce((s, c) => s + c, 0);
  const prunedPct = ((counts[0] / totalGates) * 100).toFixed(1);

  return (
    <div ref={ref} className="surface-card rounded-xl p-5">
      {/* λ selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
            Switch model:
          </span>
          <div className="inline-flex rounded-md border border-border bg-surface-deep p-0.5">
            {(Object.keys(DATASETS) as LambdaKey[]).map((k) => {
              const isActive = k === lambda;
              return (
                <button
                  key={k}
                  onClick={() => {
                    setLambda(k);
                    setHover(null);
                  }}
                  className={[
                    "px-3 py-1.5 rounded text-xs font-mono-num transition",
                    isActive
                      ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.45)]"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  λ = {k}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono-num">
          <span className="text-muted-foreground">
            Total gates: <span className="text-foreground">{totalGates.toLocaleString()}</span>
          </span>
          <span className="text-muted-foreground">
            Pruned (g&lt;0.05):{" "}
            <span className="text-destructive font-bold">{prunedPct}%</span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[640px] h-auto select-none"
          onMouseLeave={() => setHover(null)}
        >
          {/* Grid lines */}
          {ticks.map((t) => {
            const y = padT + innerH - (t / yMax) * innerH;
            return (
              <g key={t}>
                <line
                  x1={padL}
                  x2={W - padR}
                  y1={y}
                  y2={y}
                  stroke="hsl(var(--grid-line))"
                  strokeDasharray="3 4"
                />
                <text
                  x={padL - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                  fill="hsl(var(--muted-foreground))"
                >
                  {t.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {counts.map((count, i) => {
            const h = (count / yMax) * innerH;
            const x = padL + i * barW + 2;
            const y = padT + innerH - h;
            const color = colorForBin(i, counts.length);
            const isHover = hover === i;
            return (
              <g key={i}>
                {/* hit area */}
                <rect
                  x={padL + i * barW}
                  y={padT}
                  width={barW}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                />
                <rect
                  x={x}
                  y={visible ? y : padT + innerH}
                  width={barW - 4}
                  height={visible ? h : 0}
                  rx={2}
                  fill={color}
                  opacity={hover === null || isHover ? 1 : 0.45}
                  style={{
                    transition: `y 700ms cubic-bezier(0.22,1,0.36,1) ${i * 25}ms, height 700ms cubic-bezier(0.22,1,0.36,1) ${i * 25}ms, opacity 180ms ease, filter 180ms ease`,
                    filter: isHover
                      ? "drop-shadow(0 0 10px hsl(var(--primary) / 0.6))"
                      : i === 0
                        ? "drop-shadow(0 0 8px hsl(0 84% 60% / 0.5))"
                        : i >= counts.length - 2
                          ? "drop-shadow(0 0 8px hsl(187 85% 53% / 0.4))"
                          : undefined,
                    pointerEvents: "none",
                  }}
                />
              </g>
            );
          })}

          {/* X axis labels (sparse) */}
          {[0, 5, 10, 15, 19].map((i, idx) => {
            const x = padL + i * barW + barW / 2;
            const labels = ["0.0", "0.25", "0.5", "0.75", "1.0"];
            return (
              <text
                key={i}
                x={x}
                y={H - padB + 18}
                textAnchor="middle"
                fontSize="11"
                fontFamily="JetBrains Mono"
                fill="hsl(var(--muted-foreground))"
              >
                {labels[idx]}
              </text>
            );
          })}

          {/* Threshold line */}
          {(() => {
            const xLine = padL + 0.01 * innerW;
            return (
              <g>
                <line
                  x1={xLine}
                  x2={xLine}
                  y1={padT}
                  y2={padT + innerH}
                  stroke="hsl(var(--destructive))"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                  opacity={visible ? 0.9 : 0}
                  style={{ transition: "opacity 600ms ease 1000ms" }}
                />
                <text
                  x={xLine + 8}
                  y={padT + 14}
                  fontSize="10"
                  fontFamily="Space Mono"
                  fill="hsl(var(--destructive))"
                  opacity={visible ? 1 : 0}
                  style={{ transition: "opacity 600ms ease 1000ms" }}
                >
                  Pruning Threshold (g &lt; 0.01)
                </text>
              </g>
            );
          })()}

          {/* Hover tooltip */}
          {hover !== null &&
            (() => {
              const x = padL + hover * barW + barW / 2;
              const tipW = 150;
              const tipH = 50;
              const tipX = Math.min(W - padR - tipW, Math.max(padL, x - tipW / 2));
              const tipY = padT + 4;
              return (
                <g style={{ pointerEvents: "none" }}>
                  <line
                    x1={x}
                    x2={x}
                    y1={padT}
                    y2={padT + innerH}
                    stroke="hsl(var(--primary))"
                    strokeDasharray="2 3"
                    opacity={0.5}
                  />
                  <rect
                    x={tipX}
                    y={tipY}
                    width={tipW}
                    height={tipH}
                    rx={6}
                    fill="hsl(var(--card))"
                    stroke="hsl(var(--primary) / 0.4)"
                  />
                  <text
                    x={tipX + 10}
                    y={tipY + 18}
                    fontSize="10"
                    fontFamily="Space Mono"
                    fill="hsl(var(--primary))"
                  >
                    bin {RANGES[hover]}
                  </text>
                  <text
                    x={tipX + 10}
                    y={tipY + 36}
                    fontSize="12"
                    fontFamily="JetBrains Mono"
                    fill="hsl(var(--foreground))"
                  >
                    {counts[hover].toLocaleString()} gates
                  </text>
                </g>
              );
            })()}

          <text
            x={padL + innerW / 2}
            y={H - 4}
            textAnchor="middle"
            fontSize="11"
            fontFamily="DM Sans"
            fill="hsl(var(--muted-foreground))"
          >
            σ(gate score) value
          </text>
        </svg>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="text-xs font-display text-destructive uppercase tracking-wider mb-1">
            📌 Pruned Mass
          </div>
          <div className="text-sm text-foreground/90">
            Reported sparsity for λ={lambda}:{" "}
            <span className="font-mono-num text-destructive font-bold">
              {META[lambda].sparsity.toFixed(1)}%
            </span>{" "}
            of gates collapse toward 0.
          </div>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="text-xs font-display text-primary uppercase tracking-wider mb-1">
            📌 Surviving Weights
          </div>
          <div className="text-sm text-foreground/90">
            Cluster near 1 → surviving weights are confident and informative. Switch λ to watch the right-side cluster shrink.
          </div>
        </div>
      </div>
    </div>
  );
};
