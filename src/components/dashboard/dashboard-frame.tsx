import { Suspense } from "react";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { ImpersonationBanner } from "@/components/dashboard/impersonation-banner";
import { MacosBootScreen } from "@/components/dashboard/macos-boot-screen";
import { MacosRouteProgress } from "@/components/dashboard/macos-route-progress";
import { AccessMap } from "@/lib/access";
import { BrandingSettings } from "@/lib/branding";
import { membershipLabel } from "@/lib/membership";
import { AuthUser } from "@/lib/types";

export function DashboardFrame({
  user,
  access,
  branding,
  impersonator,
  children,
}: {
  user: AuthUser;
  access: AccessMap;
  branding: BrandingSettings;
  impersonator?: AuthUser | null;
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-desktop">
      <a href="#dashboard-main" className="skip-link">
        Skip to dashboard content
      </a>
      <Suspense fallback={null}>
        <MacosBootScreen name={user.name} photoUrl={user.facebookPhotoUrl} />
      </Suspense>
      <div className="dashboard-app">
        <MacosRouteProgress />
        <DashboardSidebar
          role={user.role}
          userName={user.name}
          membershipLabel={membershipLabel(user.memberships)}
          accountStatus={user.accountStatus}
          branding={branding}
          access={access}
        />
        <div className="dashboard-app-main min-w-0">
          {impersonator ? <ImpersonationBanner user={user} impersonator={impersonator} /> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
