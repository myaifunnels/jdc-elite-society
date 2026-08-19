import Link from "next/link";

import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { PartnersMap } from "@/components/dashboard/partners-map";
import { dashboardMetrics } from "@/data/crm";
import { programs } from "@/data/programs";
import { PendingMemberHome } from "@/components/dashboard/pending-member-home";
import { listContacts, listPartnerMapPins, listViewerMetrics } from "@/lib/crm-store";
import { adminPartnershipSnapshot } from "@/lib/affiliate-store";
import { formatManilaDate, formatPhp } from "@/lib/pay-cycle";
import { membershipLabel } from "@/lib/membership";
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
            ? user.profileComplete
              ? "Your seat is reserved. The team is turning your account on."
              : "Finish your profile and you will be next in line for an active account."
            : "Your member workspace: your path, your programs, and a way to talk to Coach JDC."
        }
      >
        {pending ? (
          <PendingMemberHome user={user} />
        ) : (
          <div className="dashboard-widget-grid">
            <MacosWindow title="Your room" className="dashboard-span-2">
              <p className="macos-lead" style={{ textAlign: "left" }}>
                Signed in as {membershipLabel(user.memberships)}. JES means JDC Elite Society. This
                workspace is for the person doing the work — not the admin or partner rooms.
              </p>
              <div className="macos-actions">
                {hasAccess(access, "path") ? (
                  <Link href="/dashboard/path" className="macos-btn macos-btn-primary">
                    See my path
                  </Link>
                ) : null}
                {hasAccess(access, "university") ? (
                  <Link href="/dashboard/university" className="macos-btn macos-btn-primary">
                    Open University
                  </Link>
                ) : null}
                <Link href="/contact" className="macos-btn macos-btn-secondary">
                  Talk to Coach JDC
                </Link>
              </div>
            </MacosWindow>

            {programs.slice(0, 3).map((program) => (
              <Link key={program.slug} href={`/programs/${program.slug}`} className="dashboard-metric-card">
                <p className="macos-kicker">Track</p>
                <p className="dashboard-metric-title">{program.title}</p>
                <p className="dashboard-metric-copy">{program.shortDescription}</p>
              </Link>
            ))}

            <MacosWindow title="University" className="dashboard-span-2">
              <p className="macos-lead" style={{ textAlign: "left" }}>
                The membership community lives in University: community.coachjdc.org, inside this workspace.
              </p>
              <div className="macos-actions">
                <Link href="/dashboard/university" className="macos-btn macos-btn-primary">
                  Open University
                </Link>
              </div>
            </MacosWindow>

            {user.affiliateAccess ? (
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
        )}
      </DashboardShell>
    );
  }

  if (hasAccess(access, "contacts.view") && !hasAccess(access, "registrations")) {
    const viewer = { ...user, seeAllContacts: hasAccess(access, "contacts.all") };
    const contacts = await listContacts(viewer, "contact");
    const metrics = await listViewerMetrics(viewer);
    const pins = await listPartnerMapPins(viewer);

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

          <MacosWindow title="Your contacts" className="dashboard-span-2" bodyClassName="dashboard-contact-list">
            {contacts.length === 0 ? (
              <p className="macos-lead" style={{ textAlign: "left" }}>
                No contacts are assigned to you yet.
              </p>
            ) : (
              contacts.map((contact) => (
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

          {user.affiliateAccess ? (
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
  const contacts = await listContacts(viewer);
  const partners = await listContacts(viewer, "partner");
  const pins = await listPartnerMapPins(viewer);
  const partnership = await adminPartnershipSnapshot();

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
          {contacts.slice(0, 6).map((contact) => (
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
          {partners.map((partner) => (
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

        <MacosWindow title="Registrations">
          <p className="macos-lead" style={{ textAlign: "left" }}>
            Verify member registration and payment after they complete their account profile.
          </p>
          <div className="macos-actions">
            <Link href="/dashboard/registrations" className="macos-btn macos-btn-primary">
              Open registrations
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
