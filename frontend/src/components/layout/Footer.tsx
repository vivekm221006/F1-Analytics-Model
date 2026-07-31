export function Footer() {
  return (
    <footer className="relative z-10 flex flex-col items-start justify-between gap-3 border-t border-line px-6 py-12 md:flex-row md:items-center md:px-12">
      <div className="text-xs uppercase tracking-[0.1em] text-ink-lo">
        F1 AI Race Engineer
      </div>
      <div className="mono text-[11px] text-ink-lo">
        Built on XGBoost · 2009–2024 season data
      </div>
    </footer>
  );
}
