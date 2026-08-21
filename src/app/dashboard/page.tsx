import Link from "next/link";

import { AccountProfileDashboard } from "@/components/dashboard/account-profile-dashboard";
import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { PartnersMap } from "@/components/dashboard/partners-map";
import { dashboardMetrics } from "@/data/crm";
import { PendingMemberHome } from "@/components/dashboard/pending-member-home";
import { listContactsPaged, listPartnerMapPins, listViewerMetrics } from "@/lib/crm-store";
import { adminPartnershipSnapshot } from "@/lib/affiliate-store";
import { formatManilaDate, formatPhp } from "@/lib/pay-cycle";
import { hasAccess } from "@/lib/access";
import { resolveAccess } from "@/lib/access-store";
import { requireSessionUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireSessionUser();
  const access = await resolveAccess(user);

  if (!hasAccess(access, "contacts.view") && !hasAccess(access, "registrations")) {
    const pending = user.accountStatus !== "verified";

    return (
      <DashboardShell
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description={
          pending
            ? "Edit your account below. The team turns the full member room on after registration and payment."
            : "Your account, your path, and University — all in one workspace."
        }
      >
        <div className="account-dash-stack">
          {pending ? <PendingMemberHome user={user} compact /> : null}
          <AccountProfileDashboard
            user={user}
            showWorkspaceLinks={!pending}
            showPath={!pending && hasAccess(access, "path")}
          />
          {!pending && hasAccess(access, "partnership") ? (
            <MacosWindow title="Partnership Program" className="dashboard-span-2">
              <p className="macos-lead" style={{ textAlign: "left" }}>
                You have invite-only partner access. 20% is recorded by the team and released on the 15th and 30th.
              </p>
              <div className="macos-actions">
                <Link href="/dashboard/partnership" className="macos-btn macos-btn-primary">
                  Open Partnership
                </Link>
              </div>
            </MacosWindow>
          ) : null}
        </div>
      </DashboardShell>
    );
  }

  if (hasAccess(access, "contacts.view") && !hasAccess(access, "registrations")) {
    const viewer = { ...user, seeAllContacts: hasAccess(access, "contacts.all") };
    const [contacts, metrics, pins] = await Promise.all([
      listContactsPaged(viewer, "contact", 1, 8),
      listViewerMetrics(viewer),
      listPartnerMapPins(viewer),
    ]);

    return (
      <DashboardShell
        title="Partner dashboard"
        description="Only your assigned contacts and your own coverage. You do not see the full admin workspace."
      >
        <div className="dashboard-widget-grid">
          {metrics.map((metric) => (
            <article key={metric.label} className="dashboard-metric-card">
              <p className="macos-kicker">{metric.label}</p>
              <p className="dashboard-metric-value">{metric.value}</p>
              <p className="dashboard-metric-copy">{metric.detail}</p>
            </article>
          ))}

          <MacosWindow title="Your account">
            <p className="macos-lead" style={{ textAlign: "left" }}>
              Update your photo, phone, company, and password. This is the card on your login.
            </p>
            <div className="macos-actions">
              <Link href="/dashboard/profile" className="macos-btn macos-btn-primary">
                Edit account
              </Link>
            </div>
          </MacosWindow>

          <MacosWindow title="Your contacts" className="dashboard-span-2" bodyClassName="dashboard-contact-list">
            {contacts.total === 0 ? (
              <p className="macos-lead" style={{ textAlign: "left" }}>
                No contacts are assigned to you yet.
              </p>
            ) : (
              contacts.items.map((contact) => (
                <Link key={contact.id} href={`/dashboard/contacts/${contact.id}`} className="dashboard-contact-row">
                  <ContactAvatar name={contact.name} photoUrl={contact.photoUrl} />
                  <span>
                    <strong>{contact.name}</strong>
                    <em>
                      {contact.programInterest} · {contact.status}
                    </em>
                  </span>
                </Link>
              ))
            )}
            <Link href="/dashboard/contacts" className="macos-btn macos-btn-secondary mt-2 self-start">
              Open my contacts
            </Link>
          </MacosWindow>

          {hasAccess(access, "partnership") ? (
            <MacosWindow title="Partnership Program" className="dashboard-span-2">
              <p className="macos-lead" style={{ textAlign: "left" }}>
                Separate from CRM coverage: your 20% partnership link, tree, and 15th/30th payouts live here.
              </p>
              <div className="macos-actions">
                <Link href="/dashboard/partnership" className="macos-btn macos-btn-primary">
                  Open Partnership
                </Link>
              </div>
            </MacosWindow>
          ) : null}

          {pins.length > 0 ? (
            <MacosWindow title="Your coverage" className="dashboard-span-2" bodyClassName="partners-map-body">
              <p className="macos-lead" style={{ textAlign: "left" }}>
                This pin is yours. Other partner locations stay in the admin dashboard.
              </p>
              <PartnersMap partners={pins} />
            </MacosWindow>
          ) : null}
        </div>
      </DashboardShell>
    );
  }

  const viewer = { ...user, seeAllContacts: hasAccess(access, "contacts.all") };
  const [contacts, partners, pins, partnership] = await Promise.all([
    listContactsPaged(viewer, undefined, 1, 8),
    listContactsPaged(viewer, "partner", 1, 8),
    listPartnerMapPins(viewer),
    adminPartnershipSnapshot(),
  ]);

  return (
    <DashboardShell
      title="Dashboard"
      description="Full admin access: contacts, partner coverage, the Partnership Program, integrations, and site settings."
    >
      <div className="dashboard-widget-grid">
        {dashboardMetrics.map((metric) => (
          <article key={metric.label} className="dashboard-metric-card">
            <p className="macos-kicker">{metric.label}</p>
            <p className="dashboard-metric-value">{metric.value}</p>
            <p className="dashboard-metric-copy">{metric.detail}</p>
          </article>
        ))}

        <MacosWindow title="Partner map" className="dashboard-span-2" bodyClassName="partners-map-body">
          <p className="macos-lead" style={{ textAlign: "left" }}>
            Every partner is pinned on the map. Profile photos are used as pins; partners without a photo use the default pin.
          </p>
          <PartnersMap partners={pins} />
        </MacosWindow>

        <MacosWindow title="Contacts" bodyClassName="dashboard-contact-list">
          {contacts.items.map((contact) => (
            <Link key={contact.id} href={`/dashboard/contacts/${contact.id}`} className="dashboard-contact-row">
              <ContactAvatar name={contact.name} photoUrl={contact.photoUrl} />
              <span>
                <strong>{contact.name}</strong>
                <em>
                  {contact.kind === "partner" ? "Partner" : "Contact"} · {contact.city}
                </em>
              </span>
            </Link>
          ))}
          <Link href="/dashboard/contacts" className="macos-btn macos-btn-secondary mt-2 self-start">
            Open contacts
          </Link>
        </MacosWindow>

        <MacosWindow title="University">
          <p className="macos-lead" style={{ textAlign: "left" }}>
            The JDC Elite Society community at community.coachjdc.org.
          </p>
          <div className="macos-actions">
            <Link href="/dashboard/university" className="macos-btn macos-btn-primary">
              Open University
            </Link>
          </div>
        </MacosWindow>

        <MacosWindow title="Partners" bodyClassName="dashboard-contact-list">
          {partners.items.map((partner) => (
            <Link key={partner.id} href={`/dashboard/contacts/${partner.id}`} className="dashboard-contact-row">
              <ContactAvatar name={partner.name} photoUrl={partner.photoUrl} />
              <span>
                <strong>{partner.name}</strong>
                <em>
                  {partner.region} · {partner.activeContacts ?? 0} contacts · {partner.winRate}
                </em>
              </span>
            </Link>
          ))}
        </MacosWindow>

        <MacosWindow title="Registrants">
          <p className="macos-lead" style={{ textAlign: "left" }}>
            Member and contact sign-ups live on the Contacts workspace. Verify payment after they finish their profile.
          </p>
          <div className="macos-actions">
            <Link href="/dashboard/contacts?view=registrants" className="macos-btn macos-btn-primary">
              Open registrants
            </Link>
          </div>
        </MacosWindow>

        <MacosWindow title="Partnership Program">
          <p className="macos-lead" style={{ textAlign: "left" }}>
            Invite-only 20% program. Next payday {formatManilaDate(partnership.payday)}. {formatPhp(partnership.pendingPayout)}{" "}
            waiting in that cycle. {partnership.activeAffiliates} active affiliates.
          </p>
          <div className="macos-actions">
            <Link href="/dashboard/partnership" className="macos-btn macos-btn-primary">
              Open Partnership
            </Link>
            <Link href="/dashboard/partnership/admin" className="macos-btn macos-btn-secondary">
              Grant access
            </Link>
          </div>
        </MacosWindow>

        <MacosWindow title="Integrations">
          <p className="macos-lead" style={{ textAlign: "left" }}>
            Review Google Maps and Cloudflare R2 configuration.
          </p>
          <div className="macos-actions">
            <Link href="/dashboard/integrations" className="macos-btn macos-btn-secondary">
              Open Integrations
            </Link>
          </div>
        </MacosWindow>
      </div>
    </DashboardShell>
  );
}
