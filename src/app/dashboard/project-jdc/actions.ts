"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createUser,
  deleteUser,
  findUserByEmail,
  getPublicUserById,
  listAllUsers,
  renameUser,
  requestPasswordReset,
  updateUserRole,
} from "@/lib/auth-store";
import { deleteUserAccess } from "@/lib/access-store";
import { deletePasswordResetsForUser } from "@/lib/password-reset";
import {
  actingFacilitatorId,
  clearViewAs,
  grantProjectJdc,
  requireProjectJdc,
  revokeProjectJdc,
  setViewAs,
} from "@/lib/project-jdc-access";
import { pillarOf } from "@/lib/project-jdc-pillars";
import { buildSampleData } from "@/lib/project-jdc-sample";
import {
  addChecklistItem,
  addMentorRow,
  ALL_STUDENTS,
  approveAllDoneForFacilitator,
  approveChecklistItem,
  assignStudentToFacilitator,
  deleteChecklistItem,
  getEnrollmentForStudent,
  insertSampleData,
  isProjectJdcStatus,
  listEnrollments,
  listStudentIdsForFacilitator,
  manilaTodayIso,
  markChecklistItemDone,
  removeEnrollmentsForUser,
  removeMentorRow,
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
import type { DashboardRole } from "@/lib/types";

const BASE = "/dashboard/project-jdc";

function isManagedRole(role: string): role is Extract<DashboardRole, "facilitator" | "student"> {
  return role === "facilitator" || role === "student";
}

export async function createProjectJdcPersonAction(formData: FormData) {
  const { isStaff } = await requireProjectJdc();
  if (!isStaff) return;

  const role = String(formData.get("role") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!isManagedRole(role) || !name || !email) return;

  const existing = await findUserByEmail(email);
  if (existing) {
    if (existing.role !== "admin") {
      await updateUserRole(existing.id, role);
    }
    revalidatePath(BASE);
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

  revalidatePath(BASE);
}

export async function renameProjectJdcPersonAction(formData: FormData) {
  const { isStaff } = await requireProjectJdc();
  if (!isStaff) return;

  const userId = String(formData.get("userId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!userId || !name) return;

  await renameUser(userId, name);
  revalidatePath(BASE);
}

export async function deleteProjectJdcPersonAction(formData: FormData) {
  const { user: actor, isStaff } = await requireProjectJdc();
  if (!isStaff) return;

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId || userId === actor.id) return;
  // Only facilitators and students can be removed from here, never another admin.
  const target = await getPublicUserById(userId);
  if (!target || !isManagedRole(target.role)) return;

  await removeEnrollmentsForUser(userId);
  await removeMentorRow(userId);
  await deleteUserAccess(userId);
  await deletePasswordResetsForUser(userId);
  await deleteUser(userId);

  revalidatePath(BASE);
}

export async function assignStudentAction(formData: FormData) {
  const { isStaff } = await requireProjectJdc();
  if (!isStaff) return;

  const studentId = String(formData.get("studentId") ?? "").trim();
  const facilitatorId = String(formData.get("facilitatorId") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  if (!studentId || !facilitatorId || !startDate) return;

  await assignStudentToFacilitator({ studentId, facilitatorId, startDate });
  revalidatePath(BASE);
}

export async function updateStudentProgressAction(formData: FormData) {
  const viewer = await requireProjectJdc();
  const facilitatorId = await actingFacilitatorId(viewer);
  if (!viewer.isStaff && !facilitatorId) return;

  const studentId = String(formData.get("studentId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 500);
  if (!studentId || !isProjectJdcStatus(status)) return;

  await updateEnrollmentProgress({
    studentId,
    status,
    notes,
    // Staff can update anyone; a facilitator only their own students.
    facilitatorId: viewer.isStaff ? undefined : (facilitatorId ?? undefined),
  });
  revalidatePath(BASE);
}

export async function setFacilitatorStatusAction(formData: FormData) {
  const { isStaff } = await requireProjectJdc();
  if (!isStaff) return;

  const facilitatorId = String(formData.get("facilitatorId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!facilitatorId || !isProjectJdcStatus(status)) return;

  await setFacilitatorStatus(facilitatorId, status);
  revalidatePath(BASE);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function addChecklistItemAction(formData: FormData) {
  const viewer = await requireProjectJdc();
  const facilitatorId = await actingFacilitatorId(viewer);
  if (!facilitatorId) return { error: "Open a facilitator's dashboard to give tasks for them." };

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
  const mine = await listStudentIdsForFacilitator(facilitatorId);
  const studentIds = studentId === ALL_STUDENTS ? mine : [studentId];
  if (studentIds.some((id) => !mine.includes(id))) {
    return { error: "You can only give tasks to this facilitator's students." };
  }
  for (const id of studentIds) {
    for (const label of labels) {
      await addChecklistItem({ studentId: id, facilitatorId, itemDate, dueDate, label, category });
    }
  }
  revalidatePath(BASE);
}

/** The facilitator whose tasks this person may check: their own, or anyone's for staff. */
async function checkerScope() {
  const viewer = await requireProjectJdc();
  const facilitatorId = await actingFacilitatorId(viewer);
  if (viewer.isStaff) return { allowed: true, facilitatorId: null as string | null, acting: facilitatorId };
  return { allowed: Boolean(facilitatorId), facilitatorId, acting: facilitatorId };
}

export async function deleteChecklistItemAction(formData: FormData) {
  const scope = await checkerScope();
  if (!scope.allowed) return;

  const itemId = String(formData.get("itemId") ?? "").trim();
  if (!itemId) return;

  await deleteChecklistItem(itemId, scope.facilitatorId);
  revalidatePath(BASE);
}

export async function approveAllChecklistItemsAction() {
  const scope = await checkerScope();
  if (!scope.acting) return;

  await approveAllDoneForFacilitator(scope.acting);
  revalidatePath(BASE);
}

export async function approveChecklistItemAction(formData: FormData) {
  const scope = await checkerScope();
  if (!scope.allowed) return;

  const itemId = String(formData.get("itemId") ?? "").trim();
  if (!itemId) return;

  await approveChecklistItem(itemId, scope.facilitatorId);
  revalidatePath(BASE);
}

export async function sendBackChecklistItemAction(formData: FormData) {
  const scope = await checkerScope();
  if (!scope.allowed) return;

  const itemId = String(formData.get("itemId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0, 300);
  if (!itemId) return;
  if (!note) return { error: "Tell them what to add or fix." };

  await sendBackChecklistItem(itemId, scope.facilitatorId, note);
  revalidatePath(BASE);
}

export async function markChecklistItemDoneAction(formData: FormData) {
  const { user } = await requireProjectJdc();
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
  revalidatePath(BASE);
}

export async function saveWeeklyPlanAction(formData: FormData) {
  const viewer = await requireProjectJdc();
  const facilitatorId = await actingFacilitatorId(viewer);
  if (!facilitatorId) return;

  const weekStartInput = String(formData.get("weekStart") ?? "").trim();
  const weekStart = weekStartIso(weekStartInput || manilaTodayIso());
  const targetCount = Math.max(0, Number(formData.get("targetCount") ?? 0) || 0);
  const targetLabel = String(formData.get("targetLabel") ?? "").trim();

  const days = WEEK_DAYS.reduce((acc, day) => {
    acc[day] = String(formData.get(`day_${day}`) ?? "").trim();
    return acc;
  }, {} as Record<WeekDay, string>);

  await upsertWeeklyPlan({ facilitatorId, weekStart, days, targetCount, targetLabel });
  revalidatePath(BASE);
}

export async function loadSampleDataAction() {
  const { isStaff } = await requireProjectJdc();
  if (!isStaff) return;

  const [users, enrollments] = await Promise.all([listAllUsers(), listEnrollments()]);
  const sample = buildSampleData({
    users,
    enrolledIds: new Set(enrollments.map((enrollment) => enrollment.studentId)),
    today: manilaTodayIso(),
  });
  if (sample.facilitatorCount === 0) return { error: "Add a facilitator first." };
  if (sample.studentCount === 0) return { error: "There are no free contacts to use as sample students." };

  await insertSampleData(sample.enrollments, sample.items);
  revalidatePath(BASE);
}

export async function removeSampleDataAction() {
  const { isStaff } = await requireProjectJdc();
  if (!isStaff) return;

  await removeSampleData();
  revalidatePath(BASE);
}

/* ---------- Mentors ---------- */

export async function addMentorAction(formData: FormData) {
  const { isStaff } = await requireProjectJdc();
  if (!isStaff) return;

  const userId = String(formData.get("userId") ?? "").trim();
  const person = userId ? await getPublicUserById(userId) : null;
  if (!person) return { error: "Choose someone to make a mentor." };

  await addMentorRow(person.id);
  await grantProjectJdc(person);
  revalidatePath(BASE);
}

export async function removeMentorAction(formData: FormData) {
  const { user, isStaff } = await requireProjectJdc();
  if (!isStaff) return;

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) return;
  if (userId === user.id) return { error: "Ask another admin or mentor to remove you." };

  await removeMentorRow(userId);
  const person = await getPublicUserById(userId);
  if (person) await revokeProjectJdc(person);
  revalidatePath(BASE);
}

/* ---------- View as ---------- */

/** Staff open a facilitator's or student's dashboard to see exactly what they see. */
export async function viewAsAction(formData: FormData) {
  const { user, isStaff } = await requireProjectJdc();
  if (!isStaff) return;

  const targetId = String(formData.get("targetId") ?? "").trim();
  const target = targetId && targetId !== user.id ? await getPublicUserById(targetId) : null;
  if (!target) return;
  const isFacilitator = target.role === "facilitator";
  const isStudent = Boolean(await getEnrollmentForStudent(target.id));
  if (!isFacilitator && !isStudent) return;

  await setViewAs(user.id, target.id);
  redirect(BASE);
}

export async function stopViewAsAction() {
  await requireProjectJdc();
  await clearViewAs();
  redirect(`${BASE}?tab=team`);
}
