import Link from "next/link";

export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-fullscreen">
      <div className="auth-fullscreen-backdrop" aria-hidden="true">
        <div className="auth-fullscreen-grid" />
      </div>

      <div className="auth-fullscreen-content">
        <div className="auth-fullscreen-form-body">{children}</div>
        <p className="auth-fullscreen-footer">
          Copyright &copy; {new Date().getFullYear()} JDC Elite Society ·{" "}
          <Link href="/privacy">Privacy Notice</Link>
        </p>
      </div>
    </div>
  );
}
