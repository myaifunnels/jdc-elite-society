import Link from "next/link";

import { RoleDefaultsForm } from "@/components/dashboard/access-forms";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { ACCESS_ROLES, overrideCount } from "@/lib/access";
import { getRoleDefaults, resolveAccessById } from "@/lib/access-store";
import { listAllUsers } from "@/lib/auth-store";
import { requireCapability } from "@/lib/session";
import { saveRoleDefaultAction } from "@/app/dashboard/access/actions";

export default async function AccessPage() {
  await requireCapability("access");
  const [defaults, users] = await Promise.all([getRoleDefaults(), listAllUsers()]);

  const people = await Promise.all(
    users.map(async (user) => {
      const access = await resolveAccessById(user.id, user.role);
      return { user, access };
    }),
  );

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
                  <th>Overrides</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {people.map(({ user, access }) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      <div className="text-xs text-[var(--muted)]">{user.email}</div>
                    </td>
                    <td className="capitalize">{access.role}</td>
                    <td>{overrideCount(access.overrides) || "Defaults"}</td>
                    <td>
                      <Link href={`/dashboard/access/${user.id}`} className="macos-btn macos-btn-secondary">
                        Configure
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MacosWindow>
      </div>
    </DashboardShell>
  );
}
