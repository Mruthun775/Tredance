import { CountUp } from "./CountUp";

interface StatCardProps {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  icon: string;
  tone: "cyan" | "amber" | "white" | "success";
  delay?: number;
  prefixSlot?: React.ReactNode;
  rawDisplay?: string; // for "3 / 3"
}

const toneClasses: Record<StatCardProps["tone"], string> = {
  cyan: "text-primary",
  amber: "text-accent",
  white: "text-foreground",
  success: "text-success",
};

export const StatCard = ({
  label,
  value,
  decimals = 0,
  suffix = "",
  icon,
  tone,
  delay = 0,
  rawDisplay,
}: StatCardProps) => {
  return (
    <div
      className="surface-card rounded-xl p-5 stagger-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-display">
        <span className="text-base">{icon}</span>
        <span>{label}</span>
      </div>
      <div
        className={`mt-3 font-mono-num font-bold leading-none tracking-tight whitespace-nowrap ${toneClasses[tone]} text-[clamp(1.5rem,7vw,2.75rem)] lg:text-[clamp(1.75rem,3.2vw,3rem)]`}
      >
        {rawDisplay ? (
          <>
            <CountUp end={value} decimals={decimals} /> {rawDisplay}
          </>
        ) : (
          <CountUp end={value} decimals={decimals} suffix={suffix} />
        )}
      </div>
    </div>
  );
};
