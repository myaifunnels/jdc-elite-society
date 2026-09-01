"use server";

import { revalidatePath } from "next/cache";

import { AuthFormState } from "@/app/login/actions";
import { updateOwnAccount } from "@/lib/auth-store";
import { formatInternationalPhone } from "@/lib/countries";
import { upsertContactFromAccount } from "@/lib/crm-store";
import { syncContactToGhl } from "@/lib/ghl";
import { storeProfilePhoto } from "@/lib/r2-upload";
import { requireSessionUser } from "@/lib/session";
import { accountProfileSchema, resolveAudienceLabel } from "@/lib/validations";

export async function updateOwnAccountProfile(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const user = await requireSessionUser();
  const parsed = accountProfileSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    company: String(formData.get("company") ?? "").trim(),
    phone: formatInternationalPhone(
      String(formData.get("phoneCountry") ?? user.phoneCountry ?? "PH"),
      String(formData.get("phoneNational") ?? ""),
    ),
    phoneCountry: String(formData.get("phoneCountry") ?? user.phoneCountry ?? "PH")
      .trim()
      .toUpperCase(),
    memberships: formData.getAll("memberships").map(String),
    bestDescribesYou: String(formData.get("bestDescribesYou") ?? ""),
    bestDescribesYouOther: String(formData.get("bestDescribesYouOther") ?? "").trim(),
    dateOfBirth: String(formData.get("dateOfBirth") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    facebookProfileUrl: String(formData.get("facebookProfileUrl") ?? "").trim(),
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    requireMembership: user.role !== "contact",
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Check your account details and try again." };
  }

  try {
    const photo = formData.get("profilePhoto");
    const photoUrl =
      photo instanceof File && photo.size > 0
        ? await storeProfilePhoto(photo, user.id)
        : user.facebookPhotoUrl;

    if (!photoUrl) {
      return { error: "Upload a profile picture." };
    }

    const audience = resolveAudienceLabel(parsed.data.bestDescribesYou, parsed.data.bestDescribesYouOther);
    await updateOwnAccount(user.id, {
      name: parsed.data.name,
      phone: parsed.data.phone,
      phoneCountry: parsed.data.phoneCountry,
      company: parsed.data.company,
      memberships: parsed.data.memberships,
      bestDescribesYou: audience,
      dateOfBirth: parsed.data.dateOfBirth,
      address: parsed.data.address,
      facebookProfileUrl: parsed.data.facebookProfileUrl,
      facebookPhotoUrl: photoUrl,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword || undefined,
    });

    const lat = Number(formData.get("addressLat"));
    const lng = Number(formData.get("addressLng"));
    await upsertContactFromAccount({
      email: user.email,
      name: parsed.data.name,
      phone: parsed.data.phone,
      address: parsed.data.address,
      photoUrl,
      bestDescribesYou: audience,
      programInterest: parsed.data.company,
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
      source: "Account profile",
      tags: ["Profile complete"],
    });

    await syncContactToGhl({
      name: parsed.data.name,
      email: user.email,
      phone: parsed.data.phone,
      company: parsed.data.company,
      dateOfBirth: parsed.data.dateOfBirth,
      address: parsed.data.address,
      bestDescribesYou: audience,
      facebookProfileUrl: parsed.data.facebookProfileUrl,
      facebookPhotoUrl: photoUrl,
      source: "Account profile",
      tags: [
        "Profile complete",
        ...parsed.data.memberships.map((item) => (item === "jes" ? "JES Member" : "Spartans")),
      ],
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "I couldn't save your account just now.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/contacts");
  return { success: "Your account is saved." };
}
