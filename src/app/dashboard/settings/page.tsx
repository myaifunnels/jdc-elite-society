import { DesignSystemPanel } from "@/components/dashboard/design-system-panel";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isR2Configured } from "@/lib/r2";
import { requireSessionUser } from "@/lib/session";

export default async function SettingsPage() {
  const user = await requireSessionUser();

  if (user.role !== "admin") {
    return (
      <DashboardShell
        role={user.role}
        title="Settings"
        description="Only admins can configure platform-level deployment and integration settings."
      >
        <div className="card-surface rounded-[2rem] p-8 text-sm text-[var(--muted)]">
          Partner sessions do not have access to platform settings.
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      role={user.role}
      title="Settings, design system, and deployment readiness"
      description="Tune the live palette, then confirm the platform is ready for deployment and admin-side integrations."
    >
      <div className="grid gap-6">
        <DesignSystemPanel />

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="glass-panel rounded-[2rem] p-8">
            <p className="text-sm font-semibold">Environment checklist</p>
            <ul className="mt-5 grid gap-3 text-sm text-[var(--muted)]">
              <li>• `DATABASE_URL` for the CRM data layer</li>
              <li>• `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` for the admin maps workspace</li>
              <li>• `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`</li>
              <li>• `R2_BUCKET` and `R2_PUBLIC_URL` for durable media</li>
            </ul>
          </section>

          <section className="glass-panel rounded-[2rem] p-8">
            <p className="text-sm font-semibold">Status</p>
            <p className="mt-4 text-lg">
              R2 configuration:{" "}
              <span className={isR2Configured() ? "text-green-700" : "text-amber-700"}>
                {isR2Configured() ? "connected" : "awaiting environment variables"}
              </span>
            </p>
            <p className="mt-3 text-sm text-[var(--muted)]">
              This page is designed as the operational handoff point before launching and wiring production integrations.
            </p>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
