import Link from "next/link";

import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GhlMirrorButton } from "@/components/dashboard/ghl-mirror-button";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { getGhlSyncState, listContacts } from "@/lib/crm-store";
import { maybeRefreshGhlMirror } from "@/lib/ghl";
import { isGhlReady } from "@/lib/integrations";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { requireRoles } from "@/lib/session";
import { ContactKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const user = await requireRoles(["admin", "partner"]);
  const { kind: rawKind } = await searchParams;
  const kind: ContactKind | undefined =
    user.role === "admin" && (rawKind === "partner" || rawKind === "contact") ? rawKind : user.role === "partner" ? "contact" : undefined;

  if (user.role === "admin") {
    await maybeRefreshGhlMirror();
  }

  const contacts = await listContacts(user, kind);
  const settings = await getResolvedIntegrationSettings();
  const syncState = await getGhlSyncState();
  const ghlReady = isGhlReady(settings);

  const filters =
    user.role === "admin"
      ? [
          { href: "/dashboard/contacts", label: "All", active: !kind },
          { href: "/dashboard/contacts?kind=partner", label: "Partners", active: kind === "partner" },
          { href: "/dashboard/contacts?kind=contact", label: "Contacts", active: kind === "contact" },
        ]
      : [];

  return (
    <DashboardShell
      title={user.role === "admin" ? "Contacts" : "My contacts"}
      description={
        user.role === "admin"
          ? "JDC Elite Society GoHighLevel contacts, including standard and custom fields. Open any row for the full mirror."
          : "Only the people assigned to you. You cannot open another partner's book."
      }
    >
      <MacosWindow
        title={user.role === "admin" ? "All contacts" : "Your contacts"}
        toolbar={
          <div className="macos-toolbar">
            {filters.length > 0 ? (
              <div className="macos-segment" style={{ gridTemplateColumns: "1fr 1fr 1fr", width: "min(24rem, 100%)" }}>
                {filters.map((filter) => (
                  <Link key={filter.href} href={filter.href} className={cn(filter.active && "is-active")}>
                    {filter.label}
                  </Link>
                ))}
              </div>
            ) : null}
            {user.role === "admin" && ghlReady ? <GhlMirrorButton /> : null}
          </div>
        }
      >
        {user.role === "admin" ? (
          <p className="macos-lead" style={{ textAlign: "left", marginBottom: "0.75rem" }}>
            {ghlReady
              ? `AiFunnels GHL → JDC Elite Society mirror${syncState.lastSyncedAt ? ` · last synced ${new Date(syncState.lastSyncedAt).toLocaleString()}` : " · not synced yet"} · ${syncState.contactCount || contacts.length} contacts`
              : "Connect GoHighLevel on Integrations to mirror the JDC Elite Society subaccount."}
            {syncState.lastError ? ` · ${syncState.lastError}` : ""}
          </p>
        ) : null}
        <div className="overflow-x-auto">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={6}>No contacts in the mirror yet.</td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td>
                      <div className="dashboard-contact-row is-plain">
                        <ContactAvatar name={contact.name} photoUrl={contact.photoUrl} size="sm" />
                        <span>
                          <strong>{contact.name}</strong>
                          <em>{contact.email || "No email"}</em>
                        </span>
                      </div>
                    </td>
                    <td className="capitalize">{contact.kind}</td>
                    <td>{contact.phone || "—"}</td>
                    <td>{contact.region || contact.city || "—"}</td>
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
      </MacosWindow>
    </DashboardShell>
  );
}
