import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const L1 = [2.31, 1.98, 1.74, 1.56, 1.42, 1.31, 1.22, 1.14, 1.08, 1.03, 0.99, 0.95, 0.92, 0.89, 0.87, 0.85, 0.83, 0.82, 0.81, 0.8];
const L2 = [2.45, 2.1, 1.87, 1.69, 1.55, 1.44, 1.35, 1.27, 1.21, 1.16, 1.12, 1.08, 1.05, 1.02, 1.0, 0.98, 0.96, 0.95, 0.94, 0.93];
const L3 = [2.89, 2.55, 2.28, 2.08, 1.93, 1.81, 1.71, 1.63, 1.56, 1.51, 1.46, 1.42, 1.39, 1.36, 1.34, 1.32, 1.3, 1.29, 1.28, 1.27];

const data = L1.map((_, i) => ({
  epoch: i + 1,
  "λ=1e-5": L1[i],
  "λ=1e-4": L2[i],
  "λ=1e-3": L3[i],
}));

type SeriesKey = "λ=1e-5" | "λ=1e-4" | "λ=1e-3";

const SERIES: { key: SeriesKey; color: string; varName: string }[] = [
  { key: "λ=1e-5", color: "hsl(var(--primary))", varName: "primary" },
  { key: "λ=1e-4", color: "hsl(var(--accent))", varName: "accent" },
  { key: "λ=1e-3", color: "hsl(var(--destructive))", varName: "destructive" },
];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-card rounded-md p-3 text-xs font-mono-num">
      <div className="font-display text-primary mb-1">Epoch {label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: p.stroke }} />
          <span className="text-muted-foreground">{p.dataKey}:</span>
          <span className="text-foreground">{Number(p.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
};

export const TrainingLossChart = () => {
  const [enabled, setEnabled] = useState<Record<SeriesKey, boolean>>({
    "λ=1e-5": true,
    "λ=1e-4": true,
    "λ=1e-3": true,
  });

  const toggle = (k: SeriesKey) => setEnabled((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div className="surface-card rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
          Click a series to toggle
        </div>
        <div className="flex items-center gap-2">
          {SERIES.map((s) => {
            const on = enabled[s.key];
            return (
              <button
                key={s.key}
                onClick={() => toggle(s.key)}
                className={[
                  "inline-flex items-center gap-2 px-2.5 py-1 rounded border text-[11px] font-mono-num transition",
                  on
                    ? "border-border bg-surface-deep text-foreground"
                    : "border-border/40 bg-transparent text-muted-foreground line-through",
                ].join(" ")}
              >
                <span
                  className="inline-block w-3 h-[2px]"
                  style={{ background: s.color, opacity: on ? 1 : 0.4 }}
                />
                {s.key}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 24, left: 0, bottom: 18 }}>
            <CartesianGrid stroke="hsl(var(--grid-line))" strokeDasharray="3 4" vertical={false} />
            <XAxis
              dataKey="epoch"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontFamily: "JetBrains Mono", fontSize: 11 }}
              label={{
                value: "Epoch",
                position: "insideBottom",
                offset: -8,
                style: { fontFamily: "DM Sans", fill: "hsl(var(--muted-foreground))", fontSize: 12 },
              }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontFamily: "JetBrains Mono", fontSize: 11 }}
              domain={[0.5, 3]}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--primary) / 0.4)", strokeDasharray: "3 3" }} />
            {SERIES.map(
              (s) =>
                enabled[s.key] && (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    stroke={s.color}
                    strokeWidth={2.4}
                    dot={false}
                    activeDot={{ r: 5, stroke: s.color, strokeWidth: 2, fill: "hsl(var(--background))" }}
                    animationDuration={1400}
                  />
                )
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
