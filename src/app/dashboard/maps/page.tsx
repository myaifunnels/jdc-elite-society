import { AddressMap } from "@/components/maps/address-map";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { listLeads } from "@/lib/crm-store";
import { getGoogleMapsConfig } from "@/lib/maps";
import { requireSessionUser } from "@/lib/session";

export default async function MapsPage() {
  const user = await requireSessionUser();
  const leads = listLeads(user.role);
  const featuredLead = leads[0];
  const mapsConfig = await getGoogleMapsConfig();

  return (
    <DashboardShell
      role={user.role}
      title="Lead maps"
      description="Use Google Maps inside the admin workspace to inspect lead locations, handoffs, and territory context."
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-panel rounded-[2rem] p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold">Lead location queue</p>
              <p className="text-sm text-[var(--muted)]">
                Choose addresses that need routing, follow-up, or partner coordination.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {leads.map((lead) => (
              <article
                key={lead.id}
                className="rounded-[1.5rem] border border-[var(--line)] bg-[color:var(--surface-elevated)]/72 p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold">{lead.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{lead.address}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {lead.programInterest} • {lead.city}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lead.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-medium text-[var(--brand-dark)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-6">
          {featuredLead ? (
            <>
              <section className="glass-panel rounded-[2rem] p-8">
                <p className="text-sm font-semibold">Featured location</p>
                <p className="mt-4 text-2xl font-semibold tracking-[-0.02em]">
                  {featuredLead.name}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">{featuredLead.address}</p>

                <div className="mt-6 grid gap-3 text-sm text-[var(--muted)]">
                  <p>Assigned partner: {featuredLead.assignedPartner ?? "Unassigned"}</p>
                  <p>Lead status: {featuredLead.status}</p>
                  <p>Program interest: {featuredLead.programInterest}</p>
                </div>
              </section>

              <AddressMap address={featuredLead.address} embedKey={mapsConfig.embedKey} />
            </>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
