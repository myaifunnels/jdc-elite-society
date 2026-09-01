export function DashboardShell({
  title,
  description,
  actions,
  children,
  fill = false,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  fill?: boolean;
}) {
  if (fill) {
    return (
      <main id="dashboard-main" tabIndex={-1} className="university-fill outline-none">
        <h1 className="sr-only">{title}</h1>
        <p className="sr-only">{description}</p>
        {children}
      </main>
    );
  }

  return (
    <>
      <header className="dashboard-toolbar">
        <div>
          <p className="macos-kicker">Workspace</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {actions ? <div className="dashboard-toolbar-actions">{actions}</div> : null}
      </header>
      <main id="dashboard-main" tabIndex={-1} className="dashboard-content outline-none">
        {children}
      </main>
    </>
  );
}
