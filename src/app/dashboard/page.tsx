import { CreditCard, GraduationCap, Handshake, Plug, Users } from "lucide-react";
import Link from "next/link";

import { AccountProfileDashboard } from "@/components/dashboard/account-profile-dashboard";
import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { ContactAddressVerifyNotice } from "@/components/dashboard/contact-address-verify-notice";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { PartnersMap } from "@/components/dashboard/partners-map";
import { QuickLinksCard } from "@/components/dashboard/quick-links-card";
import { dashboardMetrics } from "@/data/crm";
import { PendingMemberHome } from "@/components/dashboard/pending-member-home";
import { UniversityCommunityEmbed } from "@/components/dashboard/university-community-embed";
import { UniversityCourseGrid } from "@/components/dashboard/university-course-grid";
import { adminPartnershipSnapshot } from "@/lib/affiliate-store";
import { contactNeedsAddressConfirm, getContactByEmail, listContactsPaged, listPartnerMapPins, listViewerMetrics } from "@/lib/crm-store";
import { listUniversityCourses } from "@/lib/ghl-courses";
import { formatManilaDate, formatPhp } from "@/lib/pay-cycle";
import { hasAccess } from "@/lib/access";
import { resolveAccess } from "@/lib/access-store";
import { requireSessionUser } from "@/lib/session";
import { listEliteCheckoutOrdersForUser } from "@/lib/elite-checkout-store";
import { hasUniversityAccess } from "@/lib/university-access";

export default async function DashboardPage() {
  const user = await requireSessionUser();
  const access = await resolveAccess(user);

  if (!hasAccess(access, "contacts.view") && !hasAccess(access, "registrations")) {
    const universityOpen = hasUniversityAccess(user) && hasAccess(access, "university");
    const profilePending = !user.profileComplete;
    const [crmContact, checkoutOrders, courses] = await Promise.all([
      getContactByEmail(user.email).catch(() => null),
      listEliteCheckoutOrdersForUser(user.id),
      universityOpen ? listUniversityCourses() : Promise.resolve([]),
    ]);
    const checkoutOrder = checkoutOrders[0];
    const needsAddressConfirm = user.role === "contact" && contactNeedsAddressConfirm(crmContact);

    return (
      <DashboardShell
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description={
          universityOpen
            ? "University and Mastermind sessions are open. The team still reviews payment on our side."
            : "University is locked until the team restores access."
        }
      >
        <div className="account-dash-stack">
          {universityOpen ? (
            <>
              <div className="dashboard-span-2" style={{ minHeight: "28rem" }}>
                <UniversityCommunityEmbed unlocked verifyHref="/dashboard" />
              </div>
              <UniversityCourseGrid courses={courses} unlocked verifyHref="/dashboard" />
            </>
          ) : (
            <UniversityCommunityEmbed unlocked={false} verifyHref="/dashboard" />
          )}
          {needsAddressConfirm ? (
            <ContactAddressVerifyNotice address={crmContact?.address || user.address} />
          ) : null}
          {profilePending ? <PendingMemberHome user={user} compact /> : null}
          {checkoutOrder ? (
            <MacosWindow title="Your Mastermind order" className="dashboard-span-2">
              <dl className="registration-meta checkout-order-meta">
                <div>
                  <dt>Order</dt>
                  <dd>JDC Mastermind{checkoutOrder.coachingHours > 0 ? " + Private Coaching" : ""}</dd>
                </div>
                <div>
                  <dt>Private coaching</dt>
                  <dd>
                    {checkoutOrder.coachingHours > 0
                      ? `${checkoutOrder.coachingHours} ${checkoutOrder.coachingMode === "in-person" ? "in-person" : "online"} hour${checkoutOrder.coachingHours === 1 ? "" : "s"} with Coach Jayson Dela Cruz`
                      : "Not included"}
                  </dd>
                </div>
                <div>
                  <dt>Payment method</dt>
                  <dd>{checkoutOrder.paymentMethod}</dd>
                </div>
                <div>
                  <dt>Order total</dt>
                  <dd>{formatPhp(checkoutOrder.price)}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    {checkoutOrder.status === "approved"
                      ? "Payment approved"
                      : checkoutOrder.status === "rejected"
                        ? "Payment rejected — contact support"
                        : "Verification in progress"}
                  </dd>
                </div>
              </dl>
              {checkoutOrder.status === "rejected" ? (
                <p className="macos-lead" style={{ textAlign: "left", marginTop: "0.75rem" }}>
                  We couldn&apos;t verify your receipt, so University access is locked for now. Reply to your
                  confirmation email or contact support to resolve this.
                </p>
              ) : null}
            </MacosWindow>
          ) : null}
          <AccountProfileDashboard
            user={user}
            showWorkspaceLinks={universityOpen}
            needsAddressConfirm={needsAddressConfirm}
            mapAddress={crmContact?.address}
          />
          {universityOpen && hasAccess(access, "partnership") ? (
            <p className="account-dash-inline-link">
              You have invite-only partner access — 20% recorded and released on the 15th and 30th.{" "}
              <Link href="/dashboard/partnership">Open Partnership →</Link>
            </p>
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
              Contacts
            </Link>
          </MacosWindow>

          <QuickLinksCard
            className="dashboard-span-2"
            links={[
              {
                href: "/dashboard/profile",
                label: "Your account",
                description: "Update your photo, phone, company, and password.",
                icon: Users,
              },
              ...(hasAccess(access, "partnership")
                ? [
                    {
                      href: "/dashboard/partnership",
                      label: "Partnership Program",
                      description: "Your 20% partnership link, tree, and 15th/30th payouts.",
                      icon: Handshake,
                    },
                  ]
                : []),
            ]}
          />

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
            Contacts
          </Link>
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

        <QuickLinksCard
          className="dashboard-span-2"
          links={[
            {
              href: "/dashboard/university",
              label: "University",
              description: "The JDC Elite Society community at community.coachjdc.org.",
              icon: GraduationCap,
            },
            {
              href: "/dashboard/contacts?view=registrants",
              label: "Registrants",
              description: "Verify member and contact sign-ups after they finish their profile.",
              icon: Users,
            },
            {
              href: "/dashboard/payments",
              label: "Mastermind payments",
              description: "Review checkout receipts and approve confirmed payments.",
              icon: CreditCard,
            },
            {
              href: "/dashboard/partnership",
              label: "Partnership Program",
              description: `Next payday ${formatManilaDate(partnership.payday)} · ${formatPhp(partnership.pendingPayout)} waiting · ${partnership.activeAffiliates} active affiliates.`,
              icon: Handshake,
            },
            {
              href: "/dashboard/integrations",
              label: "Integrations",
              description: "Google Maps, Cloudflare R2, and GoHighLevel configuration.",
              icon: Plug,
            },
          ]}
        />
      </div>
    </DashboardShell>
  );
}
