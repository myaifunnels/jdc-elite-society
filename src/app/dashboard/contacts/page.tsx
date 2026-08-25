import Link from "next/link";

import { ApproveAllRegistrationsForm } from "@/components/dashboard/approve-all-registrations-form";
import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { ContactsMap } from "@/components/dashboard/contacts-map";
import { ContactsSearch } from "@/components/dashboard/contacts-search";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DeleteUserButton } from "@/components/dashboard/delete-user-button";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { OpenUserDashboardButton } from "@/components/dashboard/open-user-dashboard-button";
import { Pagination } from "@/components/dashboard/pagination";
import { VerifyPaymentButton } from "@/components/dashboard/verify-payment-button";
import { hasAccess } from "@/lib/access";
import { listAllUsers, listMemberRegistrations } from "@/lib/auth-store";
import { contactsHref, parseContactsView } from "@/lib/contacts-href";
import { CONTACTS_PAGE_SIZE, contactIdsByEmail, listContactMapPins, listContacts, listTagIndex } from "@/lib/crm-store";
import { membershipLabel } from "@/lib/membership";
import { parsePage, paginate } from "@/lib/pagination";
import { requireAnyCapability } from "@/lib/session";
import { uniqueTags } from "@/lib/tags";
import { ContactKind } from "@/lib/types";
import { cn } from "@/lib/utils";

function asList(value?: string | string[]) {
  return uniqueTags((Array.isArray(value) ? value : value ? [value] : []).flatMap((item) => item.split(",")));
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{
    kind?: string;
    view?: string;
    tag?: string | string[];
    q?: string;
    page?: string;
    status?: string;
  }>;
}) {
  const { user, access } = await requireAnyCapability("contacts.view", "registrations");
  const canSeeContacts = hasAccess(access, "contacts.view");
  const canSeeRegistrants = hasAccess(access, "registrations");
  const viewer = { ...user, seeAllContacts: hasAccess(access, "contacts.all") };
  const raw = await searchParams;
  const requested = parseContactsView(raw.view);
  const view =
    requested === "registrants" && !canSeeRegistrants
      ? "dashboard"
      : !canSeeContacts && canSeeRegistrants
        ? "registrants"
        : requested;
  const kind: ContactKind | undefined =
    hasAccess(access, "contacts.all") && (raw.kind === "partner" || raw.kind === "contact")
      ? raw.kind
      : hasAccess(access, "contacts.all")
        ? undefined
        : "contact";
  const selectedTags = asList(raw.tag);
  const query = { kind, tags: selectedTags, q: raw.q };
  const page = parsePage(raw.page);
  const registrantStatus = raw.status === "pending" || raw.status === "verified" ? raw.status : "all";

  const matching = view === "registrants" || !canSeeContacts ? [] : await listContacts(viewer, query);
  const allForKind =
    view === "registrants" || !canSeeContacts
      ? []
      : raw.q || selectedTags.length
        ? await listContacts(viewer, { kind })
        : matching;
  const paged = paginate(matching, page, CONTACTS_PAGE_SIZE);
  const tags = view === "registrants" || !canSeeContacts ? [] : await listTagIndex(viewer);
  const pins =
    view === "map" && canSeeContacts
      ? await listContactMapPins(viewer, query, { geocode: true })
      : [];
  const users = view === "roster" && user.role === "admin" ? await listAllUsers() : [];
  const usersByEmail = new Map(users.map((item) => [item.email.toLowerCase(), item]));

  const registrants =
    canSeeRegistrants && (view === "registrants" || view === "dashboard") ? await listMemberRegistrations() : [];
  const registrantNeedle = String(raw.q ?? "").trim().toLowerCase();
  const filteredRegistrants = registrants.filter((member) => {
    if (registrantStatus === "pending" && member.paymentVerified) {
      return false;
    }
    if (registrantStatus === "verified" && !member.paymentVerified) {
      return false;
    }
    if (!registrantNeedle) {
      return true;
    }
    return [member.name, member.email, member.phone, member.company]
      .join(" ")
      .toLowerCase()
      .includes(registrantNeedle);
  });
  const pendingCount = registrants.filter((member) => !member.paymentVerified).length;
  const pagedRegistrants = paginate(filteredRegistrants, page, 20);
  const idsByEmail = view === "registrants" ? await contactIdsByEmail() : new Map<string, string>();

  const followUp = allForKind.filter((contact) => contact.status === "follow-up" || contact.status === "qualified");
  const rosterBase = contactsHref({ view, kind, q: raw.q, tags: selectedTags, status: registrantStatus });

  const views = [
    ...(canSeeContacts ? [{ id: "dashboard" as const, label: "Dashboard" }] : []),
    ...(canSeeContacts ? [{ id: "roster" as const, label: "Roster" }] : []),
    ...(canSeeContacts ? [{ id: "map" as const, label: "Map" }] : []),
    ...(canSeeRegistrants ? [{ id: "registrants" as const, label: "Registrants" }] : []),
  ];
  const kinds = hasAccess(access, "contacts.all") && view !== "registrants"
    ? [
        { href: contactsHref({ view, q: raw.q, tags: selectedTags }), label: "All", active: !kind },
        {
          href: contactsHref({ view, kind: "partner", q: raw.q, tags: selectedTags }),
          label: "Partners",
          active: kind === "partner",
        },
        {
          href: contactsHref({ view, kind: "contact", q: raw.q, tags: selectedTags }),
          label: "Contacts",
          active: kind === "contact",
        },
      ]
    : [];

  return (
    <DashboardShell
      title={hasAccess(access, "contacts.all") ? "Contacts" : canSeeContacts ? "My contacts" : "Registrants"}
      description={
        hasAccess(access, "contacts.all")
          ? "Search the Elite Society roster, map, and registrants. Open a user’s dashboard to see what they see."
          : canSeeContacts
            ? "Search the people assigned to you. Filter by tag when you need it."
            : "Verify member sign-ups and payment after they complete their account profile."
      }
    >
      <MacosWindow
        title={
          view === "map"
            ? "Contact map"
            : view === "roster"
              ? "Contact roster"
              : view === "registrants"
                ? "Registrants"
                : "Contacts dashboard"
        }
        className="dashboard-span-2"
        toolbar={
          views.length > 1 ? (
            <div className="macos-toolbar contacts-toolbar">
              <div
                className="macos-segment"
                style={{
                  gridTemplateColumns: `repeat(${views.length}, 1fr)`,
                  width: "min(32rem, 100%)",
                }}
              >
                {views.map((item) => (
                  <Link
                    key={item.id}
                    href={contactsHref({ view: item.id, kind, q: raw.q, tags: selectedTags })}
                    className={cn(view === item.id && "is-active")}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : undefined
        }
      >
        {kinds.length ? (
          <div className="macos-segment" style={{ gridTemplateColumns: "1fr 1fr 1fr", width: "min(24rem, 100%)" }}>
            {kinds.map((filter) => (
              <Link key={filter.href} href={filter.href} className={cn(filter.active && "is-active")}>
                {filter.label}
              </Link>
            ))}
          </div>
        ) : null}

        {view === "registrants" ? (
          <>
            <div className="macos-segment" style={{ gridTemplateColumns: "1fr 1fr 1fr", width: "min(24rem, 100%)" }}>
              <Link
                href={contactsHref({ view: "registrants", q: raw.q })}
                className={cn(registrantStatus === "all" && "is-active")}
              >
                All
              </Link>
              <Link
                href={contactsHref({ view: "registrants", q: raw.q, status: "pending" })}
                className={cn(registrantStatus === "pending" && "is-active")}
              >
                Pending
              </Link>
              <Link
                href={contactsHref({ view: "registrants", q: raw.q, status: "verified" })}
                className={cn(registrantStatus === "verified" && "is-active")}
              >
                Verified
              </Link>
            </div>
            <ContactsSearch view="registrants" q={raw.q} selectedTags={[]} tags={[]} hideTags />
            <ApproveAllRegistrationsForm pendingCount={pendingCount} />
            {filteredRegistrants.length === 0 ? (
              <p className="macos-lead" style={{ textAlign: "left" }}>
                No member or contact registrations match this view.
              </p>
            ) : (
              <>
                {pagedRegistrants.items.map((member) => {
                  const contactId = idsByEmail.get(member.email.toLowerCase());
                  return (
                    <article key={member.id} className="registration-row">
                      <ContactAvatar name={member.name} photoUrl={member.facebookPhotoUrl} size="lg" />
                      <div>
                        <strong>{member.name}</strong>
                        <em>
                          {member.email} · {member.phone} · {member.company || "No company"}
                        </em>
                        <p>
                          Profile {member.profileComplete ? "complete" : "incomplete"} · Payment{" "}
                          {member.paymentVerified ? "verified" : "pending"} · {membershipLabel(member.memberships)} ·{" "}
                          {member.accountStatus}
                        </p>
                      </div>
                      {member.paymentVerified ? (
                        <span className="status-pill is-verified">Verified payment</span>
                      ) : (
                        <VerifyPaymentButton userId={member.id} />
                      )}
                      {contactId ? (
                        <Link href={`/dashboard/contacts/${contactId}`} className="macos-btn macos-btn-secondary">
                          Contact
                        </Link>
                      ) : null}
                      {user.role === "admin" && member.id !== user.id ? (
                        <DeleteUserButton userId={member.id} name={member.name} redirectTo="/dashboard/contacts?view=registrants" />
                      ) : null}
                    </article>
                  );
                })}
                <Pagination
                  page={pagedRegistrants.page}
                  pages={pagedRegistrants.pages}
                  total={pagedRegistrants.total}
                  hrefBase={rosterBase}
                  noun="registrants"
                />
              </>
            )}
          </>
        ) : null}

        {view !== "registrants" ? (
          <ContactsSearch view={view} kind={kind} q={raw.q} selectedTags={selectedTags} tags={tags} />
        ) : null}

        {view === "dashboard" ? (
          <>
            <div className="contacts-metric-row">
              <article className="dashboard-metric-card">
                <p className="macos-kicker">Roster</p>
                <p className="dashboard-metric-value">{allForKind.length}</p>
                <p className="dashboard-metric-copy">People in this view</p>
              </article>
              {canSeeRegistrants ? (
                <article className="dashboard-metric-card">
                  <p className="macos-kicker">Pending registrants</p>
                  <p className="dashboard-metric-value">{pendingCount}</p>
                  <p className="dashboard-metric-copy">Waiting on payment verification</p>
                </article>
              ) : (
                <article className="dashboard-metric-card">
                  <p className="macos-kicker">Follow-up</p>
                  <p className="dashboard-metric-value">{followUp.length}</p>
                  <p className="dashboard-metric-copy">Qualified or waiting</p>
                </article>
              )}
            </div>

            <div className="dashboard-contact-list">
              {matching.slice(0, 8).map((contact) => (
                <Link key={contact.id} href={`/dashboard/contacts/${contact.id}`} className="dashboard-contact-row">
                  <ContactAvatar name={contact.name} photoUrl={contact.photoUrl} />
                  <span>
                    <strong>{contact.name}</strong>
                    <em>
                      {contact.email} · {contact.city || contact.address || contact.status}
                    </em>
                  </span>
                </Link>
              ))}
            </div>
            {matching.length > 8 ? (
              <Link href={contactsHref({ view: "roster", kind, q: raw.q, tags: selectedTags })} className="macos-btn macos-btn-secondary self-start">
                View all {matching.length} in roster
              </Link>
            ) : null}
            {canSeeRegistrants && pendingCount > 0 ? (
              <Link href={contactsHref({ view: "registrants", status: "pending" })} className="macos-btn macos-btn-secondary self-start">
                Review {pendingCount} pending registrant{pendingCount === 1 ? "" : "s"}
              </Link>
            ) : null}

            {canSeeContacts ? (
              <Link href={contactsHref({ view: "map", kind, q: raw.q, tags: selectedTags })} className="macos-btn macos-btn-secondary self-start">
                Open the map view
              </Link>
            ) : null}
          </>
        ) : null}

        {view === "map" ? <ContactsMap pins={pins} tall /> : null}

        {view === "roster" ? (
          <>
            <div className="overflow-x-auto">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Status</th>
                    {user.role === "admin" ? <th>Portal</th> : null}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.items.length === 0 ? (
                    <tr>
                      <td colSpan={user.role === "admin" ? 6 : 5}>No contacts match those filters.</td>
                    </tr>
                  ) : (
                    paged.items.map((contact) => {
                      const portal = usersByEmail.get(contact.email.toLowerCase());
                      return (
                        <tr key={contact.id}>
                          <td>
                            <div className="dashboard-contact-row is-plain">
                              <ContactAvatar name={contact.name} photoUrl={contact.photoUrl} size="sm" />
                              <span>
                                <strong>{contact.name}</strong>
                                <em>{contact.email}</em>
                              </span>
                            </div>
                          </td>
                          <td className="capitalize">{contact.kind}</td>
                          <td>{contact.region ?? contact.city ?? contact.address}</td>
                          <td className="capitalize">{contact.status}</td>
                          {user.role === "admin" ? (
                            <td className="capitalize">
                              {portal
                                ? portal.role
                                : contact.ghlContactId || contact.source.toLowerCase().includes("ghl")
                                  ? "Contact"
                                  : "No login"}
                            </td>
                          ) : null}
                          <td>
                            <div className="contact-row-actions">
                              <Link href={`/dashboard/contacts/${contact.id}`} className="macos-btn macos-btn-secondary">
                                Contact
                              </Link>
                              {user.role === "admin" && portal?.role !== "admin" && contact.email ? (
                                <OpenUserDashboardButton
                                  userId={portal?.id}
                                  email={contact.email}
                                  name={contact.name}
                                  phone={contact.phone}
                                  label="User dashboard"
                                />
                              ) : null}
                              {user.role === "admin" && portal && portal.id !== user.id ? (
                                <DeleteUserButton userId={portal.id} name={contact.name} />
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={paged.page} pages={paged.pages} total={paged.total} hrefBase={rosterBase} noun="contacts" />
          </>
        ) : null}
      </MacosWindow>
    </DashboardShell>
  );
}
