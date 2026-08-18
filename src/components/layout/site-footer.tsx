import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[color:var(--background)]/50 py-10 backdrop-blur-2xl">
      <div className="container-shell flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl space-y-2 fade-up">
          <p className="eyebrow text-xs">
            Coach JDC Platform
          </p>
          <p className="text-2xl font-semibold tracking-[-0.02em]">
            Built for growth, conversion, and coordinated follow-up.
          </p>
          <p className="text-sm text-[var(--muted)]">
            Public marketing pages, program storytelling, CRM capture, and partner visibility in one platform.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-[var(--muted)]">
          <Link className="pressable" href="/programs">Programs</Link>
          <Link className="pressable" href="/contact">Contact</Link>
          <Link className="pressable" href="/login">Login</Link>
          <Link className="pressable" href="/dashboard">Dashboard</Link>
        </div>
      </div>
    </footer>
  );
}
