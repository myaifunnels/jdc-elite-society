import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { dashboardMetrics, partnerSummary } from "@/data/crm";
import { programs } from "@/data/programs";
import { membershipLabel } from "@/lib/membership";
import { requireSessionUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireSessionUser();

  if (user.role === "member") {
    return (
      <DashboardShell
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description="This is your member workspace. Follow a track, stay honest about where you are, and talk to Coach JDC when you're ready."
      >
        <div className="grid gap-6">
          <section className="card-surface rounded-[2rem] p-6 sm:p-8">
            <p className="text-sm font-semibold">Your role</p>
            <p className="mt-2 text-[var(--muted)]">
              Signed in as {membershipLabel(user.memberships)}. JES means JDC Elite Society. This
              workspace is for the person doing the work.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard/path" className="button-primary pressable rounded-full px-4 py-2 text-sm font-semibold">
                See my path
              </Link>
              <Link href="/contact" className="button-secondary pressable rounded-full px-4 py-2 text-sm font-semibold">
                Talk to Coach JDC
              </Link>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {programs.slice(0, 3).map((program) => (
              <Link key={program.slug} href={`/programs/${program.slug}`} className="card-surface rounded-[1.75rem] p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-dark)]">Track</p>
                <p className="mt-3 text-xl font-semibold">{program.title}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{program.shortDescription}</p>
              </Link>
            ))}
          </section>
        </div>
      </DashboardShell>
    );
  }

  if (user.role === "partner") {
    return (
      <DashboardShell
        title="Partner overview"
        description="Your assigned leads, conversion activity, and the slice of the CRM that belongs to you."
      >
        <div className="grid gap-6">
          <section className="grid gap-4 md:grid-cols-3">
            {dashboardMetrics.slice(0, 2).map((metric) => (
              <div key={metric.label} className="card-surface rounded-[1.75rem] p-6">
                <p className="text-sm text-[var(--muted)]">{metric.label}</p>
                <p className="mt-3 text-4xl font-semibold">{metric.value}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{metric.detail}</p>
              </div>
            ))}
            <div className="card-surface rounded-[1.75rem] p-6">
              <p className="text-sm text-[var(--muted)]">Your access</p>
              <p className="mt-3 text-2xl font-semibold">Partner</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Assigned leads and partner summary only.</p>
            </div>
          </section>

          <section className="card-surface rounded-[2rem] p-8">
            <p className="text-sm font-semibold">Partner summary</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {partnerSummary.slice(0, 1).map((partner) => (
                <div key={partner.id} className="rounded-[1.5rem] border border-black/8 bg-white p-5">
                  <p className="font-semibold">{partner.name}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{partner.region}</p>
                  <p className="mt-4 text-sm">Active leads: {partner.activeLeads}</p>
                  <p className="mt-1 text-sm">Win rate: {partner.winRate}</p>
                </div>
              ))}
            </div>
            <Link href="/dashboard/leads" className="button-secondary pressable mt-6 inline-flex rounded-full px-4 py-2 text-sm font-semibold">
              Open my leads
            </Link>
          </section>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Admin overview"
      description="Full access: leads, partners, maps, integrations, and site settings."
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-3">
          {dashboardMetrics.map((metric) => (
            <div key={metric.label} className="card-surface rounded-[1.75rem] p-6">
              <p className="text-sm text-[var(--muted)]">{metric.label}</p>
              <p className="mt-3 text-4xl font-semibold">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{metric.detail}</p>
            </div>
          ))}
        </section>

        <section className="card-surface rounded-[2rem] p-8">
          <p className="text-sm font-semibold">Partners</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {partnerSummary.map((partner) => (
              <div key={partner.id} className="rounded-[1.5rem] border border-black/8 bg-white p-5">
                <p className="font-semibold">{partner.name}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{partner.region}</p>
                <p className="mt-4 text-sm">Active leads: {partner.activeLeads}</p>
                <p className="mt-1 text-sm">Win rate: {partner.winRate}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass-panel rounded-[2rem] p-8">
            <p className="text-sm font-semibold">Google Maps operations</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Review lead locations, partner routing, and address context.
            </p>
            <Link href="/dashboard/maps" className="button-secondary pressable mt-6 inline-flex rounded-full px-4 py-2 text-sm font-semibold">
              Open Maps workspace
            </Link>
          </div>
          <div className="glass-panel rounded-[2rem] p-8">
            <p className="text-sm font-semibold">Integration control center</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Review Google Maps and Cloudflare R2 configuration.
            </p>
            <Link href="/dashboard/integrations" className="button-secondary pressable mt-6 inline-flex rounded-full px-4 py-2 text-sm font-semibold">
              Open Integrations
            </Link>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
