import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { programs } from "@/data/programs";
import { requireCapability } from "@/lib/session";
import { listUserPrograms, syncUserProgramsFromCheckouts, type UserProgramStatus } from "@/lib/user-programs-store";

const EXTRA_PROGRAMS: Record<string, { title: string; href: string }> = {
  "jdc-elite-society": { title: "JDC Elite Society", href: "/programs/jdc-elite-society" },
  "season-1-building": { title: "Season 1: Building", href: "/building" },
  "season-2-duplication": { title: "Season 2: Duplication", href: "/duplication" },
};

const STATUS_LABEL: Record<UserProgramStatus, string> = {
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function ProgramsPage() {
  const { user } = await requireCapability("programs");

  try {
    await syncUserProgramsFromCheckouts(user.id);
  } catch (error) {
    console.error("Failed to sync availed programs", error);
  }
  const items = await listUserPrograms(user.id);

  const availedSlugs = new Set(items.filter((item) => item.status !== "cancelled").map((item) => item.programSlug));
  const catalogEntries = [
    ...programs.map((program) => ({
      slug: program.slug,
      title: program.title,
      description: program.shortDescription,
      href: `/programs/${program.slug}`,
    })),
    ...Object.entries(EXTRA_PROGRAMS).map(([slug, extra]) => ({
      slug,
      title: extra.title,
      description: "",
      href: extra.href,
    })),
  ];

  return (
    <DashboardShell title="Programs" description="All our programs. The ones you've availed are marked, with where they stand.">
      <div className="grid gap-4 md:grid-cols-2">
        {catalogEntries.map((entry) => {
          const mine = items.find((item) => item.programSlug === entry.slug);
          const availed = availedSlugs.has(entry.slug);
          return (
            <article key={entry.slug} className="card-surface grid gap-2 p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="m-0 text-lg font-semibold">{entry.title}</h2>
                {availed && mine ? (
                  <span className={mine.status === "active" ? "status-pill is-verified" : "status-pill is-quiet"}>
                    {STATUS_LABEL[mine.status]}
                  </span>
                ) : (
                  <span className="status-pill is-quiet">Not availed</span>
                )}
              </div>
              {entry.description ? <p className="m-0 text-[var(--muted)]">{entry.description}</p> : null}
              {availed && mine ? (
                <p className="m-0 text-sm text-[var(--muted)]">Availed {formatDate(mine.availedAt)}</p>
              ) : null}
              <Link
                href={entry.href}
                className={`${availed ? "button-secondary" : "button-primary"} pressable mt-2 inline-flex w-fit`}
              >
                {availed ? "View program" : "Learn more"}
              </Link>
            </article>
          );
        })}
      </div>
    </DashboardShell>
  );
}
