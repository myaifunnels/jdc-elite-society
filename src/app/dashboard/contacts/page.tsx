import Link from "next/link";

import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { ContactsMap } from "@/components/dashboard/contacts-map";
import { ContactsSearch } from "@/components/dashboard/contacts-search";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DeleteUserButton } from "@/components/dashboard/delete-user-button";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { OpenUserDashboardButton } from "@/components/dashboard/open-user-dashboard-button";
import { hasAccess } from "@/lib/access";
import { listAllUsers } from "@/lib/auth-store";
import { listContactMapPins, listContacts, listTagIndex } from "@/lib/crm-store";
import { requireCapability } from "@/lib/session";
import { uniqueTags } from "@/lib/tags";
import { ContactKind } from "@/lib/types";
import { cn } from "@/lib/utils";

type View = "dashboard" | "roster" | "map";

function asList(value?: string | string[]) {
  return uniqueTags((Array.isArray(value) ? value : value ? [value] : []).flatMap((item) => item.split(",")));
}

function contactsHref(params: { view?: View; kind?: string; q?: string; tags?: string[] }) {
  const search = new URLSearchParams();
  if (params.view && params.view !== "dashboard") {
    search.set("view", params.view);
  }
  if (params.kind) {
    search.set("kind", params.kind);
  }
  if (params.q) {
    search.set("q", params.q);
  }
  for (const tag of params.tags ?? []) {
    search.append("tag", tag);
  }
  const query = search.toString();
  return query ? `/dashboard/contacts?${query}` : "/dashboard/contacts";
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; view?: string; tag?: string | string[]; q?: string }>;
}) {
  const { user, access } = await requireCapability("contacts.view");
  const viewer = { ...user, seeAllContacts: hasAccess(access, "contacts.all") };
  const raw = await searchParams;
  const view: View = raw.view === "roster" || raw.view === "map" ? raw.view : "dashboard";
  const kind: ContactKind | undefined =
    hasAccess(access, "contacts.all") && (raw.kind === "partner" || raw.kind === "contact")
      ? raw.kind
      : hasAccess(access, "contacts.all")
        ? undefined
        : "contact";
  const selectedTags = asList(raw.tag);
  const query = { kind, tags: selectedTags, q: raw.q };
  const [contacts, allContacts, tags, pins] = await Promise.all([
    listContacts(viewer, query),
    listContacts(viewer, { kind }),
    listTagIndex(viewer),
    listContactMapPins(viewer, query),
  ]);
  const users = user.role === "admin" ? await listAllUsers() : [];
  const usersByEmail = new Map(users.map((item) => [item.email.toLowerCase(), item]));

  const ghlCount = allContacts.filter((contact) => contact.ghlContactId || contact.source.includes("GHL")).length;
  const followUp = allContacts.filter((contact) => contact.status === "follow-up" || contact.status === "qualified");

  const views = [
    { id: "dashboard" as const, label: "Dashboard" },
    { id: "roster" as const, label: "Roster" },
    { id: "map" as const, label: "Map" },
  ];
  const kinds = hasAccess(access, "contacts.all")
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
      title={hasAccess(access, "contacts.all") ? "Contacts" : "My contacts"}
      description={
        hasAccess(access, "contacts.all")
          ? "Search the Elite Society roster. Filter by tag when you need it. Open a user’s dashboard to see what they see."
          : "Search the people assigned to you. Filter by tag when you need it."
      }
    >
      <MacosWindow
        title={view === "map" ? "Contact map" : view === "roster" ? "Contact roster" : "Contacts dashboard"}
        className="dashboard-span-2"
        toolbar={
          <div className="macos-toolbar contacts-toolbar">
            <div className="macos-segment" style={{ gridTemplateColumns: "1fr 1fr 1fr", width: "min(24rem, 100%)" }}>
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

        <ContactsSearch view={view} kind={kind} q={raw.q} selectedTags={selectedTags} tags={tags} />

        {view === "dashboard" ? (
          <>
            <div className="contacts-metric-row">
              <article className="dashboard-metric-card">
                <p className="macos-kicker">Roster</p>
                <p className="dashboard-metric-value">{allContacts.length}</p>
                <p className="dashboard-metric-copy">People in this view</p>
              </article>
              <article className="dashboard-metric-card">
                <p className="macos-kicker">GHL synced</p>
                <p className="dashboard-metric-value">{ghlCount}</p>
                <p className="dashboard-metric-copy">From the Elite Society subaccount</p>
              </article>
              <article className="dashboard-metric-card">
                <p className="macos-kicker">Matching</p>
                <p className="dashboard-metric-value">{contacts.length}</p>
                <p className="dashboard-metric-copy">Results for this search</p>
              </article>
              <article className="dashboard-metric-card">
                <p className="macos-kicker">Follow-up</p>
                <p className="dashboard-metric-value">{followUp.length}</p>
                <p className="dashboard-metric-copy">Qualified or waiting</p>
              </article>
            </div>

            <div className="dashboard-contact-list">
              {contacts.slice(0, 8).map((contact) => (
                <Link key={contact.id} href={`/dashboard/contacts/${contact.id}`} className="dashboard-contact-row">
                  <ContactAvatar name={contact.name} photoUrl={contact.photoUrl} />
                  <span>
                    <strong>{contact.name}</strong>
                    <em>
                      {contact.email} · {contact.city || contact.status}
                    </em>
                  </span>
                </Link>
              ))}
            </div>

            <ContactsMap pins={pins} />
          </>
        ) : null}

        {view === "map" ? <ContactsMap pins={pins} tall /> : null}

        {view === "roster" ? (
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
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={user.role === "admin" ? 6 : 5}>No contacts match those filters.</td>
                  </tr>
                ) : (
                  contacts.map((contact) => {
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
                        <td>{contact.region ?? contact.city}</td>
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
        ) : null}
      </MacosWindow>
    </DashboardShell>
  );
}
