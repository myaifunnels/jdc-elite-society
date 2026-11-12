"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import {
  createUser,
  deleteUser,
  findUserByEmail,
  listAllUsers,
  renameUser,
  requestPasswordReset,
  updateUserRole,
} from "@/lib/auth-store";
import { deleteUserAccess } from "@/lib/access-store";
import { deletePasswordResetsForUser } from "@/lib/password-reset";
import { pillarOf } from "@/lib/project-jdc-pillars";
import { buildSampleData } from "@/lib/project-jdc-sample";
import {
  addChecklistItem,
  ALL_STUDENTS,
  approveAllDoneForFacilitator,
  approveChecklistItem,
  assignStudentToFacilitator,
  deleteChecklistItem,
  insertSampleData,
  isProjectJdcStatus,
  listEnrollments,
  listStudentIdsForFacilitator,
  manilaTodayIso,
  markChecklistItemDone,
  removeEnrollmentsForUser,
  removeSampleData,
  sendBackChecklistItem,
  setFacilitatorStatus,
  updateEnrollmentProgress,
  upsertWeeklyPlan,
  weekStartIso,
  WEEK_DAYS,
  type WeekDay,
} from "@/lib/project-jdc-store";
import { storeProofImage } from "@/lib/r2-upload";
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

export async function updateStudentProgressAction(formData: FormData) {
  const { user } = await requireCapability("projectJdc");
  if (user.role !== "facilitator" && user.role !== "admin") return;

  const studentId = String(formData.get("studentId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 500);
  if (!studentId || !isProjectJdcStatus(status)) return;

  await updateEnrollmentProgress({
    studentId,
    status,
    notes,
    facilitatorId: user.role === "facilitator" ? user.id : undefined,
  });
  revalidatePath("/dashboard/project-jdc");
}

export async function setFacilitatorStatusAction(formData: FormData) {
  const { user } = await requireCapability("projectJdc");
  if (user.role !== "admin") return;

  const facilitatorId = String(formData.get("facilitatorId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!facilitatorId || !isProjectJdcStatus(status)) return;

  await setFacilitatorStatus(facilitatorId, status);
  revalidatePath("/dashboard/project-jdc");
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function addChecklistItemAction(formData: FormData) {
  const { user } = await requireCapability("projectJdc");
  if (user.role !== "facilitator" && user.role !== "admin") return;

  const studentId = String(formData.get("studentId") ?? "").trim();
  const dateInput = String(formData.get("itemDate") ?? "").trim();
  const itemDate = ISO_DATE.test(dateInput) ? dateInput : manilaTodayIso();
  const dueInput = String(formData.get("dueDate") ?? "").trim();
  const dueDate = ISO_DATE.test(dueInput) && dueInput >= itemDate ? dueInput : null;
  const category = String(formData.get("category") ?? "").trim();
  // A checklist: one task per line.
  const labels = String(formData.get("labels") ?? formData.get("label") ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim().slice(0, 200))
    .filter(Boolean)
    .slice(0, 10);
  if (!studentId) return { error: "Choose who the task is for." };
  if (!pillarOf(category)) return { error: "Pick one of the 5 areas of life." };
  if (labels.length === 0) return { error: "Write at least one task." };

  // "all" gives the same tasks to every student this facilitator coaches.
  const mine = await listStudentIdsForFacilitator(user.id);
  const studentIds = studentId === ALL_STUDENTS ? mine : [studentId];
  if (user.role === "facilitator" && studentIds.some((id) => !mine.includes(id))) {
    return { error: "You can only give tasks to your own students." };
  }
  for (const id of studentIds) {
    for (const label of labels) {
      await addChecklistItem({ studentId: id, facilitatorId: user.id, itemDate, dueDate, label, category });
    }
  }
  revalidatePath("/dashboard/project-jdc");
}

export async function deleteChecklistItemAction(formData: FormData) {
  const { user } = await requireCapability("projectJdc");
  if (user.role !== "facilitator" && user.role !== "admin") return;

  const itemId = String(formData.get("itemId") ?? "").trim();
  if (!itemId) return;

  await deleteChecklistItem(itemId, user.id);
  revalidatePath("/dashboard/project-jdc");
}

export async function approveAllChecklistItemsAction() {
  const { user } = await requireCapability("projectJdc");
  if (user.role !== "facilitator" && user.role !== "admin") return;

  await approveAllDoneForFacilitator(user.id);
  revalidatePath("/dashboard/project-jdc");
}

export async function markChecklistItemDoneAction(formData: FormData) {
  const { user } = await requireCapability("projectJdc");
  const itemId = String(formData.get("itemId") ?? "").trim();
  if (!itemId) return;

  const note = String(formData.get("proofNote") ?? "").trim().slice(0, 600);
  const links = formData
    .getAll("proofLink")
    .map((value) => String(value).trim())
    .filter(Boolean)
    .slice(0, 3);
  for (const link of links) {
    try {
      if (!/^https?:$/.test(new URL(link).protocol)) throw new Error();
    } catch {
      return { error: "That link doesn't look right. Copy it again from your browser." };
    }
  }
  const files = formData
    .getAll("proofImages")
    .filter((value): value is File => value instanceof File && value.size > 0)
    .slice(0, 3);
  if (!note && links.length === 0 && files.length === 0) {
    return { error: "Add a photo, a link, or a few words so your facilitator can check." };
  }

  const images: string[] = [];
  try {
    for (const file of files) images.push(await storeProofImage(file, user.id));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "That picture didn't upload. Try again." };
  }

  await markChecklistItemDone(itemId, user.id, { note, links, images });
  revalidatePath("/dashboard/project-jdc");
}

export async function sendBackChecklistItemAction(formData: FormData) {
  const { user } = await requireCapability("projectJdc");
  if (user.role !== "facilitator" && user.role !== "admin") return;

  const itemId = String(formData.get("itemId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0, 300);
  if (!itemId) return;
  if (!note) return { error: "Tell them what to add or fix." };

  await sendBackChecklistItem(itemId, user.id, note);
  revalidatePath("/dashboard/project-jdc");
}

export async function loadSampleDataAction() {
  const { user } = await requireCapability("projectJdc");
  if (user.role !== "admin") return;

  const [users, enrollments] = await Promise.all([listAllUsers(), listEnrollments()]);
  const sample = buildSampleData({
    users,
    enrolledIds: new Set(enrollments.map((enrollment) => enrollment.studentId)),
    today: manilaTodayIso(),
  });
  if (sample.facilitatorCount === 0) return { error: "Add a facilitator first." };
  if (sample.studentCount === 0) return { error: "There are no free contacts to use as sample students." };

  await insertSampleData(sample.enrollments, sample.items);
  revalidatePath("/dashboard/project-jdc");
}

export async function removeSampleDataAction() {
  const { user } = await requireCapability("projectJdc");
  if (user.role !== "admin") return;

  await removeSampleData();
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
  const weekStart = weekStartIso(weekStartInput || manilaTodayIso());
  const targetCount = Math.max(0, Number(formData.get("targetCount") ?? 0) || 0);
  const targetLabel = String(formData.get("targetLabel") ?? "").trim();

  const days = WEEK_DAYS.reduce((acc, day) => {
    acc[day] = String(formData.get(`day_${day}`) ?? "").trim();
    return acc;
  }, {} as Record<WeekDay, string>);

  await upsertWeeklyPlan({ facilitatorId: user.id, weekStart, days, targetCount, targetLabel });
  revalidatePath("/dashboard/project-jdc");
}
