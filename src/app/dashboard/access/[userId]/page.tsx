import Link from "next/link";
import { notFound } from "next/navigation";

import { UserAccessForm } from "@/components/dashboard/access-forms";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DeleteUserButton } from "@/components/dashboard/delete-user-button";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { saveUserAccessAction } from "@/app/dashboard/access/actions";
import { getRoleDefaults, resolveAccessById } from "@/lib/access-store";
import { getPublicUserById } from "@/lib/auth-store";
import { requireCapability } from "@/lib/session";

export default async function UserAccessPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { user: actor } = await requireCapability("access");
  const { userId } = await params;
  const user = await getPublicUserById(userId);
  if (!user) {
    notFound();
  }

  const [defaults, access] = await Promise.all([getRoleDefaults(), resolveAccessById(user.id, user.role)]);

  return (
    <DashboardShell
      title={user.name}
      description={`Detailed access for ${user.email}. Start from the ${access.role} defaults, then allow or deny specific rooms.`}
    >
      <MacosWindow title="User configuration">
        <p className="macos-lead" style={{ textAlign: "left" }}>
          Inherit keeps the role default. Allow / Deny overrides that default for this person only.
        </p>
        <UserAccessForm
          userId={user.id}
          role={access.role}
          defaults={defaults[access.role]}
          overrides={access.overrides}
          action={saveUserAccessAction}
        />
        <div className="macos-actions">
          <Link href="/dashboard/access" className="macos-btn macos-btn-secondary">
            Back to Access
          </Link>
          {actor.role === "admin" && user.id !== actor.id ? (
            <DeleteUserButton userId={user.id} name={user.name} />
          ) : null}
        </div>
      </MacosWindow>
    </DashboardShell>
  );
}
