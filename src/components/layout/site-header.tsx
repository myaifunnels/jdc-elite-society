import { SiteLogo } from "@/components/branding/site-logo";
import { PublicHeaderActions } from "@/components/layout/public-header-actions";
import { siteContent } from "@/data/site-content";
import { getResolvedBrandingSettings } from "@/lib/branding-store";
import { getSessionUser } from "@/lib/session";

export async function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const user = await getSessionUser();
  const branding = await getResolvedBrandingSettings();

  return (
    <header className={overlay ? "site-header site-header-overlay" : "site-header"}>
      <div className="container-shell site-header-bar">
        <div className="site-header-brand fade-up">
          <SiteLogo branding={branding} href="/" inverted={overlay} compact={Boolean(branding.logoUrl)} />
        </div>
        <PublicHeaderActions
          overlay={overlay}
          ctaHref="/programs"
          ctaLabel={siteContent.headerCta}
          account={
            user
              ? { name: user.name, email: user.email, photoUrl: user.facebookPhotoUrl }
              : null
          }
        />
      </div>
    </header>
  );
}
