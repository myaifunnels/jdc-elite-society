import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { isR2Ready } from "@/lib/integrations";

export async function getR2Config() {
  const settings = await getResolvedIntegrationSettings();

  return {
    accountId: settings.r2AccountId,
    accessKeyId: settings.r2AccessKeyId,
    secretAccessKey: settings.r2SecretAccessKey,
    bucket: settings.r2Bucket,
    publicUrl: settings.r2PublicUrl,
  };
}

export async function isR2Configured() {
  return isR2Ready(await getResolvedIntegrationSettings());
}
