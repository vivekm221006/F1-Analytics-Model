import { systemModules } from "@/lib/tokens";
import { ModuleIcon } from "./ModuleIcon";
import Link from "next/link";

const moduleRoutes: Record<string, string> = {
  "lap-predictor": "/lap",
  "pit-strategy": "/pit",
  "race-simulator": "/race",
  "strategy-optimizer": "/strategy",
  "explainability": "/analytics",
};

export function ModuleGrid() {
  return (
    <section id="intel" className="relative z-10 mx-auto max-w-[1400px] px-6 py-32 md:px-12 md:py-40">
      <div data-reveal className="reveal-up mb-20 max-w-[640px]">
        <div className="mb-4.5 flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-cyan">
          <span className="h-px w-6 bg-cyan" />
          System modules
        </div>
        <h2 className="text-[32px] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[40px] md:text-[52px]">
          Five engines.
          <br />
          One pit wall.
        </h2>
        <p className="mt-5 max-w-[520px] text-base leading-[1.7] text-ink-mid">
          Each module runs independently on trained XGBoost models, feeding
          a single live view of what the car is doing — and what it should
          do next.
        </p>
      </div>

      <div
        data-reveal
        className="reveal-up grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3"
      >
        {systemModules.map((mod) => (
          <Link
            key={mod.id}
            href={moduleRoutes[mod.id] || "/"}
            className="group relative bg-panel p-8 transition-all duration-[400ms] hover:bg-panel-2"
          >
            <div className="mono absolute right-8 top-8 text-[9px] tracking-[0.1em] text-ink-lo">
              {mod.tag}
            </div>
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-[10px] border border-line-strong bg-cyan/5 text-cyan transition-colors group-hover:border-cyan/30 group-hover:bg-cyan/10">
              <ModuleIcon name={mod.icon} />
            </div>
            <h3 className="mb-2.5 text-[17px] font-semibold tracking-[-0.01em]">
              {mod.title}
            </h3>
            <p className="text-[13.5px] leading-[1.6] text-ink-mid">
              {mod.description}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-cyan opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Open module
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

