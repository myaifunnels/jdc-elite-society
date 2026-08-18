import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { dashboardMetrics, partnerSummary } from "@/data/crm";
import { requireSessionUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireSessionUser();

  return (
    <DashboardShell
      role={user.role}
      title="Platform overview"
      description="A role-aware snapshot of lead activity, program momentum, and partner performance."
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
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold">Role summary</p>
              <p className="text-sm text-[var(--muted)]">
                {user.role === "admin"
                  ? "You can review every lead, route partners, and prepare deployment settings."
                  : "You can review your assigned leads and partner-facing conversion activity."}
              </p>
            </div>
          </div>

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
      </div>
    </DashboardShell>
  );
}
