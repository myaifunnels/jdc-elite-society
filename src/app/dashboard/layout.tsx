import { redirect } from "next/navigation";

import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { resolveAccess } from "@/lib/access-store";
import { getResolvedBrandingSettings } from "@/lib/branding-store";
import { listNotificationsForUser } from "@/lib/notification-store";
import { getImpersonator, requireSessionUser } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const user = await requireSessionUser();
  const impersonator = await getImpersonator();
  if (!user.passwordSet && !impersonator) {
    redirect("/account/password");
  }
  const [branding, access, notifications] = await Promise.all([
    getResolvedBrandingSettings(),
    resolveAccess(user),
    listNotificationsForUser(user.id, 16),
  ]);

  return (
    <DashboardFrame
      user={user}
      access={access.resolved}
      branding={branding}
      impersonator={impersonator}
      notifications={notifications}
    >
      {children}
    </DashboardFrame>
  );
}
