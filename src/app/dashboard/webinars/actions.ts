"use server";

import { revalidatePath } from "next/cache";

import { requireCapability } from "@/lib/session";
import { deleteWebinar, saveWebinar, setFeaturedWebinar } from "@/lib/webinars-store";
import { updateRegistrantStatus } from "@/lib/webinar-registrants-store";

export type WebinarFormState = { error?: string; success?: string };

const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

/** The <input type="datetime-local"> value ("2026-09-18T19:30") has no timezone attached, so
 * `new Date(localValue)` used to parse it in whatever timezone this Node process happens to run
 * in — UTC on Render — not the Asia/Manila time every public-facing date/time on this site is
 * displayed in. An admin typing "7:30 PM" meaning Manila time ended up with a value stored 8
 * hours off (shown publicly as 3:30 AM the next day). Parse the pieces by hand and apply the
 * fixed Manila offset explicitly (Manila has no DST, so a fixed +8:00 is always correct). */
function toIsoDateTime(localValue: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(localValue);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - MANILA_OFFSET_MS;
  const date = new Date(utcMs);
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
  const totalSeatsRaw = String(formData.get("totalSeats") ?? "").trim();

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
  const totalSeats = Number.parseInt(totalSeatsRaw, 10);

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
      zoomLink: String(formData.get("zoomLink") ?? "").trim(),
      interestedCount: Number.isFinite(interestedCount) && interestedCount > 0 ? interestedCount : 0,
      isFeatured: formData.get("isFeatured") === "on",
      totalSeats: Number.isFinite(totalSeats) && totalSeats >= 0 ? totalSeats : 100,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "I couldn't save that webinar." };
  }

  revalidatePath("/dashboard/webinars");
  revalidatePath("/dashboard/my-webinars");
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

export async function approveOverflowRegistrantAction(
  _prevState: WebinarFormState,
  formData: FormData,
): Promise<WebinarFormState> {
  await requireCapability("webinars");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing registrant." };

  try {
    await updateRegistrantStatus(id, "confirmed");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "I couldn't approve that registration." };
  }

  revalidatePath("/dashboard/webinars");
  revalidatePath("/webinars");
  return { success: "Overflow seat approved." };
}

export async function rejectOverflowRegistrantAction(
  _prevState: WebinarFormState,
  formData: FormData,
): Promise<WebinarFormState> {
  await requireCapability("webinars");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing registrant." };

  try {
    await updateRegistrantStatus(id, "rejected");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "I couldn't reject that registration." };
  }

  revalidatePath("/dashboard/webinars");
  revalidatePath("/webinars");
  return { success: "Registration rejected." };
}
