export function DashboardShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="dashboard-shell-head px-5 py-6 lg:px-8">
        <p className="eyebrow text-xs">Workspace</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">{description}</p>
      </header>
      <main id="dashboard-main" tabIndex={-1} className="px-5 py-8 lg:px-8 outline-none">
        {children}
      </main>
    </>
  );
}
