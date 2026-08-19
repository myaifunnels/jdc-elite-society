import Link from "next/link";

import {
  GhlIntegrationForm,
  GoogleMapsIntegrationForm,
  R2IntegrationForm,
} from "@/components/dashboard/integration-forms";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GhlMirrorButton } from "@/components/dashboard/ghl-mirror-button";
import { AddressMap } from "@/components/maps/address-map";
import { getGhlSyncState } from "@/lib/crm-store";
import { isGhlReady, isMapsReady, isR2Ready, maskSecret } from "@/lib/integrations";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { requireRoles } from "@/lib/session";
import { siteUrl } from "@/lib/site";

export default async function IntegrationsPage() {
  await requireRoles(["admin"]);

  const settings = await getResolvedIntegrationSettings();
  const mapsReady = isMapsReady(settings);
  const r2Ready = isR2Ready(settings);
  const ghlReady = isGhlReady(settings);
  const syncState = await getGhlSyncState();
  const webhookUrl = `${siteUrl}/api/integrations/ghl/webhook?secret=${encodeURIComponent(syncState.webhookSecret)}`;
  const syncUrl = `${siteUrl}/api/integrations/ghl/sync?secret=${encodeURIComponent(syncState.webhookSecret)}`;

  return (
    <DashboardShell
      title="Integrations"
      description="Paste Google Maps, Cloudflare R2, and GoHighLevel credentials. The JDC Elite Society contact roster mirrors that subaccount."
    >
      <div className="grid gap-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="glass-panel rounded-[2rem] p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold">Google Maps</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Paste the Maps Embed API key to enable live map previews on contact dashboards.
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
                href="/dashboard"
                className="button-secondary pressable rounded-full px-4 py-2 text-sm font-semibold"
              >
                Open dashboard map
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

        <section className="glass-panel rounded-[2rem] p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold">GoHighLevel — JDC Elite Society</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Mirror contacts from the AiFunnels GHL JDC Elite Society subaccount, including every standard and
                custom field. Use a Private Integration token with Contacts read/write and Custom Fields read on that
                location.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                ghlReady ? "bg-emerald-500/14 text-emerald-300" : "bg-amber-500/14 text-amber-200"
              }`}
            >
              {ghlReady ? "Connected" : "Pending token"}
            </span>
          </div>
          <div className="mt-6 grid gap-2 text-sm text-[var(--muted)]">
            <p>
              Location: <code>{settings.ghlLocationId || "not set"}</code>
            </p>
            <p>
              Last mirror:{" "}
              <code>{syncState.lastSyncedAt ? new Date(syncState.lastSyncedAt).toLocaleString() : "not synced"}</code>
            </p>
            <p>
              Mirrored contacts: <code>{String(syncState.contactCount)}</code>
            </p>
            {syncState.lastError ? (
              <p className="text-red-500">
                Last error: <code>{syncState.lastError}</code>
              </p>
            ) : null}
            <p>
              Webhook URL: <code className="break-all">{ghlReady ? webhookUrl : "save the token first"}</code>
            </p>
            <p>
              Cron sync URL: <code className="break-all">{ghlReady ? syncUrl : "save the token first"}</code>
            </p>
          </div>
          <GhlIntegrationForm configured={ghlReady} locationId={settings.ghlLocationId} />
          {ghlReady ? (
            <div className="mt-6">
              <GhlMirrorButton />
            </div>
          ) : null}
        </section>

        <AddressMap address="Makati City, Metro Manila" embedKey={settings.googleMapsEmbedKey} />
      </div>
    </DashboardShell>
  );
}
