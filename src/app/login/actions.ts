"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AFFILIATE_CAMPAIGN_COOKIE, AFFILIATE_COOKIE, normalizeAffiliateCode } from "@/lib/affiliate";
import { getProfileByCode, recordAttribution } from "@/lib/affiliate-store";
import { existingAccountLoginPath, isTemporaryMemberPassword } from "@/lib/auth-constants";
import {
  authenticateUser,
  completeMemberProfile,
  createUser,
  ensureSeedUsers,
  findUserByEmailOrPhone,
  issueTemporaryPassword,
  requestPasswordReset,
  resetPasswordWithToken,
  setMemberPaymentVerified,
  setUserPassword,
} from "@/lib/auth-store";
import { storeProfilePhoto } from "@/lib/r2-upload";
import { formatInternationalPhone } from "@/lib/countries";
import { invalidateRegistrantCrmSync, upsertContactFromAccount } from "@/lib/crm-store";
import { syncContactToGhl } from "@/lib/ghl";
import { approveEliteCheckoutOrdersForUser } from "@/lib/elite-checkout-store";
import { requireCapability, requireSessionUser, sessionCookieName, impersonatorCookieName } from "@/lib/session";
import {
  completeProfileSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  resolveAudienceLabel,
} from "@/lib/validations";

export type RegisterDraft = {
  name: string;
  email: string;
  phoneCountry: string;
  phoneNational: string;
  company: string;
};

export type AuthFormState = {
  error?: string;
  success?: string;
  fields?: RegisterDraft;
  formKey?: string;
};

function readRegisterDraft(formData: FormData): RegisterDraft {
  return {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phoneCountry: String(formData.get("phoneCountry") ?? "PH").trim().toUpperCase() || "PH",
    phoneNational: String(formData.get("phoneNational") ?? ""),
    company: String(formData.get("company") ?? ""),
  };
}

function registerError(error: string, formData: FormData): AuthFormState {
  return {
    error,
    fields: readRegisterDraft(formData),
    formKey: String(Date.now()),
  };
}

async function setSessionCookie(userId: string, remember = true) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: remember ? 60 * 60 * 24 * 30 : undefined,
  });
}

export async function registerAccount(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: formatInternationalPhone(
      String(formData.get("phoneCountry") ?? "PH"),
      String(formData.get("phoneNational") ?? ""),
    ),
    phoneCountry: String(formData.get("phoneCountry") ?? "PH").trim().toUpperCase(),
    company: String(formData.get("company") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return registerError(firstError || "Check the registration details and try again.", formData);
  }

  await ensureSeedUsers();
  const existing = await findUserByEmailOrPhone(parsed.data.email, parsed.data.phone);
  if (existing) {
    if (existing.role !== "admin" && existing.role !== "partner") {
      await issueTemporaryPassword(existing.id);
    }
    redirect(existingAccountLoginPath(existing.email));
  }

  try {
    const user = await createUser({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      role: "member",
      phone: parsed.data.phone,
      phoneCountry: parsed.data.phoneCountry,
      company: parsed.data.company,
      profileComplete: false,
      paymentVerified: false,
      passwordSet: true,
    });
    await setSessionCookie(user.id, true);
    const cookieStore = await cookies();
    const referralCode = normalizeAffiliateCode(cookieStore.get(AFFILIATE_COOKIE)?.value ?? "");
    const campaignSlug = normalizeAffiliateCode(cookieStore.get(AFFILIATE_CAMPAIGN_COOKIE)?.value ?? "");
    const affiliate = referralCode ? await getProfileByCode(referralCode) : null;
    const extraTags = affiliate ? [`affiliate:${affiliate.code}`, campaignSlug ? `campaign:${campaignSlug}` : ""].filter(Boolean) : [];
    if (affiliate) {
      await recordAttribution({
        kind: "registration",
        code: affiliate.code,
        campaignSlug,
        email: parsed.data.email,
        name: parsed.data.name,
        userId: user.id,
      });
    }
    await syncContactToGhl({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      company: parsed.data.company,
      source: affiliate ? `Website registration · ${affiliate.code}` : "Website registration",
      tags: ["Registration", "Pending verification", ...extraTags],
    });
  } catch (error) {
    return registerError(
      error instanceof Error ? error.message : "I couldn't create this account just now.",
      formData,
    );
  }

  redirect("/dashboard?welcome=1");
}

export async function loginAccount(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Check your email and password." };
  }

  const user = await authenticateUser(parsed.data.email, parsed.data.password);

  if (!user) {
    return { error: "That email and password do not match. If you can't sign in, register first." };
  }

  await setSessionCookie(user.id, String(formData.get("remember") ?? "") === "on");
  if (!user.passwordSet || isTemporaryMemberPassword(parsed.data.password)) {
    redirect("/account/password");
  }
  redirect("/dashboard?welcome=1");
}

export async function completeAccountProfile(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const user = await requireSessionUser();
  const parsed = completeProfileSchema.safeParse({
    memberships: formData.getAll("memberships").map(String),
    bestDescribesYou: String(formData.get("bestDescribesYou") ?? ""),
    bestDescribesYouOther: String(formData.get("bestDescribesYouOther") ?? "").trim(),
    dateOfBirth: String(formData.get("dateOfBirth") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    facebookProfileUrl: String(formData.get("facebookProfileUrl") ?? "").trim(),
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Check your profile details and try again." };
  }

  try {
    const photo = formData.get("profilePhoto");
    const photoUrl =
      photo instanceof File && photo.size > 0
        ? await storeProfilePhoto(photo, user.id)
        : user.facebookPhotoUrl;

    if (!photoUrl) {
      return { error: "Upload your profile picture." };
    }

    const audience = resolveAudienceLabel(parsed.data.bestDescribesYou, parsed.data.bestDescribesYouOther);
    await completeMemberProfile(user.id, {
      memberships: parsed.data.memberships,
      bestDescribesYou: audience,
      dateOfBirth: parsed.data.dateOfBirth,
      address: parsed.data.address,
      facebookProfileUrl: parsed.data.facebookProfileUrl,
      facebookPhotoUrl: photoUrl,
    });
    const lat = Number(formData.get("addressLat"));
    const lng = Number(formData.get("addressLng"));
    await upsertContactFromAccount({
      email: user.email,
      name: user.name,
      phone: user.phone,
      address: parsed.data.address,
      photoUrl,
      bestDescribesYou: audience,
      programInterest: user.company,
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
      source: "Account profile",
      tags: [
        "Profile complete",
        ...parsed.data.memberships.map((item) => (item === "jes" ? "JES Member" : "Spartans")),
      ],
    });
    await syncContactToGhl({
      name: user.name,
      email: user.email,
      phone: user.phone,
      company: user.company,
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
      error: error instanceof Error ? error.message : "I couldn't save your profile just now.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/contacts");
  redirect("/dashboard");
}

export async function verifyMemberPayment(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { user: reviewer } = await requireCapability("registrations");
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return { error: "Missing member." };
  }

  try {
    await setMemberPaymentVerified(userId, true);
    await approveEliteCheckoutOrdersForUser(userId, reviewer.id);
    invalidateRegistrantCrmSync();
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "I couldn't verify this registration.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/registrations");
  revalidatePath("/dashboard/contacts");
  revalidatePath("/dashboard/payments");
  return { success: "Payment verified." };
}

export async function requestPasswordResetAccount(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Enter the email on the account." };
  }

  try {
    await requestPasswordReset(parsed.data.email);
  } catch (error) {
    console.error("Password reset request failed", error);
  }

  return {
    success: "If that email is on an account, we sent a reset link. Check your inbox and spam folder.",
  };
}

export async function resetPasswordAccount(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: String(formData.get("token") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Check the new password and try again." };
  }

  const updated = await resetPasswordWithToken(parsed.data.token, parsed.data.password);

  if (!updated) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  redirect("/login");
}

export async function changeSignedInPassword(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const user = await requireSessionUser();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    return { error: "Use a new password with at least 8 characters." };
  }

  if (password !== confirmation) {
    return { error: "The new password and confirmation password must match." };
  }

  if (isTemporaryMemberPassword(password)) {
    return { error: "Choose a new password. Do not reuse JDCELITESOCIETY." };
  }

  await setUserPassword(user.id, password);
  redirect("/dashboard?welcome=1");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
  cookieStore.delete(impersonatorCookieName);
  redirect("/");
}
