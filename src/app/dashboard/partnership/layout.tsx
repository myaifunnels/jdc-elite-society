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
      description="Pioneer and jdc-partner campaigns. 20% on recorded purchases, paid on the 15th and 30th. Each campaign has its own link and QR."
    >
      <PartnershipNav isAdmin={user.role === "admin"} />
      {children}
    </DashboardShell>
  );
}
