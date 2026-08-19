import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { getResolvedBrandingSettings } from "@/lib/branding-store";
import { requireStaffUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const user = await requireStaffUser();
  const branding = await getResolvedBrandingSettings();

  return (
    <DashboardFrame role={user.role} userName={user.name} branding={branding}>
      {children}
    </DashboardFrame>
  );
}
