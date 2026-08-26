import { UniversityCommunityEmbed } from "@/components/dashboard/university-community-embed";
import { UniversityCourseGrid } from "@/components/dashboard/university-course-grid";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { listUniversityCourses } from "@/lib/ghl-courses";
import { requireCapability } from "@/lib/session";
import { hasUniversityAccess } from "@/lib/university-access";

export default async function UniversityPage() {
  const { user } = await requireCapability("university");
  const unlocked = hasUniversityAccess(user);
  const verifyHref = "/dashboard";
  const courses = await listUniversityCourses();

  return (
    <DashboardShell
      title="University"
      description={
        unlocked
          ? "The JDC Elite Society community plus Mastermind Sessions 1 and 2."
          : "University is locked because payment was not verified."
      }
    >
      <div className="dashboard-widget-grid">
        <div className="dashboard-span-2" style={{ minHeight: "32rem" }}>
          <UniversityCommunityEmbed unlocked={unlocked} verifyHref={verifyHref} />
        </div>
      </div>
      <UniversityCourseGrid courses={courses} unlocked={unlocked} verifyHref={verifyHref} />
    </DashboardShell>
  );
}
