import Link from "next/link";
import { notFound } from "next/navigation";

import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { AddressMap } from "@/components/maps/address-map";
import { getContact, listAssignedContacts } from "@/lib/crm-store";
import { getGoogleMapsConfig } from "@/lib/maps";
import { requireRoles } from "@/lib/session";

export default async function ContactDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRoles(["admin", "partner"]);
  const { id } = await params;
  const contact = await getContact(user, id);

  if (!contact) {
    notFound();
  }

  const assigned = contact.kind === "partner" ? await listAssignedContacts(user, contact.name) : [];
  const mapsConfig = await getGoogleMapsConfig();
  const isPartner = contact.kind === "partner";

  return (
    <DashboardShell
      title={contact.name}
      description={
        isPartner
          ? "Partner dashboard with coverage, assigned contacts, and location."
          : "Detailed contact dashboard with profile, assignment, and location."
      }
    >
      <div className="dashboard-widget-grid">
        <MacosWindow title="Profile" className="dashboard-span-2">
          <div className="dashboard-profile-hero">
            <ContactAvatar name={contact.name} photoUrl={contact.photoUrl} size="lg" />
            <div>
              <p className="macos-kicker">{isPartner ? "Partner" : "Contact"}</p>
              <h2 className="dashboard-profile-name">{contact.name}</h2>
              <p className="dashboard-metric-copy">
                {contact.email} · {contact.phone}
              </p>
              <p className="dashboard-metric-copy">{contact.address}</p>
            </div>
          </div>
          <dl className="dashboard-meta-grid">
            <div>
              <dt>Status</dt>
              <dd className="capitalize">{contact.status}</dd>
            </div>
            <div>
              <dt>Describes</dt>
              <dd>{contact.bestDescribesYou}</dd>
            </div>
            <div>
              <dt>Program</dt>
              <dd>{contact.programInterest}</dd>
            </div>
            <div>
              <dt>{isPartner ? "Region" : "Assigned partner"}</dt>
              <dd>{isPartner ? contact.region : (contact.assignedPartner ?? "Unassigned")}</dd>
            </div>
          </dl>
        </MacosWindow>

        {isPartner ? (
          <>
            <article className="dashboard-metric-card">
              <p className="macos-kicker">Active contacts</p>
              <p className="dashboard-metric-value">{contact.activeContacts ?? assigned.length}</p>
              <p className="dashboard-metric-copy">People currently on this partner&apos;s desk.</p>
            </article>
            <article className="dashboard-metric-card">
              <p className="macos-kicker">Win rate</p>
              <p className="dashboard-metric-value">{contact.winRate ?? "—"}</p>
              <p className="dashboard-metric-copy">Close rate on assigned contacts.</p>
            </article>
            <article className="dashboard-metric-card">
              <p className="macos-kicker">Visibility</p>
              <p className="dashboard-metric-value capitalize">{user.role}</p>
              <p className="dashboard-metric-copy">
                {user.role === "admin" ? "Admin can open every contact dashboard." : "Assigned contacts only."}
              </p>
            </article>
          </>
        ) : (
          <>
            <article className="dashboard-metric-card">
              <p className="macos-kicker">Source</p>
              <p className="dashboard-metric-title">{contact.source}</p>
              <p className="dashboard-metric-copy">Created {contact.createdAt}</p>
            </article>
            <article className="dashboard-metric-card">
              <p className="macos-kicker">Tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {contact.tags.map((tag) => (
                  <span key={tag} className="dashboard-chip">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          </>
        )}

        <MacosWindow title="Location" className={isPartner ? "dashboard-span-2" : undefined}>
          <AddressMap address={contact.address} embedKey={mapsConfig.embedKey} />
        </MacosWindow>

        {isPartner ? (
          <MacosWindow title="Assigned contacts" className="dashboard-span-2" bodyClassName="dashboard-contact-list">
            {assigned.length === 0 ? (
              <p className="macos-lead" style={{ textAlign: "left" }}>
                No assigned contacts yet.
              </p>
            ) : (
              assigned.map((item) => (
                <Link key={item.id} href={`/dashboard/contacts/${item.id}`} className="dashboard-contact-row">
                  <ContactAvatar name={item.name} photoUrl={item.photoUrl} />
                  <span>
                    <strong>{item.name}</strong>
                    <em>
                      {item.programInterest} · {item.status}
                    </em>
                  </span>
                </Link>
              ))
            )}
          </MacosWindow>
        ) : (
          <MacosWindow title="Follow-up">
            <p className="macos-lead" style={{ textAlign: "left" }}>
              {contact.bestDescribesYou} interested in {contact.programInterest}.
            </p>
            <div className="macos-actions">
              <Link href="/dashboard/contacts" className="macos-btn macos-btn-secondary">
                Back to contacts
              </Link>
            </div>
          </MacosWindow>
        )}
      </div>
    </DashboardShell>
  );
}
