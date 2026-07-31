"use client";

import Link from "next/link";

const navLinks = [
  { label: "Lap Predictor", href: "/lap" },
  { label: "Pit Strategy", href: "/pit" },
  { label: "Race Simulator", href: "/race" },
  { label: "Strategy", href: "/strategy" },
  { label: "Analytics", href: "/analytics" },
];

export function Nav() {
  return (
    <nav
      id="nav"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-7 md:px-12 opacity-0 -translate-y-4"
    >
      <Link href="/" className="flex items-center gap-2.5">
        <span
          className="h-[7px] w-[7px] rounded-full bg-cyan animate-pulse-dot"
          style={{ boxShadow: "0 0 10px #00E5C9" }}
          aria-hidden="true"
        />
        <span className="text-[13px] font-semibold tracking-[0.16em] uppercase text-ink-hi">
          F1 Race Engineer
        </span>
        <span className="mono text-[10px] text-ink-lo tracking-[0.1em] ml-1.5">
          AI / v2.4
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-9">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            data-cursor-hover
            className="group relative pb-1 text-xs uppercase tracking-[0.08em] text-ink-mid transition-colors hover:text-ink-hi"
          >
            {link.label}
            <span className="absolute bottom-0 left-0 h-px w-0 bg-cyan transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-hover:w-full" />
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.02] px-3.5 py-1.5 backdrop-blur-xl">
        <span
          className="h-[5px] w-[5px] rounded-full bg-cyan"
          style={{ boxShadow: "0 0 6px #00E5C9" }}
          aria-hidden="true"
        />
        <span className="mono text-[10px] uppercase tracking-[0.08em] text-ink-mid">
          System online
        </span>
      </div>
    </nav>
  );
}
