import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getProgram } from "@/data/programs";
import { requireCapability } from "@/lib/session";
import { listUserPrograms, syncUserProgramsFromCheckouts, type UserProgramStatus } from "@/lib/user-programs-store";

const EXTRA_PROGRAMS: Record<string, { title: string; href: string }> = {
  "jdc-elite-society": { title: "JDC Elite Society", href: "/programs/jdc-elite-society" },
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

  return (
    <DashboardShell title="Programs" description="Every program you've availed and where it stands.">
      {items.length === 0 ? (
        <div className="card-surface p-8 text-center text-[var(--muted)]">
          <p className="m-0">You haven&apos;t availed a program yet.</p>
          <Link href="/programs" className="button-primary pressable mt-4 inline-flex">
            Browse programs
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => {
            const catalog = getProgram(item.programSlug);
            const extra = EXTRA_PROGRAMS[item.programSlug];
            const title = catalog?.title ?? extra?.title ?? item.programSlug;
            const href = catalog ? `/programs/${catalog.slug}` : (extra?.href ?? "/programs");
            return (
              <article key={item.id} className="card-surface grid gap-2 p-6">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="m-0 text-lg font-semibold">{title}</h2>
                  <span className={item.status === "active" ? "status-pill is-verified" : "status-pill is-quiet"}>
                    {STATUS_LABEL[item.status]}
                  </span>
                </div>
                {catalog ? <p className="m-0 text-[var(--muted)]">{catalog.shortDescription}</p> : null}
                <p className="m-0 text-sm text-[var(--muted)]">Availed {formatDate(item.availedAt)}</p>
                <Link href={href} className="button-secondary pressable mt-2 inline-flex w-fit">
                  View program
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
