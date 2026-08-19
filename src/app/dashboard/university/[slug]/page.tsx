import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { getUniversityCourse } from "@/data/university";
import { listUniversityCourses } from "@/lib/ghl-courses";
import { requireSessionUser } from "@/lib/session";

export default async function UniversityCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireSessionUser();
  const { slug } = await params;
  const catalog = await listUniversityCourses();
  const course = catalog.find((item) => item.slug === slug) ?? getUniversityCourse(slug);

  if (!course) {
    notFound();
  }

  const unlocked = user.accountStatus === "verified";
  const verifyHref = user.role === "member" ? "/dashboard/profile" : "/dashboard";

  return (
    <DashboardShell
      title={course.title}
      description={unlocked ? course.summary : "This course is locked until your account is verified."}
    >
      <div className="dashboard-widget-grid">
        <MacosWindow title={unlocked ? "Lessons" : "Locked course"} className="dashboard-span-2">
          <p className="macos-kicker">{course.source}</p>
          <p className="macos-lead" style={{ textAlign: "left" }}>
            {unlocked
              ? course.audience
              : "Verify your account to open the JDC Elite Society membership lessons. The lock is the invitation."}
          </p>

          <ol className={unlocked ? "university-lesson-list" : "university-lesson-list is-locked"}>
            {course.lessons.map((lesson, index) => (
              <li key={lesson.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{lesson.title}</strong>
                  <em>{lesson.summary}</em>
                </div>
                {!unlocked ? <Lock size={14} aria-hidden /> : null}
              </li>
            ))}
          </ol>

          <div className="macos-actions">
            {unlocked ? (
              <Link href="/dashboard/university" className="macos-btn macos-btn-secondary">
                Back to University
              </Link>
            ) : (
              <Link href={verifyHref} className="macos-btn macos-btn-primary">
                Verify my account
              </Link>
            )}
          </div>
        </MacosWindow>
      </div>
    </DashboardShell>
  );
}
