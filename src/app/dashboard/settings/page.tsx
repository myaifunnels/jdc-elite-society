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

        <p className="account-dash-inline-link">
          R2 configuration:{" "}
          <span className={r2Configured ? "text-emerald-400" : "text-amber-300"}>
            {r2Configured ? "connected" : "awaiting Admin Integrations"}
          </span>
          {" — "}
          <Link href="/dashboard/integrations?provider=r2">Open Integrations →</Link>
        </p>

        <details className="dashboard-disclosure">
          <summary>Environment checklist</summary>
          <div className="dashboard-disclosure-body">
            <ul className="grid gap-3 text-sm text-[var(--muted)]">
              <li>• Primary domain: `https://coachjdc.org`</li>
              <li>• Mastermind offer: `https://elite.coachjdc.org` and `/elite`</li>
              <li>• `DATABASE_URL` so saved Google Maps and R2 credentials persist across deploys</li>
              <li>• `RESEND_API_KEY` sends Mastermind buyer + team emails; GHL SMS (or Twilio) sends text alerts</li>
              <li>• Optional env fallbacks: `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` and R2 secrets</li>
              <li>• Preferred: paste Maps and R2 credentials in Admin Integrations</li>
            </ul>
          </div>
        </details>
      </div>
    </DashboardShell>
  );
}
