import Link from "next/link";

import { RoleDefaultsForm } from "@/components/dashboard/access-forms";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DeleteUserButton } from "@/components/dashboard/delete-user-button";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { Pagination } from "@/components/dashboard/pagination";
import { ACCESS_ROLES } from "@/lib/access";
import { getRoleDefaults } from "@/lib/access-store";
import { listAllUsers } from "@/lib/auth-store";
import { parsePage, paginate } from "@/lib/pagination";
import { requireCapability } from "@/lib/session";
import { saveRoleDefaultAction } from "@/app/dashboard/access/actions";

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { user: actor } = await requireCapability("access");
  const [{ page: pageParam }, defaults, users] = await Promise.all([
    searchParams,
    getRoleDefaults(),
    listAllUsers(),
  ]);
  const paged = paginate(users, parsePage(pageParam), 25);

  return (
    <DashboardShell
      title="Access"
      description="Role defaults for Admin, Partner, Member, and Contact. Tweak a person when they need more or less than the default."
    >
      <div className="dashboard-widget-grid">
        {ACCESS_ROLES.map((role) => (
          <MacosWindow key={role.id} title={`${role.label} defaults`} className={role.id === "admin" ? "dashboard-span-2" : undefined}>
            <p className="macos-lead" style={{ textAlign: "left" }}>
              {role.detail}
            </p>
            <RoleDefaultsForm role={role.id} defaults={defaults[role.id]} action={saveRoleDefaultAction} />
          </MacosWindow>
        ))}

        <MacosWindow title="People" className="dashboard-span-2">
          <div className="overflow-x-auto">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {paged.items.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      <div className="text-xs text-[var(--muted)]">{user.email}</div>
                    </td>
                    <td className="capitalize">{user.role}</td>
                    <td className="capitalize">{user.accountStatus}</td>
                    <td>
                      <div className="contact-row-actions">
                        <Link href={`/dashboard/access/${user.id}`} className="macos-btn macos-btn-secondary">
                          Configure
                        </Link>
                        {actor.role === "admin" && user.id !== actor.id ? (
                          <DeleteUserButton userId={user.id} name={user.name} />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={paged.page} pages={paged.pages} total={paged.total} hrefBase="/dashboard/access" noun="accounts" />
        </MacosWindow>
      </div>
    </DashboardShell>
  );
}
