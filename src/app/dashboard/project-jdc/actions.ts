"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import {
  createUser,
  deleteUser,
  findUserByEmail,
  renameUser,
  requestPasswordReset,
} from "@/lib/auth-store";
import { deleteUserAccess } from "@/lib/access-store";
import { searchGhlContactsByTags } from "@/lib/ghl";
import { deletePasswordResetsForUser } from "@/lib/password-reset";
import { PROJECT_JDC_SYNC_TAG } from "@/lib/tags";
import {
  addChecklistItem,
  approveChecklistItem,
  assignStudentToFacilitator,
  markChecklistItemDone,
  removeEnrollmentsForUser,
} from "@/lib/project-jdc-store";
import { requireCapability } from "@/lib/session";
import type { DashboardRole } from "@/lib/types";

function isManagedRole(role: string): role is Extract<DashboardRole, "facilitator" | "student"> {
  return role === "facilitator" || role === "student";
}

export async function createProjectJdcPersonAction(formData: FormData) {
  const { user: actor } = await requireCapability("projectJdc");
  if (actor.role !== "admin") return;

  const role = String(formData.get("role") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!isManagedRole(role) || !name || !email) return;

  const existing = await findUserByEmail(email);
  if (existing) return;

  const created = await createUser({
    name,
    email,
    password: randomBytes(18).toString("hex"),
    role,
    passwordSet: false,
    profileComplete: true,
    paymentVerified: true,
  });
  await requestPasswordReset(created.email);

  revalidatePath("/dashboard/project-jdc");
}

export async function syncGhlStudentsAction() {
  const { user: actor } = await requireCapability("projectJdc");
  if (actor.role !== "admin") return;

  const contacts = await searchGhlContactsByTags([PROJECT_JDC_SYNC_TAG]);

  for (const contact of contacts) {
    const email = (contact.email ?? "").trim().toLowerCase();
    const name = (contact.name || `${contact.firstName ?? ""} ${contact.lastName ?? ""}`).trim();
    if (!email || !name) continue;

    const existing = await findUserByEmail(email);
    if (existing) continue;

    const created = await createUser({
      name,
      email,
      phone: contact.phone ?? "",
      password: randomBytes(18).toString("hex"),
      role: "student",
      passwordSet: false,
      profileComplete: true,
      paymentVerified: true,
    });
    await requestPasswordReset(created.email);
  }

  revalidatePath("/dashboard/project-jdc");
}

export async function renameProjectJdcPersonAction(formData: FormData) {
  const { user: actor } = await requireCapability("projectJdc");
  if (actor.role !== "admin") return;

  const userId = String(formData.get("userId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!userId || !name) return;

  await renameUser(userId, name);
  revalidatePath("/dashboard/project-jdc");
}

export async function deleteProjectJdcPersonAction(formData: FormData) {
  const { user: actor } = await requireCapability("projectJdc");
  if (actor.role !== "admin") return;

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId || userId === actor.id) return;

  await removeEnrollmentsForUser(userId);
  await deleteUserAccess(userId);
  await deletePasswordResetsForUser(userId);
  await deleteUser(userId);

  revalidatePath("/dashboard/project-jdc");
}

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
