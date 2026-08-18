import { getResolvedIntegrationSettings } from "@/lib/integrations-store";
import { isMapsReady } from "@/lib/integrations";

export async function getGoogleMapsConfig() {
  const settings = await getResolvedIntegrationSettings();
  return { embedKey: settings.googleMapsEmbedKey };
}

export async function isGoogleMapsConfigured() {
  return isMapsReady(await getResolvedIntegrationSettings());
}
