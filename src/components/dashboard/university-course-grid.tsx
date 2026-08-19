import Link from "next/link";
import { GraduationCap, Lock } from "lucide-react";

import { MacosWindow } from "@/components/dashboard/macos-window";
import { UniversityCourse } from "@/data/university";
import { cn } from "@/lib/utils";

export function UniversityCourseGrid({
  courses,
  unlocked,
  verifyHref,
}: {
  courses: UniversityCourse[];
  unlocked: boolean;
  verifyHref: string;
}) {
  return (
    <div className="dashboard-widget-grid">
      {!unlocked ? (
        <MacosWindow title="Verify to unlock" className="dashboard-span-2">
          <p className="macos-lead" style={{ textAlign: "left" }}>
            University is open so you can see the JDC Elite Society membership courses. The lock stays on until your
            account is verified. Finish your profile and wait for the team to activate you — then every lesson opens.
          </p>
          <div className="macos-actions">
            <Link href={verifyHref} className="macos-btn macos-btn-primary">
              Verify my account
            </Link>
          </div>
        </MacosWindow>
      ) : null}

      {courses.map((course) => {
        const card = (
          <article className={cn("university-course-card", !unlocked && "is-locked")}>
            <span className="university-course-kicker">
              <GraduationCap size={14} aria-hidden />
              {course.source}
            </span>
            {!unlocked ? (
              <span className="university-lock-badge">
                <Lock size={13} aria-hidden />
                Locked
              </span>
            ) : null}
            <h2>{course.title}</h2>
            <p>{course.summary}</p>
            <p className="university-course-meta">
              {course.lessons.length} lessons · {course.audience}
            </p>
          </article>
        );

        if (!unlocked) {
          return (
            <Link key={course.slug} href={verifyHref} className="university-course-link">
              {card}
            </Link>
          );
        }

        return (
          <Link key={course.slug} href={`/dashboard/university/${course.slug}`} className="university-course-link">
            {card}
          </Link>
        );
      })}
    </div>
  );
}
