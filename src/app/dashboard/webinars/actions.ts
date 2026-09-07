"use server";

import { revalidatePath } from "next/cache";

import { requireCapability } from "@/lib/session";
import { deleteWebinar, saveWebinar, setFeaturedWebinar } from "@/lib/webinars-store";

export type WebinarFormState = { error?: string; success?: string };

function toIsoDateTime(localValue: string): string | null {
  if (!localValue) return null;
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export async function saveWebinarAction(
  _prevState: WebinarFormState,
  formData: FormData,
): Promise<WebinarFormState> {
  await requireCapability("webinars");

  const id = String(formData.get("id") ?? "").trim() || undefined;
  const title = String(formData.get("title") ?? "").trim();
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim();
  const ctaHref = String(formData.get("ctaHref") ?? "").trim();
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "").trim();
  const episodeNumberRaw = String(formData.get("episodeNumber") ?? "").trim();
  const interestedCountRaw = String(formData.get("interestedCount") ?? "").trim();

  if (!title) {
    return { error: "Give this webinar a title." };
  }
  if (!ctaLabel) {
    return { error: "Give the CTA button a label." };
  }
  if (!ctaHref) {
    return { error: "Give the CTA button a link." };
  }

  const scheduledAt = toIsoDateTime(scheduledAtRaw);
  if (!scheduledAt) {
    return { error: "Pick a valid date and time." };
  }

  const episodeNumber = Number.parseInt(episodeNumberRaw, 10);
  const interestedCount = Number.parseInt(interestedCountRaw, 10);

  try {
    await saveWebinar({
      id,
      episodeNumber: Number.isFinite(episodeNumber) && episodeNumber > 0 ? episodeNumber : 1,
      seasonLabel: String(formData.get("seasonLabel") ?? "").trim() || "Season 1",
      title,
      tagline: String(formData.get("tagline") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      hostName: String(formData.get("hostName") ?? "").trim(),
      hostTitle: String(formData.get("hostTitle") ?? "").trim(),
      scheduledAt,
      thumbnailUrl: String(formData.get("thumbnailUrl") ?? "").trim(),
      ctaLabel,
      ctaHref,
      interestedCount: Number.isFinite(interestedCount) && interestedCount > 0 ? interestedCount : 0,
      isFeatured: formData.get("isFeatured") === "on",
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "I couldn't save that webinar." };
  }

  revalidatePath("/dashboard/webinars");
  revalidatePath("/webinars");
  return { success: id ? "Webinar updated." : "Webinar added." };
}

export async function deleteWebinarAction(
  _prevState: WebinarFormState,
  formData: FormData,
): Promise<WebinarFormState> {
  await requireCapability("webinars");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { error: "Missing webinar." };
  }

  try {
    await deleteWebinar(id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "I couldn't delete that webinar." };
  }

  revalidatePath("/dashboard/webinars");
  revalidatePath("/webinars");
  return { success: "Webinar deleted." };
}

export async function setFeaturedWebinarAction(
  _prevState: WebinarFormState,
  formData: FormData,
): Promise<WebinarFormState> {
  await requireCapability("webinars");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { error: "Missing webinar." };
  }

  try {
    await setFeaturedWebinar(id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "I couldn't update the featured webinar." };
  }

  revalidatePath("/dashboard/webinars");
  revalidatePath("/webinars");
  return { success: "Featured webinar updated." };
}
