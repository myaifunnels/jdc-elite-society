import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { UniversityLessonMedia } from "@/components/dashboard/university-lesson-media";
import { getUniversityCourse } from "@/data/university";
import { listUniversityCourses } from "@/lib/ghl-courses";
import { requireCapability } from "@/lib/session";
import { hasUniversityAccess } from "@/lib/university-access";

export default async function UniversityCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { user } = await requireCapability("university");
  const { slug } = await params;
  const catalog = await listUniversityCourses();
  const course = catalog.find((item) => item.slug === slug) ?? getUniversityCourse(slug);

  if (!course) {
    notFound();
  }

  const unlocked = hasUniversityAccess(user);
  const verifyHref = "/dashboard";

  return (
    <DashboardShell
      title={course.title}
      description={unlocked ? course.summary : "This course is locked because payment was not verified."}
    >
      <div className="dashboard-widget-grid">
        <MacosWindow title={unlocked ? "Lessons" : "Locked course"} className="dashboard-span-2">
          <p className="macos-kicker">{course.source}</p>
          <p className="macos-lead" style={{ textAlign: "left" }}>
            {unlocked
              ? course.audience
              : "The team rejected or could not verify this payment. University stays locked until they restore access."}
          </p>

          <ol className={unlocked ? "university-lesson-list" : "university-lesson-list is-locked"}>
            {course.lessons.map((lesson, index) => (
              <li key={`${lesson.title}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div className="university-lesson-body">
                  {lesson.moduleTitle ? <p className="university-lesson-module">{lesson.moduleTitle}</p> : null}
                  <strong>{lesson.title}</strong>
                  <em>{lesson.summary}</em>
                  <UniversityLessonMedia lesson={lesson} unlocked={unlocked} />
                  {unlocked && lesson.materials?.length ? (
                    <ul className="university-materials">
                      {lesson.materials.map((file) => (
                        <li key={file.url}>
                          <a href={file.url} target="_blank" rel="noreferrer">
                            {file.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
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
                Back to dashboard
              </Link>
            )}
          </div>
        </MacosWindow>
      </div>
    </DashboardShell>
  );
}
