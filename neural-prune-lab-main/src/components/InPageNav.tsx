import { useEffect, useState } from "react";

const ITEMS = [
  { id: "stats", label: "Overview" },
  { id: "architecture", label: "Architecture" },
  { id: "lambda", label: "λ Results" },
  { id: "gates", label: "Gates" },
  { id: "why", label: "Why L1" },
  { id: "loss", label: "Loss" },
];

export const InPageNav = () => {
  const [active, setActive] = useState("stats");

  useEffect(() => {
    const sections = ITEMS.map((i) => document.getElementById(i.id)).filter(
      Boolean
    ) as HTMLElement[];

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  const handleClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="border-b border-border bg-surface-deep/70 backdrop-blur sticky top-[73px] md:top-[81px] z-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <ul className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
          {ITEMS.map((i) => {
            const isActive = active === i.id;
            return (
              <li key={i.id}>
                <a
                  href={`#${i.id}`}
                  onClick={handleClick(i.id)}
                  className={[
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider whitespace-nowrap transition",
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/40"
                      : "text-muted-foreground hover:text-foreground border border-transparent hover:border-border",
                  ].join(" ")}
                >
                  <span className={isActive ? "text-primary" : "text-muted-foreground"}>
                    {String(ITEMS.indexOf(i) + 1).padStart(2, "0")}
                  </span>
                  <span>{i.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
