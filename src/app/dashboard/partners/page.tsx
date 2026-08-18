import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { partnerSummary } from "@/data/crm";
import { requireRoles } from "@/lib/session";

export default async function PartnersPage() {
  const user = await requireRoles(["admin", "partner"]);
  const cards = user.role === "admin" ? partnerSummary : partnerSummary.slice(0, 1);

  return (
    <DashboardShell
      title="Partner dashboard"
      description="Review partner visibility, lead ownership, and regional performance at a glance."
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((partner) => (
          <article key={partner.id} className="card-surface rounded-[2rem] p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-dark)]">
              {partner.status}
            </p>
            <h2 className="mt-3 text-2xl font-semibold">{partner.name}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{partner.region}</p>
            <div className="mt-6 grid gap-3 text-sm text-[var(--muted)]">
              <p>Active leads: {partner.activeLeads}</p>
              <p>Win rate: {partner.winRate}</p>
              <p>
                Visibility: {user.role === "admin" ? "Full partner management" : "Assigned partner view only"}
              </p>
            </div>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
