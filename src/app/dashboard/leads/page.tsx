import { AddressMap } from "@/components/maps/address-map";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { listLeads } from "@/lib/crm-store";
import { getGoogleMapsConfig } from "@/lib/maps";
import { requireSessionUser } from "@/lib/session";

export default async function LeadsPage() {
  const user = await requireSessionUser();
  const leads = listLeads(user.role);
  const featuredLead = leads[0];
  const mapsConfig = await getGoogleMapsConfig();

  return (
    <DashboardShell
      role={user.role}
      title={user.role === "admin" ? "Lead CRM" : "Assigned leads"}
      description="Review captured contacts, their program interest, and address data ready for map-based workflows."
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="card-surface rounded-[2rem] p-8">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-black/8 text-[var(--muted)]">
                <tr>
                  <th className="py-3 pr-4 font-medium">Lead</th>
                  <th className="py-3 pr-4 font-medium">Program</th>
                  <th className="py-3 pr-4 font-medium">Tags</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-black/5 align-top last:border-0">
                    <td className="py-4 pr-4">
                      <p className="font-semibold">{lead.name}</p>
                      <p className="text-[var(--muted)]">{lead.email}</p>
                      <p className="text-[var(--muted)]">{lead.phone}</p>
                    </td>
                    <td className="py-4 pr-4">{lead.programInterest}</td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        {lead.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[#fff5e9] px-3 py-1 text-xs font-medium text-[var(--brand-dark)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 pr-4 capitalize">{lead.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="grid gap-6">
          {featuredLead ? (
            <>
              <div className="card-surface rounded-[2rem] p-8">
                <p className="text-sm font-semibold">Selected lead</p>
                <p className="mt-4 text-xl font-semibold">{featuredLead.name}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{featuredLead.address}</p>
                <div className="mt-6 grid gap-3 text-sm text-[var(--muted)]">
                  <p>Date of birth: {featuredLead.dateOfBirth}</p>
                  <p>Source: {featuredLead.source}</p>
                  <p>Assigned partner: {featuredLead.assignedPartner ?? "Unassigned"}</p>
                </div>
              </div>

              <AddressMap address={featuredLead.address} embedKey={mapsConfig.embedKey} />
            </>
          ) : null}
        </aside>
      </div>
    </DashboardShell>
  );
}
