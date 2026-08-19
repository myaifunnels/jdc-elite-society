import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { getResolvedBrandingSettings } from "@/lib/branding-store";
import { requireSessionUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const user = await requireSessionUser();
  const branding = await getResolvedBrandingSettings();

  return (
    <DashboardFrame user={user} branding={branding}>
      {children}
    </DashboardFrame>
  );
}
