import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { programs } from "@/data/programs";
import { requireCapability } from "@/lib/session";
import { ProgramsView, type ProgramsViewEntry } from "@/components/dashboard/programs-view";
import { hasAffiliateWorkspace } from "@/lib/affiliate";
import { listUserPrograms, syncUserProgramsFromCheckouts, type UserProgramStatus } from "@/lib/user-programs-store";

const EXTRA_PROGRAMS: Record<string, { title: string; href: string; description: string }> = {
  "jdc-elite-society": {
    title: "JDC Elite Society",
    href: "/programs/jdc-elite-society",
    description: "The JDC Elite Society portal and private community.",
  },
  "season-1-building": {
    title: "Season 1: Building",
    href: "/building",
    description: "Season 1 of the JDC Mastermind: build your foundation.",
  },
  "season-2-duplication": {
    title: "Season 2: Duplication",
    href: "/duplication",
    description: "Season 2 of the JDC Mastermind: duplicate what works.",
  },
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

  const catalog = [
    ...programs.map((program) => ({
      slug: program.slug,
      title: program.title,
      description: program.shortDescription,
      href: `/programs/${program.slug}`,
    })),
    ...Object.entries(EXTRA_PROGRAMS).map(([slug, extra]) => ({
      slug,
      title: extra.title,
      description: extra.description,
      href: extra.href,
    })),
  ];

  const entries: ProgramsViewEntry[] = catalog.map((entry) => {
    const mine = items.find((item) => item.programSlug === entry.slug);
    const availed = availedSlugs.has(entry.slug) && Boolean(mine);
    return {
      ...entry,
      availed,
      status: mine?.status ?? "active",
      statusLabel: mine ? STATUS_LABEL[mine.status] : "",
      since: mine ? formatDate(mine.availedAt) : "",
    };
  });

  const promoteHref = hasAffiliateWorkspace(user) ? "/dashboard/partnership/campaigns" : "/programs/jdc-partnership";

  return (
    <DashboardShell title="Programs" description="What you've availed, and what you can promote and grow into next.">
      <ProgramsView entries={entries} promoteHref={promoteHref} />
    </DashboardShell>
  );
}
