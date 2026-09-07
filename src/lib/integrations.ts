export type IntegrationSettings = {
  googleMapsEmbedKey: string;
  googleClientId: string;
  googleClientSecret: string;
  facebookAppId: string;
  facebookAppSecret: string;
  r2AccountId: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2Bucket: string;
  r2PublicUrl: string;
  ghlApiKey: string;
  ghlLocationId: string;
  textbeeApiKey: string;
  textbeeDeviceId: string;
  smsFromNumber: string;
  emailFromAddress: string;
};

export const emptyIntegrationSettings: IntegrationSettings = {
  googleMapsEmbedKey: "",
  googleClientId: "",
  googleClientSecret: "",
  facebookAppId: "",
  facebookAppSecret: "",
  r2AccountId: "",
  r2AccessKeyId: "",
  r2SecretAccessKey: "",
  r2Bucket: "",
  r2PublicUrl: "",
  ghlApiKey: "",
  ghlLocationId: "",
  textbeeApiKey: "",
  textbeeDeviceId: "",
  smsFromNumber: "",
  emailFromAddress: "",
};

export function envIntegrationSettings(): IntegrationSettings {
  return {
    googleMapsEmbedKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY ?? "",
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    facebookAppId: process.env.FACEBOOK_APP_ID ?? "",
    facebookAppSecret: process.env.FACEBOOK_APP_SECRET ?? "",
    r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    r2Bucket: process.env.R2_BUCKET ?? "",
    r2PublicUrl: process.env.R2_PUBLIC_URL ?? "",
    ghlApiKey: process.env.GHL_API_KEY ?? "",
    ghlLocationId: process.env.GHL_LOCATION_ID ?? "",
    textbeeApiKey: process.env.TEXTBEE_API_KEY ?? "",
    textbeeDeviceId: process.env.TEXTBEE_DEVICE_ID ?? "",
    smsFromNumber: process.env.TWILIO_FROM ?? "",
    emailFromAddress: process.env.MAIL_FROM || process.env.RESEND_FROM || "",
  };
}

export function mergeIntegrationSettings(
  saved: Partial<IntegrationSettings> | null,
  env = envIntegrationSettings(),
): IntegrationSettings {
  return {
    googleMapsEmbedKey: saved?.googleMapsEmbedKey || env.googleMapsEmbedKey,
    googleClientId: saved?.googleClientId || env.googleClientId,
    googleClientSecret: saved?.googleClientSecret || env.googleClientSecret,
    facebookAppId: saved?.facebookAppId || env.facebookAppId,
    facebookAppSecret: saved?.facebookAppSecret || env.facebookAppSecret,
    r2AccountId: saved?.r2AccountId || env.r2AccountId,
    r2AccessKeyId: saved?.r2AccessKeyId || env.r2AccessKeyId,
    r2SecretAccessKey: saved?.r2SecretAccessKey || env.r2SecretAccessKey,
    r2Bucket: saved?.r2Bucket || env.r2Bucket,
    r2PublicUrl: saved?.r2PublicUrl || env.r2PublicUrl,
    ghlApiKey: saved?.ghlApiKey || env.ghlApiKey,
    ghlLocationId: saved?.ghlLocationId || env.ghlLocationId,
    textbeeApiKey: saved?.textbeeApiKey || env.textbeeApiKey,
    textbeeDeviceId: saved?.textbeeDeviceId || env.textbeeDeviceId,
    smsFromNumber: saved?.smsFromNumber || env.smsFromNumber,
    emailFromAddress: saved?.emailFromAddress || env.emailFromAddress,
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

export function isGoogleAuthReady(settings: IntegrationSettings) {
  return Boolean(settings.googleClientId && settings.googleClientSecret);
}

export function isFacebookAuthReady(settings: IntegrationSettings) {
  return Boolean(settings.facebookAppId && settings.facebookAppSecret);
}

export function isGhlReady(settings: IntegrationSettings) {
  return Boolean(settings.ghlApiKey && settings.ghlLocationId);
}

export function isTextBeeReady(settings: IntegrationSettings) {
  return Boolean(settings.textbeeApiKey && settings.textbeeDeviceId);
}

export function maskSecret(value: string) {
  return value ? "•••••••• configured" : "not set";
}
