import { hudMetrics } from "@/lib/tokens";

export function HudPanel() {
  return (
    <div
      id="hud"
      className="absolute right-12 top-1/2 hidden w-[280px] -translate-y-1/2 opacity-0 lg:block"
    >
      {hudMetrics.map((metric) => (
        <div
          key={metric.label}
          className="mb-3.5 rounded-xl border border-line bg-panel/50 p-5 backdrop-blur-2xl"
        >
          <div className="mb-2.5 flex justify-between text-[9px] uppercase tracking-[0.14em] text-ink-lo">
            <span>{metric.label}</span>
            <span className="mono text-cyan">
              {metric.status === "live" ? "● live" : "● active"}
            </span>
          </div>

          {metric.rows.map((row, i) => (
            <div key={row.key}>
              <div
                className={`flex items-baseline justify-between py-1.5 ${
                  i > 0 ? "border-t border-line" : ""
                }`}
              >
                <span className="text-[11px] text-ink-mid">{row.key}</span>
                <span
                  className={`mono text-[13px] font-medium ${
                    row.barPct !== undefined ? "text-cyan" : "text-ink-hi"
                  }`}
                >
                  {row.value}
                </span>
              </div>
              {row.barPct !== undefined && (
                <div className="mt-1 h-[3px] overflow-hidden rounded-sm bg-white/[0.06]">
                  <div
                    className="h-full rounded-sm bg-cyan"
                    style={{
                      width: `${row.barPct}%`,
                      boxShadow: "0 0 6px #00E5C9",
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
