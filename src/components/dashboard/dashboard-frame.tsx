import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { BrandingSettings } from "@/lib/branding";
import { DashboardRole } from "@/lib/types";

export function DashboardFrame({
  role,
  userName,
  branding,
  children,
}: {
  role: DashboardRole;
  userName: string;
  branding: BrandingSettings;
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-desktop">
      <a href="#dashboard-main" className="skip-link">
        Skip to dashboard content
      </a>
      <div className="dashboard-app">
        <DashboardSidebar role={role} userName={userName} branding={branding} />
        <div className="dashboard-app-main min-w-0">{children}</div>
      </div>
    </div>
  );
}
