import { AccountProfileDashboard } from "@/components/dashboard/account-profile-dashboard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { hasAccess } from "@/lib/access";
import { requireSessionUser } from "@/lib/session";
import { resolveAccess } from "@/lib/access-store";

export default async function AccountProfilePage() {
  const user = await requireSessionUser();
  const access = await resolveAccess(user);

  return (
    <DashboardShell
      title="Account"
      description="Edit your photo, details, membership, and password. Email stays on this login."
    >
      <AccountProfileDashboard user={user} showWorkspaceLinks showPath={hasAccess(access, "path")} />
    </DashboardShell>
  );
}
