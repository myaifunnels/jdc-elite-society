import Link from "next/link";

import {
  GoogleMapsIntegrationForm,
  R2IntegrationForm,
} from "@/components/dashboard/integration-forms";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AddressMap } from "@/components/maps/address-map";
import { isMapsReady, isR2Ready, maskSecret } from "@/lib/integrations";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { requireSessionUser } from "@/lib/session";

export default async function IntegrationsPage() {
  const user = await requireSessionUser();

  if (user.role !== "admin") {
    return (
      <DashboardShell
        role={user.role}
        title="Integrations"
        description="Only admins can manage platform integrations."
      >
        <div className="glass-panel rounded-[2rem] p-8 text-sm text-[var(--muted)]">
          Partner sessions do not have access to integration management.
        </div>
      </DashboardShell>
    );
  }

  const settings = await getResolvedIntegrationSettings();
  const mapsReady = isMapsReady(settings);
  const r2Ready = isR2Ready(settings);

  return (
    <DashboardShell
      role={user.role}
      title="Integrations"
      description="Paste Google Maps and Cloudflare R2 credentials here. The dashboards will use them immediately."
    >
      <div className="grid gap-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="glass-panel rounded-[2rem] p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold">Google Maps</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Paste the Maps Embed API key to enable live map previews in the admin Maps workspace.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  mapsReady
                    ? "bg-emerald-500/14 text-emerald-300"
                    : "bg-amber-500/14 text-amber-200"
                }`}
              >
                {mapsReady ? "Configured" : "Pending key"}
              </span>
            </div>

            <div className="mt-6 text-sm text-[var(--muted)]">
              Current key: <code>{maskSecret(settings.googleMapsEmbedKey)}</code>
            </div>

            <GoogleMapsIntegrationForm configured={mapsReady} />

            <div className="mt-6">
              <Link
                href="/dashboard/maps"
                className="button-secondary pressable rounded-full px-4 py-2 text-sm font-semibold"
              >
                Open Maps workspace
              </Link>
            </div>
          </section>

          <section className="glass-panel rounded-[2rem] p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold">Cloudflare R2</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Paste the R2 account, keys, bucket, and public URL to keep media off Render&apos;s ephemeral disk.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  r2Ready
                    ? "bg-emerald-500/14 text-emerald-300"
                    : "bg-amber-500/14 text-amber-200"
                }`}
              >
                {r2Ready ? "Connected" : "Pending secrets"}
              </span>
            </div>

            <div className="mt-6 grid gap-2 text-sm text-[var(--muted)]">
              <p>
                Bucket: <code>{settings.r2Bucket || "not set"}</code>
              </p>
              <p>
                Public URL: <code>{settings.r2PublicUrl || "not set"}</code>
              </p>
              <p>
                Access key: <code>{maskSecret(settings.r2AccessKeyId)}</code>
              </p>
            </div>

            <R2IntegrationForm
              accountId={settings.r2AccountId}
              bucket={settings.r2Bucket}
              publicUrl={settings.r2PublicUrl}
              accessKeyConfigured={Boolean(settings.r2AccessKeyId)}
            />
          </section>
        </div>

        <AddressMap address="Makati City, Metro Manila" embedKey={settings.googleMapsEmbedKey} />
      </div>
    </DashboardShell>
  );
}
