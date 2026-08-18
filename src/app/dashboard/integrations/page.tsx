import Link from "next/link";

import {
  GhlIntegrationForm,
  GoogleMapsIntegrationForm,
  R2IntegrationForm,
} from "@/components/dashboard/integration-forms";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AddressMap } from "@/components/maps/address-map";
import {
  isGhlAutoSyncReady,
  isGhlReady,
  isMapsReady,
  isR2Ready,
  maskSecret,
} from "@/lib/integrations";
import {
  getResolvedIntegrationSettings,
  listGhlSyncEvents,
} from "@/lib/integrations-store";
import { requireSessionUser } from "@/lib/session";

function formatSyncTime(value: string) {
  if (!value) {
    return "not yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function IntegrationsPage() {
  const user = await requireSessionUser();

  if (user.role !== "admin") {
    return (
      <DashboardShell
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
  const syncEvents = await listGhlSyncEvents();
  const mapsReady = isMapsReady(settings);
  const r2Ready = isR2Ready(settings);
  const ghlReady = isGhlReady(settings);
  const ghlLive = isGhlAutoSyncReady(settings);

  return (
    <DashboardShell
      title="Integrations"
      description="Connect the JDC Elite Society GoHighLevel subaccount, then keep Google Maps and Cloudflare R2 credentials in the same workspace."
    >
      <div className="grid gap-6">
        <section className="glass-panel rounded-[2rem] p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold">GoHighLevel / GHL</p>
              <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">
                Connect the JDC Elite Society subaccount. Every public form submission will upsert a
                contact there with name, email, phone, address, program interest, and tags.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                ghlLive
                  ? "bg-emerald-500/14 text-emerald-300"
                  : ghlReady
                    ? "bg-amber-500/14 text-amber-200"
                    : "bg-amber-500/14 text-amber-200"
              }`}
            >
              {ghlLive ? "Auto-sync on" : ghlReady ? "Connected, sync off" : "Not connected"}
            </span>
          </div>

          <div className="mt-6 grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
            <p>
              Subaccount:{" "}
              <code>{settings.ghlLocationName || settings.ghlLocationId || "not set"}</code>
            </p>
            <p>
              Token: <code>{maskSecret(settings.ghlPrivateToken)}</code>
            </p>
            <p>
              Last sync: <code>{formatSyncTime(settings.ghlLastSyncedAt)}</code>
            </p>
            <p>
              Last error: <code>{settings.ghlLastError || "none"}</code>
            </p>
          </div>

          <ol className="mt-6 grid gap-2 rounded-[1.5rem] border border-[var(--line)] bg-[color:var(--surface-elevated)]/70 p-5 text-sm text-[var(--muted)]">
            <li>1. Open the JDC Elite Society GHL subaccount.</li>
            <li>
              2. Go to Settings → Private Integrations and create one named{" "}
              <code>Coach JDC Website</code>.
            </li>
            <li>
              3. Enable <code>contacts.write</code>, <code>contacts.readonly</code>, and{" "}
              <code>locations.readonly</code>.
            </li>
            <li>4. Copy the token and the Location ID from Settings → Business Profile.</li>
            <li>5. Save here. New contact-form leads will appear in that subaccount automatically.</li>
          </ol>

          <GhlIntegrationForm
            locationId={settings.ghlLocationId}
            locationName={settings.ghlLocationName}
            tags={settings.ghlTags}
            webhookUrl={settings.ghlWebhookUrl}
            autoSync={settings.ghlAutoSync}
            tokenConfigured={Boolean(settings.ghlPrivateToken)}
          />
        </section>

        <section className="card-surface rounded-[2rem] p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold">Automatic GHL sync log</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Website inquiries are pushed to GHL in the background as soon as the form is submitted.
              </p>
            </div>
            <Link
              href="/dashboard/leads"
              className="button-secondary pressable rounded-full px-4 py-2 text-sm font-semibold"
            >
              Open Leads
            </Link>
          </div>

          {syncEvents.length ? (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-black/8 text-[var(--muted)]">
                  <tr>
                    <th className="py-3 pr-4 font-medium">When</th>
                    <th className="py-3 pr-4 font-medium">Lead</th>
                    <th className="py-3 pr-4 font-medium">Program</th>
                    <th className="py-3 pr-4 font-medium">GHL contact</th>
                    <th className="py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {syncEvents.map((event) => (
                    <tr key={event.id} className="border-b border-black/5 align-top last:border-0">
                      <td className="py-4 pr-4 text-[var(--muted)]">{formatSyncTime(event.createdAt)}</td>
                      <td className="py-4 pr-4">
                        <p className="font-semibold">{event.name}</p>
                        <p className="text-[var(--muted)]">{event.email}</p>
                      </td>
                      <td className="py-4 pr-4">{event.programInterest}</td>
                      <td className="py-4 pr-4">
                        <code>{event.ghlContactId || "—"}</code>
                      </td>
                      <td className="py-4 capitalize">
                        <span
                          className={
                            event.status === "synced"
                              ? "text-emerald-400"
                              : event.status === "skipped"
                                ? "text-amber-200"
                                : "text-red-400"
                          }
                        >
                          {event.status}
                        </span>
                        {event.error ? (
                          <p className="mt-1 max-w-xs text-xs text-[var(--muted)]">{event.error}</p>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-6 text-sm text-[var(--muted)]">
              No website inquiries have been synced yet. Submit the public contact form after connecting
              GHL to confirm the pipeline.
            </p>
          )}
        </section>

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
