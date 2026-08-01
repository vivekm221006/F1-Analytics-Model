import { ButtonPrimary, ButtonGhost } from "@/components/ui/Button";
import { HudPanel } from "@/components/hud/HudPanel";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative z-10 flex min-h-screen flex-col justify-center px-6 md:px-12">
      <div
        id="eyebrow"
        className="mb-7 flex items-center gap-3 opacity-0"
      >
        <span className="h-px w-8 bg-gradient-to-r from-cyan to-transparent" />
        <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-cyan">
          Predictive race intelligence
        </span>
      </div>

      <h1 className="max-w-[1100px] text-[48px] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[64px] md:text-[88px] lg:text-[108px]">
        <span className="block overflow-hidden pb-2">
          <span
            id="headline-1"
            className="block translate-y-full"
          >
            Race strategy,
          </span>
        </span>
        <span className="block overflow-hidden pb-2">
          <span
            id="headline-2"
            className="block translate-y-full bg-gradient-to-r from-cyan via-[#5EEAD4] to-cyan bg-clip-text text-transparent"
          >
            decided in real time.
          </span>
        </span>
      </h1>

      <p
        id="hero-sub"
        className="mt-7 max-w-[540px] text-base leading-[1.7] text-ink-mid opacity-0"
      >
        An AI system trained on a decade of Formula 1 telemetry — predicting
        lap times, optimising pit windows, and simulating race outcomes
        before the pit wall calls them.
      </p>

      <div
        id="hero-cta"
        className="mt-11 flex flex-wrap items-center gap-5 opacity-0"
      >
        <Link href="/lap"><ButtonPrimary>Enter the control room</ButtonPrimary></Link>
      </div>

      <HudPanel />

      <div
        id="scroll-cue"
        className="absolute bottom-10 left-6 z-10 flex items-center gap-3 opacity-0 md:left-12"
      >
        <div className="relative h-10 w-px overflow-hidden bg-line-strong">
          <span className="absolute left-0 top-0 h-3.5 w-full animate-scroll-trace bg-cyan" />
        </div>
        <span className="text-[10px] uppercase tracking-[0.14em] text-ink-lo">
          Scroll to explore
        </span>
      </div>
    </section>
  );
}
