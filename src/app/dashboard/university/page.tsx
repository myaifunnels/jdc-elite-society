import { UniversityCommunityEmbed } from "@/components/dashboard/university-community-embed";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireCapability } from "@/lib/session";
import { hasUniversityAccess } from "@/lib/university-access";

export default async function UniversityPage() {
  const { user } = await requireCapability("university");
  const unlocked = hasUniversityAccess(user);
  const verifyHref = "/dashboard";

  return (
    <DashboardShell
      fill
      title="University"
      description={
        unlocked
          ? "The JDC Elite Society community plus Mastermind Sessions 1 and 2."
          : "University is locked because payment was not verified."
      }
    >
      <UniversityCommunityEmbed unlocked={unlocked} verifyHref={verifyHref} />
    </DashboardShell>
  );
}
