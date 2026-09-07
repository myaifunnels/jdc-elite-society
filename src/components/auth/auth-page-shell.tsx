import Link from "next/link";

import { SiteLogo } from "@/components/branding/site-logo";
import { BrandingSettings } from "@/lib/branding";

export function AuthPageShell({
  branding,
  children,
}: {
  branding: BrandingSettings;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-fullscreen">
      <div className="auth-fullscreen-backdrop" aria-hidden="true">
        <div className="auth-fullscreen-grid" />
      </div>

      <div className="auth-fullscreen-content">
        <SiteLogo branding={branding} href="/" />
        <div className="auth-fullscreen-form-body">{children}</div>
        <p className="auth-fullscreen-footer">
          Copyright &copy; {new Date().getFullYear()} JDC Elite Society ·{" "}
          <Link href="/privacy">Privacy Notice</Link>
        </p>
      </div>
    </div>
  );
}
