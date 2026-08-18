"use server";

import { revalidatePath } from "next/cache";

import { isSafeAssetUrl, resolveLogoHref } from "@/lib/branding";
import { saveBrandingSettings } from "@/lib/branding-store";
import { requireSessionUser } from "@/lib/session";

export type BrandingFormState = {
  error?: string;
  success?: string;
};

export async function saveLogoSettings(
  _prevState: BrandingFormState,
  formData: FormData,
): Promise<BrandingFormState> {
  const user = await requireSessionUser();

  if (user.role !== "admin") {
    return { error: "Only admins can update the site logo." };
  }

  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const logoHref = resolveLogoHref(String(formData.get("logoHref") ?? "").trim() || "/", logoUrl);
  const logoAlt = String(formData.get("logoAlt") ?? "").trim();

  if (logoUrl && !isSafeAssetUrl(logoUrl)) {
    return { error: "Use an https image URL or a path that starts with /." };
  }

  if (logoAlt.length > 120) {
    return { error: "Keep the logo alt text under 120 characters." };
  }

  await saveBrandingSettings({ logoUrl, logoHref, logoAlt });
  revalidatePath("/", "layout");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/settings");

  return { success: logoUrl ? "Logo saved. The public mark links to the homepage." : "Logo removed. The text mark will be used instead." };
}
