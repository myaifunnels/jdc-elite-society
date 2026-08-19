import Link from "next/link";

import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { PartnersMap } from "@/components/dashboard/partners-map";
import { dashboardMetrics } from "@/data/crm";
import { programs } from "@/data/programs";
import { listContacts, listPartnerMapPins } from "@/lib/crm-store";
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
            : "This is your member workspace. Follow a track, stay honest about where you are, and talk to Coach JDC when you're ready."
        }
      >
        <div className="dashboard-widget-grid">
          <MacosWindow title={pending ? "Account pending" : "Your role"} className="dashboard-span-2">
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
                  workspace is for the person doing the work.
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

  const contacts = listContacts(user.role);
  const partners = listContacts(user.role, "partner");
  const pins = listPartnerMapPins(user.role);
  const isAdmin = user.role === "admin";

  return (
    <DashboardShell
      title={isAdmin ? "Dashboard" : "Partner dashboard"}
      description={
        isAdmin
          ? "Contacts, partner coverage, integrations, and site settings in one workspace."
          : "Your assigned contacts, conversion activity, and the slice of the CRM that belongs to you."
      }
    >
      <div className="dashboard-widget-grid">
        {dashboardMetrics.slice(0, isAdmin ? 3 : 2).map((metric) => (
          <article key={metric.label} className="dashboard-metric-card">
            <p className="macos-kicker">{metric.label}</p>
            <p className="dashboard-metric-value">{metric.value}</p>
            <p className="dashboard-metric-copy">{metric.detail}</p>
          </article>
        ))}

        {!isAdmin ? (
          <article className="dashboard-metric-card">
            <p className="macos-kicker">Your access</p>
            <p className="dashboard-metric-value">Partner</p>
            <p className="dashboard-metric-copy">Assigned contacts and your own dashboard.</p>
          </article>
        ) : null}

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

        <MacosWindow title={isAdmin ? "Partners" : "Your partner card"} bodyClassName="dashboard-contact-list">
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

        {isAdmin ? (
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
        ) : null}

        {isAdmin ? (
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
        ) : null}
      </div>
    </DashboardShell>
  );
}
