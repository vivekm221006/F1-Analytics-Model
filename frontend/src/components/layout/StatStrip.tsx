import { heroStats } from "@/lib/tokens";

export function StatStrip() {
  return (
    <div className="relative z-10 grid grid-cols-2 border-t border-line bg-void/40 backdrop-blur-md md:grid-cols-4">
      {heroStats.map((stat, i) => (
        <div
          key={stat.label}
          data-reveal
          className={`reveal-up border-line px-6 py-9 md:px-12 ${
            i < heroStats.length - 1 ? "border-r" : ""
          }`}
        >
          <div className="flex items-baseline gap-1 text-[32px] font-bold tracking-[-0.02em] text-ink-hi md:text-[36px]">
            {stat.value}
            <span className="text-base font-medium text-cyan">
              {stat.unit}
            </span>
          </div>
          <div className="mt-2 text-xs tracking-[0.04em] text-ink-lo">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
