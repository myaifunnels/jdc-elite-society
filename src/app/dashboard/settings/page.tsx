import Link from "next/link";

import { DesignSystemPanel } from "@/components/dashboard/design-system-panel";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LogoSettingsForm } from "@/components/dashboard/logo-settings-form";
import { getResolvedBrandingSettings } from "@/lib/branding-store";
import { isGhlReady } from "@/lib/integrations";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { isR2Configured } from "@/lib/r2";
import { requireSessionUser } from "@/lib/session";

export default async function SettingsPage() {
  const user = await requireSessionUser();

  if (user.role !== "admin") {
    return (
      <DashboardShell
        title="Settings"
        description="Only admins can configure platform-level deployment and integration settings."
      >
        <div className="card-surface rounded-[2rem] p-8 text-sm text-[var(--muted)]">
          Partner sessions do not have access to platform settings.
        </div>
      </DashboardShell>
    );
  }

  const branding = await getResolvedBrandingSettings();
  const r2Configured = await isR2Configured();
  const settings = await getResolvedIntegrationSettings();
  const ghlConfigured = isGhlReady(settings);

  return (
    <DashboardShell
      title="Settings, design system, and deployment readiness"
      description="Tune the live palette, add a site logo link, then confirm the platform is ready for deployment and admin-side integrations."
    >
      <div className="grid gap-6">
        <LogoSettingsForm branding={branding} />
        <DesignSystemPanel />

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="glass-panel rounded-[2rem] p-8">
            <p className="text-sm font-semibold">Environment checklist</p>
            <ul className="mt-5 grid gap-3 text-sm text-[var(--muted)]">
              <li>• Primary domain: `https://coachjdc.org`</li>
              <li>• `DATABASE_URL` so saved GHL, Google Maps, and R2 credentials persist across deploys</li>
              <li>• Preferred: paste GHL, Maps, and R2 credentials in Admin Integrations</li>
              <li>• Optional env fallbacks: `GHL_PRIVATE_TOKEN`, `GHL_LOCATION_ID`, Maps, and R2 secrets</li>
            </ul>
          </section>

          <section className="glass-panel rounded-[2rem] p-8">
            <p className="text-sm font-semibold">Status</p>
            <p className="mt-4 text-lg">
              GoHighLevel:{" "}
              <span className={ghlConfigured ? "text-emerald-400" : "text-amber-300"}>
                {ghlConfigured ? "connected" : "awaiting Admin Integrations"}
              </span>
            </p>
            <p className="mt-3 text-lg">
              R2 configuration:{" "}
              <span className={r2Configured ? "text-emerald-400" : "text-amber-300"}>
                {r2Configured ? "connected" : "awaiting Admin Integrations"}
              </span>
            </p>
            <p className="mt-3 text-sm text-[var(--muted)]">
              This page is designed as the operational handoff point before launching and wiring production integrations.
            </p>
            <Link
              href="/dashboard/integrations"
              className="button-secondary pressable mt-6 inline-flex rounded-full px-4 py-2 text-sm font-semibold"
            >
              Open Integrations workspace
            </Link>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
