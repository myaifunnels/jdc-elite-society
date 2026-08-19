import Link from "next/link";

import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { PartnersMap } from "@/components/dashboard/partners-map";
import { dashboardMetrics } from "@/data/crm";
import { programs } from "@/data/programs";
import { listContacts, listPartnerMapPins, listViewerMetrics } from "@/lib/crm-store";
import { membershipLabel } from "@/lib/membership";
import { requireSessionUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireSessionUser();

  if (user.role === "member") {
    const pending = user.accountStatus !== "verified";

    return (
      <DashboardShell
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description={
          pending
            ? "Your account is pending. Complete your profile, then wait for our team to verify your registration and payment."
            : "Your member workspace: your path, your programs, and a way to talk to Coach JDC."
        }
      >
        <div className="dashboard-widget-grid">
          <MacosWindow title={pending ? "Account pending" : "Your room"} className="dashboard-span-2">
            {pending ? (
              <>
                <p className="macos-lead" style={{ textAlign: "left" }}>
                  You can use the dashboard, but your membership is not verified yet. Complete your
                  account profile first. After that, our team will confirm your registration and
                  payment.
                </p>
                <ul className="pending-checklist">
                  <li className={user.profileComplete ? "is-done" : ""}>
                    {user.profileComplete ? "Profile complete" : "Complete your account profile"}
                  </li>
                  <li className={user.paymentVerified ? "is-done" : ""}>
                    {user.paymentVerified
                      ? "Registration and payment verified"
                      : "Team verifies registration and payment"}
                  </li>
                </ul>
                <div className="macos-actions">
                  {user.profileComplete ? (
                    <Link href="/dashboard/profile" className="macos-btn macos-btn-secondary">
                      View profile
                    </Link>
                  ) : (
                    <Link href="/dashboard/profile" className="macos-btn macos-btn-primary">
                      Complete profile
                    </Link>
                  )}
                  <Link href="/contact" className="macos-btn macos-btn-secondary">
                    Talk to Coach JDC
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="macos-lead" style={{ textAlign: "left" }}>
                  Signed in as {membershipLabel(user.memberships)}. JES means JDC Elite Society. This
                  workspace is for the person doing the work — not the admin or partner rooms.
                </p>
                <div className="macos-actions">
                  <Link href="/dashboard/path" className="macos-btn macos-btn-primary">
                    See my path
                  </Link>
                  <Link href="/contact" className="macos-btn macos-btn-secondary">
                    Talk to Coach JDC
                  </Link>
                </div>
              </>
            )}
          </MacosWindow>

          {!pending
            ? programs.slice(0, 3).map((program) => (
                <Link key={program.slug} href={`/programs/${program.slug}`} className="dashboard-metric-card">
                  <p className="macos-kicker">Track</p>
                  <p className="dashboard-metric-title">{program.title}</p>
                  <p className="dashboard-metric-copy">{program.shortDescription}</p>
                </Link>
              ))
            : (
              <article className="dashboard-metric-card">
                <p className="macos-kicker">Company</p>
                <p className="dashboard-metric-title">{user.company || "Not listed"}</p>
                <p className="dashboard-metric-copy">
                  {user.phone} · {user.email}
                </p>
              </article>
            )}
        </div>
      </DashboardShell>
    );
  }

  if (user.role === "partner") {
    const contacts = listContacts(user, "contact");
    const metrics = listViewerMetrics(user);
    const pins = listPartnerMapPins(user);

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

  const contacts = listContacts(user);
  const partners = listContacts(user, "partner");
  const pins = listPartnerMapPins(user);

  return (
    <DashboardShell
      title="Dashboard"
      description="Full admin access: contacts, partner coverage, integrations, and site settings."
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
