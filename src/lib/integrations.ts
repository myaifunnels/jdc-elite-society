export type IntegrationSettings = {
  googleMapsEmbedKey: string;
  r2AccountId: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2Bucket: string;
  r2PublicUrl: string;
};

export const emptyIntegrationSettings: IntegrationSettings = {
  googleMapsEmbedKey: "",
  r2AccountId: "",
  r2AccessKeyId: "",
  r2SecretAccessKey: "",
  r2Bucket: "",
  r2PublicUrl: "",
};

export function envIntegrationSettings(): IntegrationSettings {
  return {
    googleMapsEmbedKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY ?? "",
    r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    r2Bucket: process.env.R2_BUCKET ?? "",
    r2PublicUrl: process.env.R2_PUBLIC_URL ?? "",
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

export function maskSecret(value: string) {
  return value ? "•••••••• configured" : "not set";
}
