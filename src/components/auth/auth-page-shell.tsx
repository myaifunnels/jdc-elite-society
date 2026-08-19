import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page">
      <SiteHeader />
      <main className="auth-page-main">{children}</main>
      <SiteFooter />
    </div>
  );
}
