import Link from "next/link";

import { JdcWordmark, SiteLogo } from "@/components/branding/site-logo";
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
      <div className="auth-fullscreen-form">
        <SiteLogo branding={branding} href="/" />
        <div className="auth-fullscreen-form-body">{children}</div>
        <p className="auth-fullscreen-footer">
          Copyright &copy; {new Date().getFullYear()} JDC Elite Society ·{" "}
          <Link href="/privacy">Privacy Notice</Link>
        </p>
      </div>

      <div className="auth-fullscreen-visual" aria-hidden="true">
        <div className="auth-fullscreen-grid" />
        <div className="auth-fullscreen-brandmark">
          <div className="auth-fullscreen-logo">
            <JdcWordmark />
            <span className="auth-fullscreen-logo-society">Elite Society</span>
          </div>
          <p className="auth-fullscreen-tagline">Premium Coaching · Mentorship · Community</p>
        </div>
      </div>
    </div>
  );
}
