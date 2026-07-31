import Link from "next/link";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between border-b border-line pb-6 pt-12">
      <div>
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-ink-mid hover:text-cyan transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to Hub
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-ink-hi sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-ink-mid">{subtitle}</p>}
      </div>
    </div>
  );
}
