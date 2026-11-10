"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import {
  createUser,
  deleteUser,
  findUserByEmail,
  renameUser,
  requestPasswordReset,
  updateUserRole,
} from "@/lib/auth-store";
import { deleteUserAccess } from "@/lib/access-store";
import { deletePasswordResetsForUser } from "@/lib/password-reset";
import {
  addChecklistItem,
  approveChecklistItem,
  assignStudentToFacilitator,
  markChecklistItemDone,
  removeEnrollmentsForUser,
  upsertWeeklyPlan,
  weekStartIso,
  WEEK_DAYS,
  type WeekDay,
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
  if (existing) {
    if (existing.role !== "admin") {
      await updateUserRole(existing.id, role);
    }
    revalidatePath("/dashboard/project-jdc");
    return;
  }

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

export async function saveWeeklyPlanAction(formData: FormData) {
  const { user } = await requireCapability("projectJdc");
  if (user.role !== "facilitator") return;

  const weekStartInput = String(formData.get("weekStart") ?? "").trim();
  const weekStart = weekStartIso(weekStartInput || new Date().toISOString().slice(0, 10));
  const targetCount = Math.max(0, Number(formData.get("targetCount") ?? 0) || 0);
  const targetLabel = String(formData.get("targetLabel") ?? "").trim();

  const days = WEEK_DAYS.reduce((acc, day) => {
    acc[day] = String(formData.get(`day_${day}`) ?? "").trim();
    return acc;
  }, {} as Record<WeekDay, string>);

  await upsertWeeklyPlan({ facilitatorId: user.id, weekStart, days, targetCount, targetLabel });
  revalidatePath("/dashboard/project-jdc");
}
