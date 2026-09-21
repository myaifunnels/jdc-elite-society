import Link from "next/link";
import { notFound } from "next/navigation";

import { UserAccessForm } from "@/components/dashboard/access-forms";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DeleteUserButton } from "@/components/dashboard/delete-user-button";
import { MacosWindow } from "@/components/dashboard/macos-window";
import {
  grantUserProgramAction,
  removeUserProgramAction,
  saveUserAccessAction,
} from "@/app/dashboard/access/actions";
import { programs } from "@/data/programs";
import { getRoleDefaults, resolveAccessById } from "@/lib/access-store";
import { getPublicUserById } from "@/lib/auth-store";
import { requireCapability } from "@/lib/session";
import { listUserPrograms } from "@/lib/user-programs-store";

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

  const [defaults, access, userPrograms] = await Promise.all([
    getRoleDefaults(),
    resolveAccessById(user.id, user.role),
    listUserPrograms(user.id),
  ]);
  const programOptions = [
    ...programs.map((program) => ({ slug: program.slug, title: program.title })),
    { slug: "jdc-elite-society", title: "JDC Elite Society" },
  ];

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
      <MacosWindow title="Availed programs">
        {userPrograms.length === 0 ? (
          <p className="macos-lead" style={{ textAlign: "left" }}>
            No programs yet.
          </p>
        ) : (
          <ul className="m-0 grid list-none gap-2 p-0">
            {userPrograms.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {programOptions.find((option) => option.slug === item.programSlug)?.title ?? item.programSlug} ·{" "}
                  {item.status}
                </span>
                <form action={removeUserProgramAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="programSlug" value={item.programSlug} />
                  <button type="submit" className="macos-btn macos-btn-secondary">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={grantUserProgramAction} className="mt-4 flex flex-wrap items-center gap-2">
          <input type="hidden" name="userId" value={user.id} />
          <select name="programSlug" className="input" defaultValue={programOptions[0]?.slug}>
            {programOptions.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.title}
              </option>
            ))}
          </select>
          <select name="status" className="input" defaultValue="active">
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button type="submit" className="macos-btn">
            Add program
          </button>
        </form>
      </MacosWindow>
    </DashboardShell>
  );
}
