"use server";

import { revalidatePath } from "next/cache";

import { markAllNotificationsRead, markNotificationRead } from "@/lib/notification-store";
import { requireSessionUser } from "@/lib/session";

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireSessionUser();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await markNotificationRead(user.id, id);
  revalidatePath("/dashboard");
}

export async function markAllNotificationsReadAction() {
  const user = await requireSessionUser();
  await markAllNotificationsRead(user.id);
  revalidatePath("/dashboard");
}
