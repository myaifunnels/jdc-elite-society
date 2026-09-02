import Link from "next/link";
import type { ComponentType } from "react";

import {
  GhlIntegrationForm,
  GoogleMapsIntegrationForm,
  R2IntegrationForm,
  TextBeeIntegrationForm,
} from "@/components/dashboard/integration-forms";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  CloudflareLogo,
  GoHighLevelLogo,
  GoogleMapsLogo,
  TextBeeLogo,
} from "@/components/dashboard/integration-logos";
import { MigrateFilesToR2Button } from "@/components/dashboard/migrate-files-button";
import { AddressMap } from "@/components/maps/address-map";
import { isGhlReady, isMapsReady, isR2Ready, isTextBeeReady, maskSecret } from "@/lib/integrations";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { requireCapability } from "@/lib/session";
import { siteUrl } from "@/lib/site";

type AppId = "maps" | "r2" | "ghl" | "textbee";

type AppEntry = {
  id: AppId;
  name: string;
  tagline: string;
  logo: ComponentType<{ size?: number }>;
  connected: boolean;
};

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>;
}) {
  await requireCapability("integrations");
  const requested = (await searchParams).app;

  const settings = await getResolvedIntegrationSettings();
  const mapsReady = isMapsReady(settings);
  const r2Ready = isR2Ready(settings);
  const ghlReady = isGhlReady(settings);
  const textbeeReady = isTextBeeReady(settings);

  const apps: AppEntry[] = [
    {
      id: "maps",
      name: "Google Maps",
      tagline: "Live map previews on contact dashboards.",
      logo: GoogleMapsLogo,
      connected: mapsReady,
    },
    {
      id: "r2",
      name: "Cloudflare R2",
      tagline: "Stores profile photos and payment receipts.",
      logo: CloudflareLogo,
      connected: r2Ready,
    },
    {
      id: "ghl",
      name: "GoHighLevel",
      tagline: "Syncs contacts, tags, pipeline stages, and course access.",
      logo: GoHighLevelLogo,
      connected: ghlReady,
    },
    {
      id: "textbee",
      name: "TextBee",
      tagline: "SMS gateway for buyer and team alerts.",
      logo: TextBeeLogo,
      connected: textbeeReady,
    },
  ];

  const active = apps.find((app) => app.id === requested) ?? null;

  if (!active) {
    return (
      <DashboardShell
        title="Integrations"
        description="Connect the services JDC Elite Society runs on. Tap an app to configure it."
      >
        <div className="app-store-grid">
          {apps.map((app) => {
            const Logo = app.logo;
            return (
              <Link key={app.id} href={`/dashboard/integrations?app=${app.id}`} className="app-store-card">
                <span className="app-store-icon">
                  <Logo size={48} />
                </span>
                <span className="app-store-copy">
                  <strong>{app.name}</strong>
                  <small>{app.tagline}</small>
                </span>
                <span className={app.connected ? "status-pill is-verified" : "status-pill is-quiet"}>
                  {app.connected ? "Connected" : "Not connected"}
                </span>
              </Link>
            );
          })}
        </div>
      </DashboardShell>
    );
  }

  const ActiveLogo = active.logo;

  return (
    <DashboardShell
      title="Integrations"
      description="Connect the services JDC Elite Society runs on. Tap an app to configure it."
    >
      <Link href="/dashboard/integrations" className="app-store-back">
        ← All integrations
      </Link>

      <div className="app-store-detail">
        <header className="app-store-detail-head">
          <span className="app-store-icon is-lg">
            <ActiveLogo size={64} />
          </span>
          <div>
            <h2>{active.name}</h2>
            <p>{active.tagline}</p>
          </div>
          <span className={active.connected ? "status-pill is-verified" : "status-pill is-quiet"}>
            {active.connected ? "Connected" : "Not connected"}
          </span>
        </header>

        {active.id === "maps" ? (
          <>
            <p className="app-store-detail-meta">
              Current key: <code>{maskSecret(settings.googleMapsEmbedKey)}</code>
            </p>
            <GoogleMapsIntegrationForm configured={mapsReady} />
            <details className="dashboard-disclosure" style={{ marginTop: "1.5rem" }}>
              <summary>Preview map</summary>
              <div className="dashboard-disclosure-body">
                <AddressMap address="Makati City, Metro Manila" embedKey={settings.googleMapsEmbedKey} />
              </div>
            </details>
          </>
        ) : null}

        {active.id === "r2" ? (
          <>
            <p className="app-store-detail-meta">
              Bucket: <code>{settings.r2Bucket || "not set"}</code> · Public URL:{" "}
              <code>{settings.r2PublicUrl || "not set"}</code> · Access key: <code>{maskSecret(settings.r2AccessKeyId)}</code>
            </p>
            <R2IntegrationForm
              accountId={settings.r2AccountId}
              bucket={settings.r2Bucket}
              publicUrl={settings.r2PublicUrl}
              accessKeyConfigured={Boolean(settings.r2AccessKeyId)}
            />
            <p className="app-store-detail-meta" style={{ marginTop: "0.75rem" }}>
              The dashboard loads photos and receipts through a signed R2 request, so the bucket can stay private.
              Public URL is still used when emailing a receipt link.
            </p>
            {r2Ready ? (
              <div className="mt-6 border-t border-[var(--line)] pt-6">
                <p className="text-sm font-semibold">Migrate existing files</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Photos and receipts uploaded before R2 was connected are stored directly in the database. Move
                  them to R2 now — safe to run more than once.
                </p>
                <MigrateFilesToR2Button />
              </div>
            ) : null}
          </>
        ) : null}

        {active.id === "ghl" ? (
          <>
            <p className="app-store-detail-meta">
              Location: <code>{settings.ghlLocationId || "not set"}</code>
            </p>
            <GhlIntegrationForm configured={ghlReady} locationId={settings.ghlLocationId} />
            <p className="app-store-detail-meta" style={{ marginTop: "1rem" }}>
              Pipeline mirror webhook: <code>{siteUrl}/api/ghl/webhook</code>
              <br />
              In GHL, add this URL for Contact Tag Update, Contact Update, and Opportunity Stage Update so the Contacts pipeline stays in sync. Only the <code>jdc-mastermind-buyer</code> pipeline is mirrored.
            </p>
          </>
        ) : null}

        {active.id === "textbee" ? (
          <>
            <p className="app-store-detail-meta">
              Device: <code>{settings.textbeeDeviceId || "not set"}</code>
            </p>
            <TextBeeIntegrationForm configured={textbeeReady} deviceId={settings.textbeeDeviceId} />
          </>
        ) : null}
      </div>
    </DashboardShell>
  );
}
