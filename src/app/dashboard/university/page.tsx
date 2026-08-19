import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { UniversityCourseGrid } from "@/components/dashboard/university-course-grid";
import { listUniversityCourses } from "@/lib/ghl-courses";
import { requireSessionUser } from "@/lib/session";

export default async function UniversityPage() {
  const user = await requireSessionUser();
  const courses = await listUniversityCourses();
  const unlocked = user.accountStatus === "verified";
  const verifyHref = user.role === "member" ? "/dashboard/profile" : "/dashboard";

  return (
    <DashboardShell
      title="University"
      description={
        unlocked
          ? "Membership courses and lesson videos from the JDC Elite Society subaccount in AiFunnels GHL."
          : "See the membership courses waiting for you. Unlock the videos by verifying your account."
      }
    >
      <UniversityCourseGrid courses={courses} unlocked={unlocked} verifyHref={verifyHref} />
    </DashboardShell>
  );
}
