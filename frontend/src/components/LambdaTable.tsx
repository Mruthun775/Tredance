import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Row {
  lambda: string;
  description: string;
  accuracy: number;
  sparsity: number;
  status: { label: string; tone: "success" | "amber" | "danger" };
  detail: string;
}

const ROWS: Row[] = [
  {
    lambda: "1e-5 (Low)",
    description: "Minimal pruning pressure",
    accuracy: 73.4,
    sparsity: 8.2,
    status: { label: "✅ Best Acc", tone: "success" },
    detail:
      "Lowest sparsity penalty: the network keeps almost all weights and prioritises classification accuracy. Best for accuracy-critical deployments where model size is not the bottleneck.",
  },
  {
    lambda: "1e-4 (Med)",
    description: "Balanced trade-off",
    accuracy: 71.1,
    sparsity: 34.7,
    status: { label: "⚖️ Balanced", tone: "amber" },
    detail:
      "Sweet spot: ~⅓ of gates pruned with only 2.3pp accuracy drop. Good default for edge inference where you want a leaner model without losing much capability.",
  },
  {
    lambda: "1e-3 (High)",
    description: "Aggressive pruning",
    accuracy: 66.8,
    sparsity: 72.3,
    status: { label: "🔥 Max Sparse", tone: "danger" },
    detail:
      "Heavy L1 pressure forces ~72% of gates to zero. Massive compute/memory savings, but accuracy drops 6.6pp. Use when latency or footprint trumps top-line accuracy.",
  },
];

const toneStyles: Record<Row["status"]["tone"], string> = {
  success: "bg-success/15 text-success border-success/30",
  amber: "bg-accent/15 text-accent border-accent/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
};

const chartData = ROWS.map((r) => ({
  lambda: r.lambda.split(" ")[0],
  Accuracy: r.accuracy,
  Sparsity: r.sparsity,
}));

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-card rounded-md p-3 text-xs font-mono-num">
      <div className="font-display text-primary mb-1">λ = {label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-sm"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">{p.dataKey}:</span>
          <span className="text-foreground">{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

export const LambdaTable = () => {
  const [expanded, setExpanded] = useState<string | null>("1e-5 (Low)");

  return (
    <div className="space-y-6">
      <div className="surface-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/60 text-primary font-display text-xs uppercase tracking-wider">
              <th className="text-left px-5 py-3 w-8"></th>
              <th className="text-left px-5 py-3">Lambda (λ)</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">Description</th>
              <th className="text-right px-5 py-3">Test Accuracy</th>
              <th className="text-right px-5 py-3">Sparsity</th>
              <th className="text-center px-5 py-3">Status</th>
            </tr>
          </thead>
          {ROWS.map((r, i) => {
            const isOpen = expanded === r.lambda;
            return (
              <tbody key={r.lambda}>
                <tr
                  onClick={() => setExpanded(isOpen ? null : r.lambda)}
                  className={[
                    "group cursor-pointer border-l-2 transition",
                    isOpen
                      ? "border-l-primary bg-primary/5"
                      : "border-l-transparent hover:border-l-primary hover:bg-primary/5",
                    i % 2 === 0 ? "bg-card" : "bg-surface-deep",
                  ].join(" ")}
                >
                  <td className="px-5 py-4 text-muted-foreground group-hover:text-primary">
                    <span
                      className="inline-block transition-transform"
                      style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0)" }}
                    >
                      ▶
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono-num text-foreground">{r.lambda}</td>
                  <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">
                    {r.description}
                  </td>
                  <td className="px-5 py-4 text-right font-mono-num text-primary font-bold">
                    {r.accuracy.toFixed(1)}%
                  </td>
                  <td className="px-5 py-4 text-right font-mono-num text-accent font-bold">
                    {r.sparsity.toFixed(1)}%
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full border text-xs font-display ${toneStyles[r.status.tone]}`}
                    >
                      {r.status.label}
                    </span>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="bg-surface-deep border-l-2 border-l-primary">
                    <td colSpan={6} className="px-5 pb-5 pt-1">
                      <div className="grid md:grid-cols-3 gap-4 text-xs">
                        <div className="md:col-span-2 text-foreground/85 leading-relaxed">
                          {r.detail}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded border border-border bg-card p-3">
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">
                              Active params
                            </div>
                            <div className="font-mono-num text-primary text-base font-bold">
                              {Math.round(1081344 * (1 - r.sparsity / 100)).toLocaleString()}
                            </div>
                          </div>
                          <div className="rounded border border-border bg-card p-3">
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">
                              Pruned params
                            </div>
                            <div className="font-mono-num text-accent text-base font-bold">
                              {Math.round(1081344 * (r.sparsity / 100)).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            );
          })}
        </table>
      </div>

      <div className="surface-card rounded-xl p-5 h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="28%">
            <CartesianGrid stroke="hsl(var(--grid-line))" strokeDasharray="3 4" vertical={false} />
            <XAxis
              dataKey="lambda"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontFamily: "JetBrains Mono", fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontFamily: "JetBrains Mono", fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip cursor={{ fill: "hsl(var(--primary) / 0.06)" }} content={<ChartTooltip />} />
            <Legend
              wrapperStyle={{ fontFamily: "DM Sans", fontSize: 12, paddingTop: 8 }}
              iconType="square"
            />
            <Bar
              dataKey="Accuracy"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              animationDuration={1100}
            />
            <Bar
              dataKey="Sparsity"
              fill="hsl(var(--accent))"
              radius={[4, 4, 0, 0]}
              animationDuration={1100}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
