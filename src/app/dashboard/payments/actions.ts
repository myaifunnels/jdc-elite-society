"use server";

import { revalidatePath } from "next/cache";

import { setMemberPaymentVerified } from "@/lib/auth-store";
import { approveEliteCheckoutOrder, getEliteCheckoutOrder, rejectEliteCheckoutOrder } from "@/lib/elite-checkout-store";
import { invalidateRegistrantCrmSync } from "@/lib/crm-store";
import { addGhlContactTags, lookupGhlContact, removeGhlContactTags } from "@/lib/ghl";
import { grantCommunityAndMastermindAccess } from "@/lib/ghl-community";
import { notifyPaymentApproved, notifyPaymentRejected } from "@/lib/notify";
import { requireCapability } from "@/lib/session";
import { COURSE_ACCESS_TAGS, PAYMENT_REJECTED_TAG } from "@/lib/tags";

export type PaymentActionState = { error?: string; success?: string };

function revalidatePaymentPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/contacts");
  revalidatePath("/dashboard/university");
}

/** Grants (or restores) the buyer's GHL Membership courses and community group access. */
async function grantCourseAccess(name: string, email: string, mobile: string) {
  try {
    await grantCommunityAndMastermindAccess({ name, email, phone: mobile, extraTags: [...COURSE_ACCESS_TAGS] });
    const contact = await lookupGhlContact(email, mobile);
    if (!contact?.id) return;
    await addGhlContactTags(contact.id, [...COURSE_ACCESS_TAGS]);
    await removeGhlContactTags(contact.id, [PAYMENT_REJECTED_TAG]);
  } catch (error) {
    console.error("Failed to grant GHL course access", error);
  }
}

/** Locks the buyer out of their GHL Membership courses and community group. */
async function revokeCourseAccess(email: string, mobile: string) {
  try {
    const contact = await lookupGhlContact(email, mobile);
    if (!contact?.id) return;
    await removeGhlContactTags(contact.id, [...COURSE_ACCESS_TAGS]);
    await addGhlContactTags(contact.id, [PAYMENT_REJECTED_TAG]);
  } catch (error) {
    console.error("Failed to revoke GHL course access", error);
  }
}

export async function approveMastermindPayment(
  _state: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const { user: admin } = await requireCapability("registrations");
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) return { error: "Missing payment submission." };

  try {
    const order = await getEliteCheckoutOrder(orderId);
    if (!order) return { error: "Payment submission not found." };
    if (order.status === "approved") return { success: "This payment is already approved." };

    await setMemberPaymentVerified(order.userId, true);
    await approveEliteCheckoutOrder(order.id, admin.id);
    await grantCourseAccess(order.fullName, order.email, order.mobile);
    notifyPaymentApproved({ name: order.fullName, email: order.email, phone: order.mobile }).catch((error) =>
      console.error("Payment-approved SMS failed", error),
    );
    invalidateRegistrantCrmSync();
    revalidatePaymentPaths();
    return { success: "Payment approved and member access updated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "I couldn't approve this payment." };
  }
}

export async function rejectMastermindPayment(
  _state: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const { user: admin } = await requireCapability("registrations");
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) return { error: "Missing payment submission." };

  try {
    const order = await getEliteCheckoutOrder(orderId);
    if (!order) return { error: "Payment submission not found." };
    if (order.status === "rejected") return { success: "This payment is already rejected." };

    await setMemberPaymentVerified(order.userId, false);
    await rejectEliteCheckoutOrder(order.id, admin.id);
    await revokeCourseAccess(order.email, order.mobile);
    notifyPaymentRejected({ name: order.fullName, email: order.email, phone: order.mobile }).catch((error) =>
      console.error("Payment-rejected SMS failed", error),
    );
    invalidateRegistrantCrmSync();
    revalidatePaymentPaths();
    return { success: "Payment rejected. Their University, courses, and group access are locked until this is resolved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "I couldn't reject this payment." };
  }
}
