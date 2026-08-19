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
      <header className="dashboard-toolbar">
        <div>
          <p className="macos-kicker">Workspace</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>
      <main id="dashboard-main" tabIndex={-1} className="dashboard-content outline-none">
        {children}
      </main>
    </>
  );
}
