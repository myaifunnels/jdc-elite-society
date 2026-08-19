import Link from "next/link";

import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { ContactsMap } from "@/components/dashboard/contacts-map";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { listContactMapPins, listContacts, listTagIndex } from "@/lib/crm-store";
import { requireRoles } from "@/lib/session";
import { TAG_GROUPS, tagGroupFor, uniqueTags } from "@/lib/tags";
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
  const user = await requireRoles(["admin", "partner"]);
  const raw = await searchParams;
  const view: View = raw.view === "roster" || raw.view === "map" ? raw.view : "dashboard";
  const kind: ContactKind | undefined =
    user.role === "admin" && (raw.kind === "partner" || raw.kind === "contact")
      ? raw.kind
      : user.role === "partner"
        ? "contact"
        : undefined;
  const selectedTags = asList(raw.tag);
  const query = { kind, tags: selectedTags, q: raw.q };
  const [contacts, allContacts, tags, pins] = await Promise.all([
    listContacts(user, query),
    listContacts(user, { kind }),
    listTagIndex(user),
    listContactMapPins(user, query),
  ]);

  const ghlCount = allContacts.filter((contact) => contact.ghlContactId || contact.source.includes("GHL")).length;
  const taggedCount = allContacts.filter((contact) => contact.tags.length > 0).length;
  const followUp = allContacts.filter((contact) => contact.status === "follow-up" || contact.status === "qualified");

  const views = [
    { id: "dashboard" as const, label: "Dashboard" },
    { id: "roster" as const, label: "Roster" },
    { id: "map" as const, label: "Map" },
  ];
  const kinds =
    user.role === "admin"
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
      title={user.role === "admin" ? "Contacts" : "My contacts"}
      description={
        user.role === "admin"
          ? "JDC Elite Society roster from AiFunnels GHL: tags sync both ways, with a dashboard and a map."
          : "Only the people assigned to you. Tags follow the GHL Elite Society subaccount."
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

        <form className="contact-search" action="/dashboard/contacts" method="get">
          {view !== "dashboard" ? <input type="hidden" name="view" value={view} /> : null}
          {kind ? <input type="hidden" name="kind" value={kind} /> : null}
          {selectedTags.map((tag) => (
            <input key={tag} type="hidden" name="tag" value={tag} />
          ))}
          <input name="q" defaultValue={raw.q ?? ""} placeholder="Search name, email, city, or tag" />
          <button type="submit" className="macos-btn macos-btn-secondary">
            Search
          </button>
        </form>

        <div className="contact-tag-cloud">
          {TAG_GROUPS.flatMap((group) => group.tags)
            .concat(tags.filter((item) => item.count > 0).map((item) => item.tag))
            .filter((tag, index, list) => list.findIndex((item) => item.toLowerCase() === tag.toLowerCase()) === index)
            .slice(0, 28)
            .map((tag) => {
              const active = selectedTags.some((item) => item.toLowerCase() === tag.toLowerCase());
              const nextTags = active
                ? selectedTags.filter((item) => item.toLowerCase() !== tag.toLowerCase())
                : uniqueTags([...selectedTags, tag]);
              const count = tags.find((item) => item.tag.toLowerCase() === tag.toLowerCase())?.count ?? 0;
              return (
                <Link
                  key={tag}
                  href={contactsHref({ view, kind, q: raw.q, tags: nextTags })}
                  className={cn("tag-chip", `is-${tagGroupFor(tag)}`, active && "is-active")}
                >
                  {tag}
                  {count ? <em>{count}</em> : null}
                </Link>
              );
            })}
          {selectedTags.length ? (
            <Link href={contactsHref({ view, kind, q: raw.q })} className="tag-chip is-ghost">
              Clear tags
            </Link>
          ) : null}
        </div>

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
                <p className="macos-kicker">Tagged</p>
                <p className="dashboard-metric-value">{taggedCount}</p>
                <p className="dashboard-metric-copy">Tags pull and push with GHL</p>
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
                      {contact.tags.slice(0, 4).join(" · ") || contact.source} · {contact.city || contact.status}
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
                  <th>Tags</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No contacts match those filters.</td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
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
                      <td>
                        <div className="contact-tag-cloud is-compact">
                          {contact.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className={cn("tag-chip", `is-${tagGroupFor(tag)}`)}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>{contact.region ?? contact.city}</td>
                      <td className="capitalize">{contact.status}</td>
                      <td>
                        <Link href={`/dashboard/contacts/${contact.id}`} className="macos-btn macos-btn-secondary">
                          Dashboard
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </MacosWindow>
    </DashboardShell>
  );
}
