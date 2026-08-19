import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { resolveAccess } from "@/lib/access-store";
import { getResolvedBrandingSettings } from "@/lib/branding-store";
import { requireSessionUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const user = await requireSessionUser();
  const [branding, access] = await Promise.all([getResolvedBrandingSettings(), resolveAccess(user)]);

  return (
    <DashboardFrame user={user} access={access.resolved} branding={branding}>
      {children}
    </DashboardFrame>
  );
}
