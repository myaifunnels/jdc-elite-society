import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { programs } from "@/data/programs";
import { requireRoles } from "@/lib/session";

export default async function MemberPathPage() {
  const user = await requireRoles(["member"]);

  if (user.accountStatus !== "verified") {
    return (
      <DashboardShell
        title="My path"
        description="Your membership is still pending. Complete your profile and wait for our team to verify registration and payment."
      >
        <article className="card-surface rounded-[2rem] p-6 sm:p-8">
          <p className="text-sm text-[var(--muted)]">
            Tracks unlock after your account is verified.
          </p>
          <Link
            href="/dashboard/profile"
            className="button-primary pressable mt-6 inline-flex rounded-full px-4 py-2 text-sm font-semibold"
          >
            {user.profileComplete ? "View profile" : "Complete profile"}
          </Link>
        </article>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="My path"
      description="Pick the season you're in. Don't pick the program that sounds impressive. Pick the one that names your actual problem."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {programs.map((program) => (
          <article key={program.slug} className="card-surface rounded-[2rem] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-dark)]">Program</p>
            <h2 className="mt-3 text-2xl font-semibold">{program.title}</h2>
            <p className="mt-3 text-sm text-[var(--muted)]">{program.shortDescription}</p>
            <p className="mt-4 text-sm">
              <span className="font-medium">For:</span> {program.audience}
            </p>
            <Link
              href={`/programs/${program.slug}`}
              className="button-primary pressable mt-6 inline-flex rounded-full px-4 py-2 text-sm font-semibold"
            >
              View this track
            </Link>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
