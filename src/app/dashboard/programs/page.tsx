import { ChevronRight } from "lucide-react";
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

  type Entry = (typeof catalogEntries)[number];
  const mineOf = (entry: Entry) => items.find((item) => item.programSlug === entry.slug);
  const availedEntries = catalogEntries.filter((entry) => availedSlugs.has(entry.slug));
  const exploreEntries = catalogEntries.filter((entry) => !availedSlugs.has(entry.slug));

  const renderCard = (entry: Entry, availed: boolean) => {
    const mine = mineOf(entry);
    return (
      <li key={entry.slug} className="programs-card-item">
        <Link href={entry.href} className={`programs-card${availed ? " is-availed" : ""}`}>
          <span className="programs-card-mark" aria-hidden>
            {entry.title.slice(0, 1)}
          </span>
          <span className="programs-card-copy">
            <span className="programs-card-title">{entry.title}</span>
            {entry.description ? <span className="programs-card-desc">{entry.description}</span> : null}
            {availed && mine ? (
              <span className="programs-card-meta">
                <span className={`programs-dot is-${mine.status}`} aria-hidden />
                {STATUS_LABEL[mine.status]} · since {formatDate(mine.availedAt)}
              </span>
            ) : null}
          </span>
          <span className="programs-card-go" aria-hidden>
            {availed ? "Open" : "Learn more"}
            <ChevronRight size={16} />
          </span>
        </Link>
      </li>
    );
  };

  return (
    <DashboardShell title="Programs" description="What you've availed, and what you can grow into next.">
      <div className="programs-page">
        <section aria-labelledby="programs-yours">
          <h2 id="programs-yours" className="programs-heading">
            Your programs
          </h2>
          {availedEntries.length > 0 ? (
            <ul className="programs-grid">{availedEntries.map((entry) => renderCard(entry, true))}</ul>
          ) : (
            <div className="programs-empty">
              <p>You haven&apos;t availed a program yet. Pick one below to get started.</p>
            </div>
          )}
        </section>
        {exploreEntries.length > 0 ? (
          <section aria-labelledby="programs-explore">
            <h2 id="programs-explore" className="programs-heading">
              Explore more
            </h2>
            <ul className="programs-grid">{exploreEntries.map((entry) => renderCard(entry, false))}</ul>
          </section>
        ) : null}
      </div>
    </DashboardShell>
  );
}
