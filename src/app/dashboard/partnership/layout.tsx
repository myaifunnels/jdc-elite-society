import { PartnershipNav } from "@/components/dashboard/partnership-nav";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ensureOwnAffiliateProfile } from "@/app/dashboard/partnership/actions";
import { requireAffiliateAccess } from "@/lib/session";

export default async function PartnershipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAffiliateAccess();
  await ensureOwnAffiliateProfile();

  return (
    <DashboardShell
      title="JDC Partnership Program"
      description="Invite-only workspace. You earn 20% on recorded sales. Payouts are reviewed and released on the 15th and 30th (last day of February). Nothing is deposited automatically."
    >
      <PartnershipNav isAdmin={user.role === "admin"} />
      {children}
    </DashboardShell>
  );
}
