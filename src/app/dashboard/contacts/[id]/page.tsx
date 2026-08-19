import Link from "next/link";
import { notFound } from "next/navigation";

import { grantContactPortalAction } from "@/app/dashboard/access/actions";
import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { ContactTagEditor } from "@/components/dashboard/contact-tag-editor";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { AddressMap } from "@/components/maps/address-map";
import { hasAccess } from "@/lib/access";
import { getContact, listAssignedContacts, listTagIndex } from "@/lib/crm-store";
import { getGoogleMapsConfig } from "@/lib/maps";
import { findUserByEmail } from "@/lib/auth-store";
import { requireCapability } from "@/lib/session";

export default async function ContactDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, access } = await requireCapability("contacts.view");
  const viewer = { ...user, seeAllContacts: hasAccess(access, "contacts.all") };
  const { id } = await params;
  const contact = await getContact(viewer, id);

  if (!contact) {
    notFound();
  }

  const assigned = contact.kind === "partner" ? await listAssignedContacts(viewer, contact.name) : [];
  const mapsConfig = await getGoogleMapsConfig();
  const tagIndex = await listTagIndex(viewer);
  const portalUser = await findUserByEmail(contact.email);
  const isPartner = contact.kind === "partner";

  return (
    <DashboardShell
      title={contact.name}
      description={
        isPartner
          ? "Partner dashboard with coverage, assigned contacts, and location."
          : "Contact dashboard: profile, GHL tags, and location."
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
              <p className="dashboard-metric-value">{contact.tags.length}</p>
              <p className="dashboard-metric-copy">Synced with the JDC Elite Society GHL subaccount.</p>
            </article>
          </>
        )}

        <MacosWindow title="Tags" className="dashboard-span-2">
          <p className="macos-lead" style={{ textAlign: "left" }}>
            Advanced tags stay aligned with AiFunnels GHL. Add or remove a tag here and it writes back to the Elite
            Society location.
          </p>
          <ContactTagEditor
            contactId={contact.id}
            tags={contact.tags}
            suggestions={tagIndex.map((item) => item.tag)}
            canEdit={hasAccess(access, "contacts.tags")}
          />
        </MacosWindow>

        <MacosWindow title="Portal access" className="dashboard-span-2">
          {portalUser ? (
            <>
              <p className="macos-lead" style={{ textAlign: "left" }}>
                This contact has a login as {portalUser.role}. Their rooms follow that role&apos;s defaults unless you
                tweak them.
              </p>
              {hasAccess(access, "access") ? (
                <div className="macos-actions">
                  <Link href={`/dashboard/access/${portalUser.id}`} className="macos-btn macos-btn-primary">
                    Configure access
                  </Link>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <p className="macos-lead" style={{ textAlign: "left" }}>
                No login yet. Grant Contact access for a limited portal (home + University). They set a password from
                Forgot password on the sign-in page.
              </p>
              {hasAccess(access, "access") ? (
                <form action={grantContactPortalAction} className="macos-actions">
                  <input type="hidden" name="email" value={contact.email} />
                  <input type="hidden" name="name" value={contact.name} />
                  <button type="submit" className="macos-btn macos-btn-primary">
                    Grant Contact portal access
                  </button>
                </form>
              ) : null}
            </>
          )}
        </MacosWindow>

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
