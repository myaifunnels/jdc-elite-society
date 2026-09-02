"use server";

import { revalidatePath } from "next/cache";

import { findUserById } from "@/lib/auth-store";
import { hasAccess } from "@/lib/access";
import { resolveAccess } from "@/lib/access-store";
import { getEliteCheckoutOrder, updateEliteCheckoutReceipt } from "@/lib/elite-checkout-store";
import { storePaymentReceipt } from "@/lib/r2-upload";
import { requireCapability, requireSessionUser } from "@/lib/session";
import {
  addSupportTicketMessage,
  createSupportTicket,
  getSupportTicket,
  updateSupportTicketStatus,
} from "@/lib/support-store";
import { SupportTicketCategory, SupportTicketStatus } from "@/lib/types";

export type SupportActionState = {
  error?: string;
  success?: string;
  ticketId?: string;
};

export async function createTicketAction(
  _prev: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> {
  const user = await requireSessionUser();
  const access = await resolveAccess(user);
  if (!hasAccess(access, "support")) {
    return { error: "You don't have access to support." };
  }

  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const category = String(formData.get("category") ?? "general") as SupportTicketCategory;
  const relatedOrderId = String(formData.get("relatedOrderId") ?? "").trim();

  if (!subject) return { error: "Add a subject for your ticket." };
  if (!message) return { error: "Write a message so we know how to help." };

  try {
    const { ticket } = await createSupportTicket({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      subject,
      category,
      relatedOrderId,
      initialMessage: message,
    });
    const { notifySupportTicketOpened } = await import("@/lib/activity-notify");
    notifySupportTicketOpened({
      member: { id: user.id, name: user.name, email: user.email, phone: user.phone },
      subject,
      category,
      preview: message,
      ticketId: ticket.id,
    }).catch((error) => console.error("Support ticket notify failed", error));
    revalidatePath("/dashboard/support");
    return { success: "Your support ticket was created.", ticketId: ticket.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function replyToTicketAction(
  _prev: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> {
  const user = await requireSessionUser();
  const access = await resolveAccess(user);
  const ticketId = String(formData.get("ticketId") ?? "").trim();
  const body = String(formData.get("message") ?? "").trim();

  if (!ticketId) return { error: "Ticket not found." };
  if (!body) return { error: "Write a message before sending." };

  const ticket = await getSupportTicket(ticketId);
  if (!ticket) return { error: "Ticket not found." };

  const isAdmin = hasAccess(access, "support.admin");
  if (!isAdmin && ticket.userId !== user.id) {
    return { error: "You can't reply to this ticket." };
  }

  const newStatus: SupportTicketStatus | undefined = isAdmin
    ? "waiting_for_response"
    : ticket.status === "waiting_for_response" || ticket.status === "resolved"
      ? "open"
      : undefined;

  try {
    await addSupportTicketMessage({
      ticketId,
      authorId: user.id,
      authorName: user.name,
      authorRole: isAdmin ? "admin" : user.role,
      body,
      newStatus,
    });
    const member = isAdmin ? await findUserById(ticket.userId) : user;
    const { notifySupportReply } = await import("@/lib/activity-notify");
    notifySupportReply({
      member: {
        id: ticket.userId,
        name: ticket.userName,
        email: ticket.userEmail,
        phone: member?.phone ?? "",
      },
      subject: ticket.subject,
      preview: body,
      ticketId,
      fromAdmin: isAdmin,
    }).catch((error) => console.error("Support reply notify failed", error));
    revalidatePath("/dashboard/support");
    revalidatePath(`/dashboard/support?ticket=${ticketId}`);
    return { success: "Message sent.", ticketId };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function updateTicketStatusAction(
  _prev: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> {
  await requireCapability("support.admin");
  const ticketId = String(formData.get("ticketId") ?? "").trim();
  const status = String(formData.get("status") ?? "") as SupportTicketStatus;

  if (!ticketId) return { error: "Ticket not found." };
  if (!["open", "waiting_for_response", "resolved", "completed"].includes(status)) {
    return { error: "Invalid status." };
  }

  try {
    await updateSupportTicketStatus(ticketId, status);
    const ticket = await getSupportTicket(ticketId);
    if (ticket) {
      const member = await findUserById(ticket.userId);
      const { notifySupportStatus } = await import("@/lib/activity-notify");
      const { supportStatusLabel } = await import("@/lib/support-labels");
      notifySupportStatus({
        member: {
          id: ticket.userId,
          name: ticket.userName,
          email: ticket.userEmail,
          phone: member?.phone ?? "",
        },
        subject: ticket.subject,
        status: supportStatusLabel(status),
        ticketId,
      }).catch((error) => console.error("Support status notify failed", error));
    }
    revalidatePath("/dashboard/support");
    return { success: "Ticket status updated.", ticketId };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function reuploadReceiptAction(
  _prev: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> {
  const user = await requireSessionUser();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const receipt = formData.get("receipt");

  if (!orderId) return { error: "Order not found." };
  if (!(receipt instanceof File) || !receipt.size) {
    return { error: "Upload your payment screenshot or receipt." };
  }

  const order = await getEliteCheckoutOrder(orderId);
  if (!order || order.userId !== user.id) {
    return { error: "Order not found." };
  }

  try {
    const receiptUrl = await storePaymentReceipt(receipt, user.email);
    await updateEliteCheckoutReceipt(orderId, { receiptName: receipt.name, receiptUrl });
    const { notifyReceiptReupload } = await import("@/lib/activity-notify");
    notifyReceiptReupload({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    }).catch((error) => console.error("Receipt reupload notify failed", error));
    revalidatePath("/dashboard/university");
    revalidatePath("/dashboard/support");
    return { success: "Receipt uploaded. Our team will review it shortly." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }
}
