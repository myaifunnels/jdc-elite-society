import Link from "next/link";
import { notFound } from "next/navigation";

import { grantContactPortalAction } from "@/app/dashboard/access/actions";
import { ContactAffiliateTags } from "@/components/dashboard/contact-affiliate-tags";
import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { ContactTagEditor } from "@/components/dashboard/contact-tag-editor";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DeleteUserButton } from "@/components/dashboard/delete-user-button";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { OpenUserDashboardButton } from "@/components/dashboard/open-user-dashboard-button";
import { Pagination } from "@/components/dashboard/pagination";
import { AddressMap } from "@/components/maps/address-map";
import { hasAccess } from "@/lib/access";
import { findUserByEmail } from "@/lib/auth-store";
import { getContact, listAssignedContacts, listTagIndex } from "@/lib/crm-store";
import { getGoogleMapsConfig } from "@/lib/maps";
import { membershipLabel } from "@/lib/membership";
import { parsePage, paginate } from "@/lib/pagination";
import { requireCapability } from "@/lib/session";

function Field({ label, value, href }: { label: string; value?: string | null; href?: string }) {
  const text = value?.trim();
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        {text ? (
          href ? (
            <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              {text}
            </a>
          ) : (
            text
          )
        ) : (
          <span className="text-[var(--muted)]">Not set</span>
        )}
      </dd>
    </div>
  );
}

export default async function ContactDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { user, access } = await requireCapability("contacts.view");
  const viewer = { ...user, seeAllContacts: hasAccess(access, "contacts.all") };
  const { id } = await params;
  const contact = await getContact(viewer, id);

  if (!contact) {
    notFound();
  }

  const assigned = contact.kind === "partner" ? await listAssignedContacts(viewer, contact.name) : [];
  const assignedPage = paginate(assigned, parsePage((await searchParams).page), 12);
  const [mapsConfig, tagIndex, portalUser] = await Promise.all([
    getGoogleMapsConfig(),
    listTagIndex(viewer),
    findUserByEmail(contact.email),
  ]);
  const isPartner = contact.kind === "partner";
  const location = [contact.city, contact.region].filter(Boolean).join(", ");

  return (
    <DashboardShell
      title={contact.name}
      description={
        isPartner
          ? "Partner dashboard with coverage, assigned contacts, and location."
          : "Full contact record: profile, portal, tags, and map."
      }
    >
      <div className="dashboard-widget-grid">
        <MacosWindow title="Profile" className="dashboard-span-2">
          <div className="dashboard-profile-hero">
            <ContactAvatar name={contact.name} photoUrl={contact.photoUrl || portalUser?.facebookPhotoUrl} size="lg" />
            <div>
              <p className="macos-kicker">{isPartner ? "Partner" : "Contact"}</p>
              <h2 className="dashboard-profile-name">{contact.name}</h2>
              <p className="dashboard-metric-copy">
                {contact.email}
                {contact.phone ? ` · ${contact.phone}` : ""}
              </p>
              <p className="dashboard-metric-copy">{contact.address || location || "No address yet"}</p>
              {user.role === "admin" && portalUser?.id !== user.id ? (
                <div className="macos-actions" style={{ marginTop: "0.75rem" }}>
                  <DeleteUserButton
                    userId={portalUser?.id}
                    email={contact.email}
                    name={contact.name}
                    redirectTo="/dashboard/contacts"
                  />
                </div>
              ) : null}
            </div>
          </div>
          <dl className="dashboard-meta-grid is-wide">
            <Field label="Email" value={contact.email} href={`mailto:${contact.email}`} />
            <Field label="Phone" value={contact.phone} href={contact.phone ? `tel:${contact.phone}` : undefined} />
            <Field label="Date of birth" value={contact.dateOfBirth || portalUser?.dateOfBirth} />
            <Field label="Audience" value={contact.bestDescribesYou} />
            <Field label="Program" value={contact.programInterest} />
            <Field label="Status" value={contact.status} />
            <Field label="City" value={contact.city} />
            <Field label="Region" value={contact.region} />
            <Field label="Address" value={contact.address} />
            <Field label={isPartner ? "Coverage" : "Assigned partner"} value={isPartner ? location : contact.assignedPartner} />
            <Field label="Source" value={contact.source} />
            <Field label="Created" value={contact.createdAt} />
            <Field label="GHL id" value={contact.ghlContactId} />
            <Field
              label="Facebook"
              value={portalUser?.facebookProfileUrl}
              href={portalUser?.facebookProfileUrl}
            />
            <Field
              label="Membership"
              value={portalUser ? membershipLabel(portalUser.memberships) : undefined}
            />
            <Field label="Company" value={portalUser?.company} />
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
              <p className="macos-kicker">Map</p>
              <p className="dashboard-metric-value">{typeof contact.lat === "number" ? "Pinned" : "Pending"}</p>
              <p className="dashboard-metric-copy">Location follows the saved address.</p>
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
            <article className="dashboard-metric-card">
              <p className="macos-kicker">Portal</p>
              <p className="dashboard-metric-title capitalize">{portalUser?.role ?? "None"}</p>
              <p className="dashboard-metric-copy">
                {portalUser ? `${portalUser.accountStatus} · ${portalUser.profileComplete ? "profile complete" : "profile incomplete"}` : "No login yet"}
              </p>
            </article>
          </>
        )}

        <MacosWindow title="Tags" className="dashboard-span-2">
          <p className="macos-lead" style={{ textAlign: "left" }}>
            Advanced tags stay aligned with AiFunnels GHL. Pioneer and jdc-partner unlock the matching affiliate campaigns
            when this contact has a login.
          </p>
          <ContactTagEditor
            contactId={contact.id}
            tags={contact.tags}
            suggestions={tagIndex.map((item) => item.tag)}
            canEdit={hasAccess(access, "contacts.tags")}
          />
        </MacosWindow>

        <MacosWindow title="Partnership campaigns" className="dashboard-span-2">
          {hasAccess(access, "contacts.tags") ? (
            <ContactAffiliateTags contactId={contact.id} tags={contact.tags} />
          ) : (
            <p className="macos-lead" style={{ textAlign: "left" }}>
              Pioneer and jdc-partner tags are managed by admin.
            </p>
          )}
        </MacosWindow>

        <MacosWindow title="Portal access" className="dashboard-span-2">
          {portalUser ? (
            <>
              <p className="macos-lead" style={{ textAlign: "left" }}>
                Login: {portalUser.email} as {portalUser.role}. Account {portalUser.accountStatus}. Password{" "}
                {portalUser.passwordSet ? "is set" : "not set yet"}. Payment{" "}
                {portalUser.paymentVerified ? "verified" : "pending"}.
              </p>
              <div className="macos-actions">
                {hasAccess(access, "access") ? (
                  <Link href={`/dashboard/access/${portalUser.id}`} className="macos-btn macos-btn-primary">
                    Configure access
                  </Link>
                ) : null}
                {user.role === "admin" && portalUser.role !== "admin" ? (
                  <OpenUserDashboardButton
                    userId={portalUser.id}
                    email={contact.email}
                    name={contact.name}
                    phone={contact.phone}
                  />
                ) : null}
                {user.role === "admin" && portalUser.id !== user.id ? (
                  <DeleteUserButton
                    userId={portalUser.id}
                    email={contact.email}
                    name={contact.name}
                    redirectTo="/dashboard/contacts"
                  />
                ) : null}
              </div>
            </>
          ) : (
            <>
              <p className="macos-lead" style={{ textAlign: "left" }}>
                {contact.ghlContactId
                  ? "This GHL contact gets a Contact dashboard when you open it. They set a password from Forgot password."
                  : "No login yet. Grant Contact access for a limited portal (home + University)."}
              </p>
              <div className="macos-actions">
                {user.role === "admin" && contact.email ? (
                  <OpenUserDashboardButton email={contact.email} name={contact.name} phone={contact.phone} />
                ) : null}
                {hasAccess(access, "access") ? (
                  <form action={grantContactPortalAction}>
                    <input type="hidden" name="email" value={contact.email} />
                    <input type="hidden" name="name" value={contact.name} />
                    <button type="submit" className="macos-btn macos-btn-secondary">
                      Grant Contact portal access
                    </button>
                  </form>
                ) : null}
                {user.role === "admin" ? (
                  <DeleteUserButton email={contact.email} name={contact.name} redirectTo="/dashboard/contacts" />
                ) : null}
              </div>
            </>
          )}
        </MacosWindow>

        <MacosWindow title="Location" className="dashboard-span-2">
          <AddressMap
            address={contact.address || location}
            lat={contact.lat}
            lng={contact.lng}
            embedKey={mapsConfig.embedKey}
          />
        </MacosWindow>

        {isPartner ? (
          <MacosWindow title="Assigned contacts" className="dashboard-span-2" bodyClassName="dashboard-contact-list">
            {assigned.length === 0 ? (
              <p className="macos-lead" style={{ textAlign: "left" }}>
                No assigned contacts yet.
              </p>
            ) : (
              <>
                {assignedPage.items.map((item) => (
                  <Link key={item.id} href={`/dashboard/contacts/${item.id}`} className="dashboard-contact-row">
                    <ContactAvatar name={item.name} photoUrl={item.photoUrl} />
                    <span>
                      <strong>{item.name}</strong>
                      <em>
                        {item.email} · {item.programInterest} · {item.status}
                      </em>
                    </span>
                  </Link>
                ))}
                <Pagination
                  page={assignedPage.page}
                  pages={assignedPage.pages}
                  total={assignedPage.total}
                  hrefBase={`/dashboard/contacts/${contact.id}`}
                  noun="assigned contacts"
                />
              </>
            )}
          </MacosWindow>
        ) : (
          <MacosWindow title="Follow-up" className="dashboard-span-2">
            <p className="macos-lead" style={{ textAlign: "left" }}>
              {contact.bestDescribesYou || "This contact"}
              {contact.programInterest ? ` is interested in ${contact.programInterest}` : ""}.
              {contact.assignedPartner ? ` Assigned to ${contact.assignedPartner}.` : " No partner assigned yet."}
            </p>
            <div className="macos-actions">
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className="macos-btn macos-btn-primary">
                  Email
                </a>
              ) : null}
              {contact.phone ? (
                <a href={`tel:${contact.phone}`} className="macos-btn macos-btn-secondary">
                  Call
                </a>
              ) : null}
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
