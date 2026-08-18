import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AddressMap } from "@/components/maps/address-map";
import { getGoogleMapsConfig, isGoogleMapsConfigured } from "@/lib/maps";
import { getR2Config, isR2Configured } from "@/lib/r2";
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

  const mapsConfig = getGoogleMapsConfig();
  const r2Config = getR2Config();
  const mapsReady = isGoogleMapsConfigured();
  const r2Ready = isR2Configured();

  return (
    <DashboardShell
      role={user.role}
      title="Integrations"
      description="Manage the admin-facing integrations that power maps, media, and operations."
    >
      <div className="grid gap-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="glass-panel rounded-[2rem] p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold">Google Maps</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Powers the admin maps workspace, embedded map previews, and direct address inspection.
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

            <div className="mt-6 grid gap-3 text-sm text-[var(--muted)]">
              <p>
                Env key: <code>NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY</code>
              </p>
              <p>
                Current value:{" "}
                <code>{mapsConfig.embedKey ? "•••••••• configured" : "not set"}</code>
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
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
                  Keeps media, downloadable files, and future uploads outside Render&apos;s ephemeral filesystem.
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

            <div className="mt-6 grid gap-3 text-sm text-[var(--muted)]">
              <p>
                Bucket: <code>{r2Config.bucket || "not set"}</code>
              </p>
              <p>
                Public URL: <code>{r2Config.publicUrl || "not set"}</code>
              </p>
              <p>
                Access key: <code>{r2Config.accessKeyId ? "•••••••• configured" : "not set"}</code>
              </p>
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="glass-panel rounded-[2rem] p-8">
            <p className="text-sm font-semibold">Integration checklist</p>
            <ul className="mt-5 grid gap-3 text-sm text-[var(--muted)]">
              <li>• Add the Google Maps Embed API key for live embedded map previews.</li>
              <li>• Set `R2_BUCKET` and `R2_PUBLIC_URL` before enabling media uploads.</li>
              <li>• Keep Cloudflare R2 as the durable asset layer for production media.</li>
            </ul>
          </section>

          <AddressMap address="Makati City, Metro Manila" />
        </div>
      </div>
    </DashboardShell>
  );
}
