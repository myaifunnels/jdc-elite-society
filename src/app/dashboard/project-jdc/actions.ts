"use server";

import { revalidatePath } from "next/cache";

import {
  addChecklistItem,
  approveChecklistItem,
  assignStudentToFacilitator,
  markChecklistItemDone,
} from "@/lib/project-jdc-store";
import { requireCapability } from "@/lib/session";

export async function assignStudentAction(formData: FormData) {
  const { user } = await requireCapability("projectJdc");
  if (user.role !== "admin") return;

  const studentId = String(formData.get("studentId") ?? "").trim();
  const facilitatorId = String(formData.get("facilitatorId") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  if (!studentId || !facilitatorId || !startDate) return;

  await assignStudentToFacilitator({ studentId, facilitatorId, startDate });
  revalidatePath("/dashboard/project-jdc");
}

export async function addChecklistItemAction(formData: FormData) {
  const { user } = await requireCapability("projectJdc");
  if (user.role !== "facilitator" && user.role !== "admin") return;

  const studentId = String(formData.get("studentId") ?? "").trim();
  const itemDate = String(formData.get("itemDate") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const category = String(formData.get("category") ?? "general").trim();
  if (!studentId || !itemDate || !label) return;

  await addChecklistItem({ studentId, facilitatorId: user.id, itemDate, label, category });
  revalidatePath("/dashboard/project-jdc");
}

export async function markChecklistItemDoneAction(formData: FormData) {
  const { user } = await requireCapability("projectJdc");
  const itemId = String(formData.get("itemId") ?? "").trim();
  if (!itemId) return;

  await markChecklistItemDone(itemId, user.id);
  revalidatePath("/dashboard/project-jdc");
}

export async function approveChecklistItemAction(formData: FormData) {
  const { user } = await requireCapability("projectJdc");
  if (user.role !== "facilitator" && user.role !== "admin") return;

  const itemId = String(formData.get("itemId") ?? "").trim();
  if (!itemId) return;

  await approveChecklistItem(itemId, user.id);
  revalidatePath("/dashboard/project-jdc");
}
