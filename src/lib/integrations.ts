export type IntegrationSettings = {
  googleMapsEmbedKey: string;
  r2AccountId: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2Bucket: string;
  r2PublicUrl: string;
  ghlPrivateToken: string;
  ghlLocationId: string;
  ghlLocationName: string;
  ghlAutoSync: boolean;
  ghlTags: string;
  ghlWebhookUrl: string;
  ghlLastSyncedAt: string;
  ghlLastError: string;
};

export type GhlSyncEvent = {
  id: string;
  leadId: string;
  name: string;
  email: string;
  phone: string;
  programInterest: string;
  ghlContactId: string;
  status: "synced" | "failed" | "skipped";
  error: string;
  createdAt: string;
};

export const emptyIntegrationSettings: IntegrationSettings = {
  googleMapsEmbedKey: "",
  r2AccountId: "",
  r2AccessKeyId: "",
  r2SecretAccessKey: "",
  r2Bucket: "",
  r2PublicUrl: "",
  ghlPrivateToken: "",
  ghlLocationId: "",
  ghlLocationName: "",
  ghlAutoSync: true,
  ghlTags: "Website, JDC Elite Society",
  ghlWebhookUrl: "",
  ghlLastSyncedAt: "",
  ghlLastError: "",
};

function envFlag(value: string | undefined, fallback: boolean) {
  if (value == null || value === "") {
    return fallback;
  }

  return !["0", "false", "off", "no"].includes(value.toLowerCase());
}

export function envIntegrationSettings(): IntegrationSettings {
  return {
    googleMapsEmbedKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY ?? "",
    r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    r2Bucket: process.env.R2_BUCKET ?? "",
    r2PublicUrl: process.env.R2_PUBLIC_URL ?? "",
    ghlPrivateToken: process.env.GHL_PRIVATE_TOKEN ?? process.env.GHL_API_KEY ?? "",
    ghlLocationId: process.env.GHL_LOCATION_ID ?? "",
    ghlLocationName: process.env.GHL_LOCATION_NAME ?? "",
    ghlAutoSync: envFlag(process.env.GHL_AUTO_SYNC, true),
    ghlTags: process.env.GHL_TAGS ?? emptyIntegrationSettings.ghlTags,
    ghlWebhookUrl: process.env.GHL_WEBHOOK_URL ?? "",
    ghlLastSyncedAt: "",
    ghlLastError: "",
  };
}

export function mergeIntegrationSettings(
  saved: Partial<IntegrationSettings> | null,
  env = envIntegrationSettings(),
): IntegrationSettings {
  return {
    googleMapsEmbedKey: saved?.googleMapsEmbedKey || env.googleMapsEmbedKey,
    r2AccountId: saved?.r2AccountId || env.r2AccountId,
    r2AccessKeyId: saved?.r2AccessKeyId || env.r2AccessKeyId,
    r2SecretAccessKey: saved?.r2SecretAccessKey || env.r2SecretAccessKey,
    r2Bucket: saved?.r2Bucket || env.r2Bucket,
    r2PublicUrl: saved?.r2PublicUrl || env.r2PublicUrl,
    ghlPrivateToken: saved?.ghlPrivateToken || env.ghlPrivateToken,
    ghlLocationId: saved?.ghlLocationId || env.ghlLocationId,
    ghlLocationName: saved?.ghlLocationName || env.ghlLocationName,
    ghlAutoSync: saved?.ghlAutoSync ?? env.ghlAutoSync,
    ghlTags: saved?.ghlTags || env.ghlTags,
    ghlWebhookUrl: saved?.ghlWebhookUrl || env.ghlWebhookUrl,
    ghlLastSyncedAt: saved?.ghlLastSyncedAt || "",
    ghlLastError: saved?.ghlLastError || "",
  };
}

export function isMapsReady(settings: IntegrationSettings) {
  return Boolean(settings.googleMapsEmbedKey);
}

export function isR2Ready(settings: IntegrationSettings) {
  return Boolean(
    settings.r2AccountId &&
      settings.r2AccessKeyId &&
      settings.r2SecretAccessKey &&
      settings.r2Bucket &&
      settings.r2PublicUrl,
  );
}

export function isGhlApiReady(settings: IntegrationSettings) {
  return Boolean(settings.ghlPrivateToken && settings.ghlLocationId);
}

export function isGhlReady(settings: IntegrationSettings) {
  return isGhlApiReady(settings) || Boolean(settings.ghlWebhookUrl);
}

export function isGhlAutoSyncReady(settings: IntegrationSettings) {
  return settings.ghlAutoSync && isGhlReady(settings);
}

export function maskSecret(value: string) {
  return value ? "•••••••• configured" : "not set";
}

export function isHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}
