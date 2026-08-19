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
    <div className="min-h-dvh">
      <a href="#dashboard-main" className="skip-link">
        Skip to dashboard content
      </a>
      <DashboardSidebar
        role={user.role}
        userName={user.name}
        membershipLabel={membershipLabel(user.memberships)}
        branding={branding}
      />
      <div className="min-w-0 lg:pl-[17rem]">{children}</div>
    </div>
  );
}
