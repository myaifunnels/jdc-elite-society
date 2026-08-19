import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { UniversityCommunityEmbed } from "@/components/dashboard/university-community-embed";
import { requireSessionUser } from "@/lib/session";

export default async function UniversityPage() {
  const user = await requireSessionUser();
  const unlocked = user.accountStatus === "verified";
  const verifyHref = user.role === "member" ? "/dashboard/profile" : "/dashboard";

  return (
    <DashboardShell
      fill
      title="University"
      description={
        unlocked
          ? "The JDC Elite Society membership community, embedded from community.coachjdc.org."
          : "University opens after your account is verified."
      }
    >
      <UniversityCommunityEmbed unlocked={unlocked} verifyHref={verifyHref} />
    </DashboardShell>
  );
}
