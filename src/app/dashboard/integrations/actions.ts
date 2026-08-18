"use server";

import { revalidatePath } from "next/cache";

import { testGhlConnection } from "@/lib/ghl";
import { isGhlReady, isHttpsUrl, isMapsReady, isR2Ready } from "@/lib/integrations";
import { getResolvedIntegrationSettings, saveIntegrationSettings } from "@/lib/integrations-store";
import { requireSessionUser } from "@/lib/session";

export type IntegrationFormState = {
  error?: string;
  success?: string;
};

export async function saveGoogleMapsIntegration(
  _prevState: IntegrationFormState,
  formData: FormData,
): Promise<IntegrationFormState> {
  const user = await requireSessionUser();

  if (user.role !== "admin") {
    return { error: "Only admins can update integrations." };
  }

  const googleMapsEmbedKey = String(formData.get("googleMapsEmbedKey") ?? "").trim();
  const resolved = await getResolvedIntegrationSettings();

  if (!googleMapsEmbedKey && !isMapsReady(resolved)) {
    return { error: "Paste a Google Maps Embed API key to save this integration." };
  }

  if (googleMapsEmbedKey) {
    await saveIntegrationSettings({ googleMapsEmbedKey });
  }
  revalidatePath("/dashboard/integrations");
  revalidatePath("/dashboard/maps");
  revalidatePath("/dashboard/leads");
  revalidatePath("/contact");

  return { success: "Google Maps key saved." };
}

export async function saveR2Integration(
  _prevState: IntegrationFormState,
  formData: FormData,
): Promise<IntegrationFormState> {
  const user = await requireSessionUser();

  if (user.role !== "admin") {
    return { error: "Only admins can update integrations." };
  }

  const incoming = {
    r2AccountId: String(formData.get("r2AccountId") ?? "").trim(),
    r2AccessKeyId: String(formData.get("r2AccessKeyId") ?? "").trim(),
    r2SecretAccessKey: String(formData.get("r2SecretAccessKey") ?? "").trim(),
    r2Bucket: String(formData.get("r2Bucket") ?? "").trim(),
    r2PublicUrl: String(formData.get("r2PublicUrl") ?? "").trim(),
  };
  const current = await getResolvedIntegrationSettings();
  const preview = {
    ...current,
    r2AccountId: incoming.r2AccountId || current.r2AccountId,
    r2AccessKeyId: incoming.r2AccessKeyId || current.r2AccessKeyId,
    r2SecretAccessKey: incoming.r2SecretAccessKey || current.r2SecretAccessKey,
    r2Bucket: incoming.r2Bucket || current.r2Bucket,
    r2PublicUrl: incoming.r2PublicUrl || current.r2PublicUrl,
  };

  if (!isR2Ready(preview)) {
    return { error: "Fill every Cloudflare R2 field the first time you connect this integration." };
  }

  await saveIntegrationSettings(incoming);
  revalidatePath("/dashboard/integrations");
  revalidatePath("/dashboard/settings");

  return { success: "Cloudflare R2 credentials saved." };
}

export async function saveGhlIntegration(
  _prevState: IntegrationFormState,
  formData: FormData,
): Promise<IntegrationFormState> {
  const user = await requireSessionUser();

  if (user.role !== "admin") {
    return { error: "Only admins can update integrations." };
  }

  const incomingToken = String(formData.get("ghlPrivateToken") ?? "").trim();
  const incomingLocationId = String(formData.get("ghlLocationId") ?? "").trim();
  const incomingWebhookUrl = String(formData.get("ghlWebhookUrl") ?? "").trim();
  const incomingTags = String(formData.get("ghlTags") ?? "").trim();
  const autoSync = formData.get("ghlAutoSync") === "on";
  const current = await getResolvedIntegrationSettings();
  const nextToken = incomingToken || current.ghlPrivateToken;
  const nextLocationId = incomingLocationId || current.ghlLocationId;

  if (incomingWebhookUrl && !isHttpsUrl(incomingWebhookUrl)) {
    return { error: "The optional GHL webhook URL must start with https://." };
  }

  const preview = {
    ...current,
    ghlPrivateToken: nextToken,
    ghlLocationId: nextLocationId,
    ghlWebhookUrl: incomingWebhookUrl,
    ghlAutoSync: autoSync,
    ghlTags: incomingTags || current.ghlTags,
  };

  if (!isGhlReady(preview)) {
    return {
      error:
        "Paste the JDC Elite Society Location ID plus a Private Integration token, or an inbound webhook URL.",
    };
  }

  let locationName = current.ghlLocationName;
  const credentialsChanged = Boolean(incomingToken || incomingLocationId) || !locationName;

  if (nextToken && nextLocationId && credentialsChanged) {
    const test = await testGhlConnection(nextToken, nextLocationId);
    if (!test.ok) {
      return {
        error: test.error || "Could not connect to that GoHighLevel subaccount.",
      };
    }
    locationName = test.locationName || "JDC Elite Society";
  }

  await saveIntegrationSettings({
    ghlPrivateToken: nextToken,
    ghlLocationId: nextLocationId,
    ghlLocationName: locationName,
    ghlWebhookUrl: incomingWebhookUrl,
    ghlAutoSync: autoSync,
    ghlTags: incomingTags,
    ghlLastError: "",
  });
  revalidatePath("/dashboard/integrations");
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/settings");

  const destination = locationName || "the JDC Elite Society subaccount";
  return {
    success: autoSync
      ? `Connected to ${destination}. New website form submissions will sync automatically.`
      : `Saved ${destination}. Turn automatic sync back on to push new inquiries.`,
  };
}
