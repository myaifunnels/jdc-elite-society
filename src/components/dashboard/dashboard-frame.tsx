import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { BrandingSettings } from "@/lib/branding";
import { membershipLabel } from "@/lib/membership";
import { AuthUser } from "@/lib/types";

export function DashboardFrame({
  user,
  branding,
  children,
}: {
  user: AuthUser;
  branding: BrandingSettings;
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-desktop">
      <a href="#dashboard-main" className="skip-link">
        Skip to dashboard content
      </a>
      <div className="dashboard-app">
        <DashboardSidebar
          role={user.role}
          userName={user.name}
          membershipLabel={membershipLabel(user.memberships)}
          branding={branding}
          affiliateAccess={user.affiliateAccess}
        />
        <div className="dashboard-app-main min-w-0">{children}</div>
      </div>
    </div>
  );
}
