import { DesignSystemPanel } from "@/components/dashboard/design-system-panel";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LogoSettingsForm } from "@/components/dashboard/logo-settings-form";
import { getResolvedBrandingSettings } from "@/lib/branding-store";
import { isR2Configured } from "@/lib/r2";
import { requireCapability } from "@/lib/session";
import Link from "next/link";

export default async function SettingsPage() {
  await requireCapability("settings");
  const r2Configured = await isR2Configured();
  const branding = await getResolvedBrandingSettings();

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
              <li>• Mastermind offer: `https://elite.coachjdc.org` and `/elite`</li>
              <li>• `DATABASE_URL` so saved Google Maps and R2 credentials persist across deploys</li>
              <li>• Optional env fallbacks: `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` and R2 secrets</li>
              <li>• Preferred: paste Maps and R2 credentials in Admin Integrations</li>
            </ul>
          </section>

          <section className="glass-panel rounded-[2rem] p-8">
            <p className="text-sm font-semibold">Status</p>
            <p className="mt-4 text-lg">
              R2 configuration:{" "}
              <span className={r2Configured ? "text-emerald-400" : "text-amber-300"}>
                {r2Configured ? "connected" : "awaiting Admin Integrations"}
              </span>
            </p>
            <p className="mt-3 text-sm text-[var(--muted)]">
              This page is designed as the operational handoff point before launching and wiring production integrations.
            </p>
            <Link
              href="/dashboard/access"
              className="button-secondary pressable mt-6 inline-flex rounded-full px-4 py-2 text-sm font-semibold"
            >
              Open Access configuration
            </Link>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
