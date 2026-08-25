"use server";

import { revalidatePath } from "next/cache";

import { setMemberPaymentVerified } from "@/lib/auth-store";
import { approveEliteCheckoutOrder, getEliteCheckoutOrder, rejectEliteCheckoutOrder } from "@/lib/elite-checkout-store";
import { invalidateRegistrantCrmSync } from "@/lib/crm-store";
import { requireCapability } from "@/lib/session";

export type PaymentActionState = { error?: string; success?: string };

function revalidatePaymentPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/contacts");
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
    invalidateRegistrantCrmSync();
    revalidatePaymentPaths();
    return { success: "Payment rejected. Their University access is locked until this is resolved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "I couldn't reject this payment." };
  }
}
