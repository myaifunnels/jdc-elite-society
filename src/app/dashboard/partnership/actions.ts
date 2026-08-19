"use server";

import { revalidatePath } from "next/cache";

import { isSafeAssetUrl } from "@/lib/branding";
import { setAffiliateAccess } from "@/lib/auth-store";
import {
  markCyclePaid,
  recordSale,
  savePayoutMethod,
  upsertCampaign,
  upsertMaterial,
  upsertProfile,
  voidSale,
  wouldCreateSponsorCycle,
} from "@/lib/affiliate-store";
import { DEFAULT_COMMISSION_RATE } from "@/lib/pay-cycle";
import { requireAffiliateAccess, requireRoles, requireSessionUser } from "@/lib/session";
import { AffiliateStatus, PayoutMethodKind } from "@/lib/types";

export type PartnershipFormState = {
  error?: string;
  success?: string;
};

function revalidatePartnership() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/partnership");
  revalidatePath("/dashboard/partnership", "layout");
}

export async function grantAffiliateAccess(
  _prev: PartnershipFormState,
  formData: FormData,
): Promise<PartnershipFormState> {
  await requireRoles(["admin"]);
  const userId = String(formData.get("userId") ?? "").trim();
  const sponsorId = String(formData.get("sponsorId") ?? "").trim();
  const rateRaw = Number(formData.get("commissionRate") ?? DEFAULT_COMMISSION_RATE);
  const commissionRate = Number.isFinite(rateRaw) && rateRaw > 0 && rateRaw <= 1 ? rateRaw : DEFAULT_COMMISSION_RATE;

  if (!userId) {
    return { error: "Choose a user to grant access." };
  }

  if (await wouldCreateSponsorCycle(userId, sponsorId)) {
    return { error: "That sponsor would create a loop in the tree." };
  }

  await setAffiliateAccess(userId, true);
  await upsertProfile({
    userId,
    sponsorId,
    status: "active",
    commissionRate,
  });
  revalidatePartnership();
  return { success: "Partnership access granted. They will see Partnership in the sidebar." };
}

export async function updateAffiliateProfile(
  _prev: PartnershipFormState,
  formData: FormData,
): Promise<PartnershipFormState> {
  await requireRoles(["admin"]);
  const userId = String(formData.get("userId") ?? "").trim();
  const sponsorId = String(formData.get("sponsorId") ?? "").trim();
  const status = String(formData.get("status") ?? "active") as AffiliateStatus;
  const rateRaw = Number(formData.get("commissionRate") ?? DEFAULT_COMMISSION_RATE);
  const commissionRate = Number.isFinite(rateRaw) && rateRaw > 0 && rateRaw <= 1 ? rateRaw : DEFAULT_COMMISSION_RATE;
  const regenerateCode = String(formData.get("regenerateCode") ?? "") === "on";
  const revoke = String(formData.get("revoke") ?? "") === "on";

  if (!userId) {
    return { error: "Missing partner." };
  }

  if (await wouldCreateSponsorCycle(userId, sponsorId)) {
    return { error: "That sponsor would create a loop in the tree." };
  }

  if (revoke) {
    await setAffiliateAccess(userId, false);
    await upsertProfile({ userId, sponsorId, status: "paused", commissionRate });
    revalidatePartnership();
    return { success: "Access revoked. They no longer see the Partnership workspace." };
  }

  await setAffiliateAccess(userId, true);
  await upsertProfile({
    userId,
    sponsorId,
    status: status === "paused" || status === "invited" ? status : "active",
    commissionRate,
    regenerateCode,
  });
  revalidatePartnership();
  return { success: "Partner profile updated." };
}

export async function recordAffiliateSale(
  _prev: PartnershipFormState,
  formData: FormData,
): Promise<PartnershipFormState> {
  await requireRoles(["admin"]);
  const affiliateUserId = String(formData.get("affiliateUserId") ?? "").trim();
  const grossAmount = Number(formData.get("grossAmount") ?? 0);
  const source = String(formData.get("source") ?? "").trim();
  const soldAt = String(formData.get("soldAt") ?? "").trim();

  if (!affiliateUserId) {
    return { error: "Choose the affiliate who earned this sale." };
  }
  if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
    return { error: "Enter the gross sale amount." };
  }

  const sale = await recordSale({
    affiliateUserId,
    grossAmount,
    source: source || "Recorded sale",
    soldAt: soldAt || undefined,
  });
  revalidatePartnership();
  return {
    success: `Sale recorded. ${sale.commissionAmount.toFixed(2)} commission is in the ${sale.scheduledPayDate} pay cycle.`,
  };
}

export async function voidAffiliateSale(
  _prev: PartnershipFormState,
  formData: FormData,
): Promise<PartnershipFormState> {
  await requireRoles(["admin"]);
  const id = String(formData.get("saleId") ?? "").trim();
  const sale = await voidSale(id);
  if (!sale) {
    return { error: "That sale cannot be voided." };
  }
  revalidatePartnership();
  return { success: "Sale voided." };
}

export async function markAffiliateCyclePaid(
  _prev: PartnershipFormState,
  formData: FormData,
): Promise<PartnershipFormState> {
  await requireRoles(["admin"]);
  const affiliateUserId = String(formData.get("affiliateUserId") ?? "").trim();
  const scheduledPayDate = String(formData.get("scheduledPayDate") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!affiliateUserId || !scheduledPayDate) {
    return { error: "Missing payout cycle." };
  }
  if (!reference) {
    return { error: "Add a GCash or bank reference before marking paid." };
  }

  const payout = await markCyclePaid({ affiliateUserId, scheduledPayDate, reference, note });
  if (!payout) {
    return { error: "There is nothing unpaid in that cycle." };
  }
  revalidatePartnership();
  return { success: `Marked ₱${payout.amount.toFixed(2)} as paid for ${scheduledPayDate}.` };
}

export async function saveAffiliatePayoutMethod(
  _prev: PartnershipFormState,
  formData: FormData,
): Promise<PartnershipFormState> {
  const user = await requireAffiliateAccess();
  const method = String(formData.get("method") ?? "bank") as PayoutMethodKind;
  const bankName = String(formData.get("bankName") ?? "").trim();
  const accountName = String(formData.get("accountName") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").trim();

  if (!accountName || !accountNumber) {
    return { error: "Account name and number are required." };
  }
  if (method === "bank" && !bankName) {
    return { error: "Enter the bank name." };
  }

  await savePayoutMethod({
    userId: user.id,
    method: method === "gcash" || method === "maya" || method === "other" ? method : "bank",
    bankName,
    accountName,
    accountNumber,
  });
  revalidatePartnership();
  return { success: "Payout details saved. Only you and admins can see the full account number." };
}

export async function saveAffiliateCampaign(
  _prev: PartnershipFormState,
  formData: FormData,
): Promise<PartnershipFormState> {
  await requireRoles(["admin"]);
  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const destinationPath = String(formData.get("destinationPath") ?? "").trim();
  const active = String(formData.get("active") ?? "on") === "on";

  if (!slug || !title || !destinationPath.startsWith("/")) {
    return { error: "Slug, title, and an on-site destination path are required." };
  }

  await upsertCampaign({ slug, title, description, destinationPath, active });
  revalidatePartnership();
  return { success: "Campaign saved." };
}

export async function saveAffiliateMaterial(
  _prev: PartnershipFormState,
  formData: FormData,
): Promise<PartnershipFormState> {
  await requireRoles(["admin"]);
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const fileUrl = String(formData.get("fileUrl") ?? "").trim();
  const fileName = String(formData.get("fileName") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (!title || !fileUrl) {
    return { error: "Title and file URL are required." };
  }
  if (!isSafeAssetUrl(fileUrl) && !fileUrl.startsWith("/")) {
    return { error: "Use an https URL or a path that starts with /." };
  }

  await upsertMaterial({
    title,
    category,
    fileUrl,
    fileName: fileName || title,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  });
  revalidatePartnership();
  return { success: "Material added to the kit." };
}

export async function ensureOwnAffiliateProfile() {
  const user = await requireSessionUser();
  if (user.role !== "admin" && !user.affiliateAccess) {
    return null;
  }
  return upsertProfile({ userId: user.id });
}
