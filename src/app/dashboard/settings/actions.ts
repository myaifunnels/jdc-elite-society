"use server";

import { revalidatePath } from "next/cache";

import { isSafeAssetUrl, isSafeHref } from "@/lib/branding";
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
  const logoHref = String(formData.get("logoHref") ?? "").trim() || "/";
  const logoAlt = String(formData.get("logoAlt") ?? "").trim();

  if (logoUrl && !isSafeAssetUrl(logoUrl)) {
    return { error: "Use an https image URL or a path that starts with /." };
  }

  if (!isSafeHref(logoHref)) {
    return { error: "The logo link must be a site path like / or an https URL." };
  }

  if (logoAlt.length > 120) {
    return { error: "Keep the logo alt text under 120 characters." };
  }

  await saveBrandingSettings({ logoUrl, logoHref, logoAlt });
  revalidatePath("/", "layout");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/settings");

  return { success: logoUrl ? "Logo link saved." : "Logo removed. The text mark will be used instead." };
}
