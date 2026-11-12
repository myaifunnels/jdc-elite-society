import { Pool } from "pg";

import { isProjectJdcStatus, type ProjectJdcStatus } from "@/lib/project-jdc-status";

export {
  isProjectJdcStatus,
  PROJECT_JDC_STATUS_LABELS,
  PROJECT_JDC_STATUSES,
  type ProjectJdcStatus,
} from "@/lib/project-jdc-status";

function toStatus(value: unknown): ProjectJdcStatus {
  const text = String(value ?? "");
  return isProjectJdcStatus(text) ? text : "active";
}

export type ProjectJdcEnrollment = {
  id: string;
  studentId: string;
  facilitatorId: string;
  startDate: string;
  status: ProjectJdcStatus;
  notes: string;
  createdAt: string;
};

export type ProjectJdcChecklistItem = {
  id: string;
  studentId: string;
  facilitatorId: string;
  itemDate: string;
  label: string;
  category: string;
  studentDone: boolean;
  studentDoneAt: string | null;
  facilitatorApproved: boolean;
  approvedAt: string | null;
  createdAt: string;
};

/** Form value meaning "every student of this facilitator". */
export const ALL_STUDENTS = "all";

export const WEEK_DAYS =["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export type ProjectJdcWeeklyPlan = {
  id: string;
  facilitatorId: string;
  weekStart: string;
  days: Record<WeekDay, string>;
  targetCount: number;
  targetLabel: string;
  createdAt: string;
  updatedAt: string;
};

const memoryEnrollments: ProjectJdcEnrollment[] = [];
const memoryItems: ProjectJdcChecklistItem[] = [];
const memoryWeeklyPlans: ProjectJdcWeeklyPlan[] = [];
const memoryFacilitatorStatuses = new Map<string, ProjectJdcStatus>();

let pool: Pool | null | undefined;
let tableReady = false;

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  if (pool === undefined) {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function ensureTables(client: Pool) {
  if (tableReady) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS project_jdc_enrollments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL UNIQUE,
      facilitator_id TEXT NOT NULL,
      start_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS project_jdc_enrollments_facilitator_idx
    ON project_jdc_enrollments (facilitator_id)
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS project_jdc_checklist_items (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      facilitator_id TEXT NOT NULL,
      item_date DATE NOT NULL,
      label TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      student_done BOOLEAN NOT NULL DEFAULT FALSE,
      student_done_at TIMESTAMPTZ,
      facilitator_approved BOOLEAN NOT NULL DEFAULT FALSE,
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS project_jdc_items_student_date_idx
    ON project_jdc_checklist_items (student_id, item_date)
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS project_jdc_items_facilitator_date_idx
    ON project_jdc_checklist_items (facilitator_id, item_date)
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS project_jdc_weekly_plans (
      id TEXT PRIMARY KEY,
      facilitator_id TEXT NOT NULL,
      week_start DATE NOT NULL,
      days JSONB NOT NULL DEFAULT '{}'::jsonb,
      target_count INTEGER NOT NULL DEFAULT 0,
      target_label TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (facilitator_id, week_start)
    )
  `);
  await client.query(`
    ALTER TABLE project_jdc_enrollments
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  `);
  await client.query(`
    ALTER TABLE project_jdc_enrollments
    ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT ''
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS project_jdc_facilitator_statuses (
      facilitator_id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'active',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  tableReady = true;
}

function emptyWeekDays(): Record<WeekDay, string> {
  return { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" };
}

function mapWeeklyPlanRow(row: Record<string, unknown>): ProjectJdcWeeklyPlan {
  const rawDays = (row.days ?? {}) as Record<string, unknown>;
  const days = emptyWeekDays();
  for (const day of WEEK_DAYS) {
    const value = rawDays[day];
    if (typeof value === "string") days[day] = value;
  }
  return {
    id: String(row.id),
    facilitatorId: String(row.facilitator_id),
    weekStart: new Date(String(row.week_start)).toISOString().slice(0, 10),
    days,
    targetCount: Number(row.target_count ?? 0),
    targetLabel: String(row.target_label ?? ""),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

/** Today's date (YYYY-MM-DD) in the Philippines, where the program runs. */
export function manilaTodayIso(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

export function addDaysIso(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function weekStartIso(dateIso: string): string {
  const date = new Date(`${dateIso}T00:00:00Z`);
  const dayIndex = (date.getUTCDay() + 6) % 7; // Monday = 0
  date.setUTCDate(date.getUTCDate() - dayIndex);
  return date.toISOString().slice(0, 10);
}

export function weekEndIso(weekStart: string): string {
  const date = new Date(`${weekStart}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 6);
  return date.toISOString().slice(0, 10);
}

export async function upsertWeeklyPlan(input: {
  facilitatorId: string;
  weekStart: string;
  days: Record<WeekDay, string>;
  targetCount: number;
  targetLabel: string;
}): Promise<ProjectJdcWeeklyPlan> {
  const now = new Date().toISOString();
  const existingIndex = memoryWeeklyPlans.findIndex(
    (item) => item.facilitatorId === input.facilitatorId && item.weekStart === input.weekStart,
  );
  const plan: ProjectJdcWeeklyPlan = {
    id: existingIndex >= 0 ? memoryWeeklyPlans[existingIndex].id : `pjwp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    facilitatorId: input.facilitatorId,
    weekStart: input.weekStart,
    days: input.days,
    targetCount: input.targetCount,
    targetLabel: input.targetLabel,
    createdAt: existingIndex >= 0 ? memoryWeeklyPlans[existingIndex].createdAt : now,
    updatedAt: now,
  };
  if (existingIndex >= 0) {
    memoryWeeklyPlans[existingIndex] = plan;
  } else {
    memoryWeeklyPlans.push(plan);
  }

  const client = getPool();
  if (!client) return plan;

  try {
    await ensureTables(client);
    const result = await client.query(
      `INSERT INTO project_jdc_weekly_plans (id, facilitator_id, week_start, days, target_count, target_label)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (facilitator_id, week_start)
       DO UPDATE SET days = $4, target_count = $5, target_label = $6, updated_at = NOW()
       RETURNING *`,
      [plan.id, input.facilitatorId, input.weekStart, JSON.stringify(input.days), input.targetCount, input.targetLabel],
    );
    return mapWeeklyPlanRow(result.rows[0]);
  } catch (error) {
    console.error("Failed to save Project JDC weekly plan", error);
    return plan;
  }
}

export async function getWeeklyPlan(facilitatorId: string, weekStart: string): Promise<ProjectJdcWeeklyPlan | null> {
  const client = getPool();
  if (!client) {
    return memoryWeeklyPlans.find((item) => item.facilitatorId === facilitatorId && item.weekStart === weekStart) ?? null;
  }

  try {
    await ensureTables(client);
    const result = await client.query(
      "SELECT * FROM project_jdc_weekly_plans WHERE facilitator_id = $1 AND week_start = $2",
      [facilitatorId, weekStart],
    );
    return result.rows[0] ? mapWeeklyPlanRow(result.rows[0]) : null;
  } catch (error) {
    console.error("Failed to load Project JDC weekly plan", error);
    return memoryWeeklyPlans.find((item) => item.facilitatorId === facilitatorId && item.weekStart === weekStart) ?? null;
  }
}

export async function listWeeklyPlansForWeek(weekStart: string): Promise<ProjectJdcWeeklyPlan[]> {
  const client = getPool();
  if (!client) {
    return memoryWeeklyPlans.filter((item) => item.weekStart === weekStart);
  }

  try {
    await ensureTables(client);
    const result = await client.query("SELECT * FROM project_jdc_weekly_plans WHERE week_start = $1", [weekStart]);
    return result.rows.map(mapWeeklyPlanRow);
  } catch (error) {
    console.error("Failed to list Project JDC weekly plans", error);
    return memoryWeeklyPlans.filter((item) => item.weekStart === weekStart);
  }
}

export async function countNewEnrollmentsInWeek(facilitatorId: string, weekStart: string): Promise<number> {
  const end = weekEndIso(weekStart);
  const enrollments = await listEnrollments();
  return enrollments.filter(
    (item) => item.facilitatorId === facilitatorId && item.startDate >= weekStart && item.startDate <= end,
  ).length;
}

function mapEnrollmentRow(row: Record<string, unknown>): ProjectJdcEnrollment {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    facilitatorId: String(row.facilitator_id),
    startDate: new Date(String(row.start_date)).toISOString().slice(0, 10),
    status: toStatus(row.status),
    notes: String(row.notes ?? ""),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function mapItemRow(row: Record<string, unknown>): ProjectJdcChecklistItem {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    facilitatorId: String(row.facilitator_id),
    itemDate: new Date(String(row.item_date)).toISOString().slice(0, 10),
    label: String(row.label),
    category: String(row.category ?? "general"),
    studentDone: row.student_done === true || row.student_done === "t",
    studentDoneAt: row.student_done_at ? new Date(String(row.student_done_at)).toISOString() : null,
    facilitatorApproved: row.facilitator_approved === true || row.facilitator_approved === "t",
    approvedAt: row.approved_at ? new Date(String(row.approved_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function assignStudentToFacilitator(input: {
  studentId: string;
  facilitatorId: string;
  startDate: string;
}): Promise<ProjectJdcEnrollment> {
  const client = getPool();
  const existing = memoryEnrollments.findIndex((item) => item.studentId === input.studentId);
  const enrollment: ProjectJdcEnrollment = {
    id: existing >= 0 ? memoryEnrollments[existing].id : `enr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    studentId: input.studentId,
    facilitatorId: input.facilitatorId,
    startDate: input.startDate,
    status: existing >= 0 ? memoryEnrollments[existing].status : "active",
    notes: existing >= 0 ? memoryEnrollments[existing].notes : "",
    createdAt: existing >= 0 ? memoryEnrollments[existing].createdAt : new Date().toISOString(),
  };
  if (existing >= 0) {
    memoryEnrollments[existing] = enrollment;
  } else {
    memoryEnrollments.push(enrollment);
  }

  if (!client) return enrollment;

  await ensureTables(client);
  const result = await client.query(
    `INSERT INTO project_jdc_enrollments (id, student_id, facilitator_id, start_date)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (student_id) DO UPDATE SET facilitator_id = $3, start_date = $4
     RETURNING *`,
    [enrollment.id, input.studentId, input.facilitatorId, input.startDate],
  );
  return mapEnrollmentRow(result.rows[0]);
}

export async function listEnrollments(): Promise<ProjectJdcEnrollment[]> {
  const client = getPool();
  if (!client) return [...memoryEnrollments];

  try {
    await ensureTables(client);
    const result = await client.query("SELECT * FROM project_jdc_enrollments ORDER BY created_at DESC");
    return result.rows.map(mapEnrollmentRow);
  } catch (error) {
    console.error("Failed to list Project JDC enrollments", error);
    return [...memoryEnrollments];
  }
}

export async function getEnrollmentForStudent(studentId: string): Promise<ProjectJdcEnrollment | null> {
  const client = getPool();
  if (!client) return memoryEnrollments.find((item) => item.studentId === studentId) ?? null;

  try {
    await ensureTables(client);
    const result = await client.query("SELECT * FROM project_jdc_enrollments WHERE student_id = $1", [studentId]);
    return result.rows[0] ? mapEnrollmentRow(result.rows[0]) : null;
  } catch (error) {
    console.error("Failed to load Project JDC enrollment", error);
    return memoryEnrollments.find((item) => item.studentId === studentId) ?? null;
  }
}

export async function updateEnrollmentProgress(input: {
  studentId: string;
  status: ProjectJdcStatus;
  notes: string;
  facilitatorId?: string;
}): Promise<void> {
  const memoryIndex = memoryEnrollments.findIndex(
    (item) => item.studentId === input.studentId && (!input.facilitatorId || item.facilitatorId === input.facilitatorId),
  );
  if (memoryIndex >= 0) {
    memoryEnrollments[memoryIndex] = { ...memoryEnrollments[memoryIndex], status: input.status, notes: input.notes };
  }

  const client = getPool();
  if (!client) return;

  try {
    await ensureTables(client);
    // facilitatorId, when given, limits the update to that facilitator's own students.
    await client.query(
      `UPDATE project_jdc_enrollments
       SET status = $2, notes = $3
       WHERE student_id = $1 AND ($4::text IS NULL OR facilitator_id = $4)`,
      [input.studentId, input.status, input.notes, input.facilitatorId ?? null],
    );
  } catch (error) {
    console.error("Failed to update Project JDC enrollment progress", error);
  }
}

export async function setFacilitatorStatus(facilitatorId: string, status: ProjectJdcStatus): Promise<void> {
  memoryFacilitatorStatuses.set(facilitatorId, status);

  const client = getPool();
  if (!client) return;

  try {
    await ensureTables(client);
    await client.query(
      `INSERT INTO project_jdc_facilitator_statuses (facilitator_id, status)
       VALUES ($1, $2)
       ON CONFLICT (facilitator_id) DO UPDATE SET status = $2, updated_at = NOW()`,
      [facilitatorId, status],
    );
  } catch (error) {
    console.error("Failed to save Project JDC facilitator status", error);
  }
}

export async function listFacilitatorStatuses(): Promise<Map<string, ProjectJdcStatus>> {
  const client = getPool();
  if (!client) return new Map(memoryFacilitatorStatuses);

  try {
    await ensureTables(client);
    const result = await client.query("SELECT facilitator_id, status FROM project_jdc_facilitator_statuses");
    return new Map(result.rows.map((row) => [String(row.facilitator_id), toStatus(row.status)]));
  } catch (error) {
    console.error("Failed to list Project JDC facilitator statuses", error);
    return new Map(memoryFacilitatorStatuses);
  }
}

/** Latest time each student marked a checklist item done, keyed by student id. */
export async function listLastCheckIns(): Promise<Map<string, string>> {
  const fromMemory = () => {
    const map = new Map<string, string>();
    for (const item of memoryItems) {
      if (!item.studentDoneAt) continue;
      const current = map.get(item.studentId);
      if (!current || item.studentDoneAt > current) map.set(item.studentId, item.studentDoneAt);
    }
    return map;
  };

  const client = getPool();
  if (!client) return fromMemory();

  try {
    await ensureTables(client);
    const result = await client.query(
      `SELECT student_id, MAX(student_done_at) AS last_check_in
       FROM project_jdc_checklist_items
       WHERE student_done_at IS NOT NULL
       GROUP BY student_id`,
    );
    return new Map(
      result.rows.map((row) => [String(row.student_id), new Date(String(row.last_check_in)).toISOString()]),
    );
  } catch (error) {
    console.error("Failed to list Project JDC last check-ins", error);
    return fromMemory();
  }
}

export async function listStudentIdsForFacilitator(facilitatorId: string): Promise<string[]> {
  const enrollments = await listEnrollments();
  return enrollments.filter((item) => item.facilitatorId === facilitatorId).map((item) => item.studentId);
}

export async function addChecklistItem(input: {
  studentId: string;
  facilitatorId: string;
  itemDate: string;
  label: string;
  category: string;
}): Promise<ProjectJdcChecklistItem> {
  const item: ProjectJdcChecklistItem = {
    id: `pji-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    studentId: input.studentId,
    facilitatorId: input.facilitatorId,
    itemDate: input.itemDate,
    label: input.label,
    category: input.category || "general",
    studentDone: false,
    studentDoneAt: null,
    facilitatorApproved: false,
    approvedAt: null,
    createdAt: new Date().toISOString(),
  };
  memoryItems.unshift(item);

  const client = getPool();
  if (!client) return item;

  try {
    await ensureTables(client);
    await client.query(
      `INSERT INTO project_jdc_checklist_items (id, student_id, facilitator_id, item_date, label, category)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [item.id, item.studentId, item.facilitatorId, item.itemDate, item.label, item.category],
    );
  } catch (error) {
    console.error("Failed to add Project JDC checklist item", error);
  }
  return item;
}

export async function listChecklistItemsForStudent(studentId: string): Promise<ProjectJdcChecklistItem[]> {
  const client = getPool();
  if (!client) {
    return memoryItems
      .filter((item) => item.studentId === studentId)
      .sort((a, b) => b.itemDate.localeCompare(a.itemDate));
  }

  try {
    await ensureTables(client);
    const result = await client.query(
      "SELECT * FROM project_jdc_checklist_items WHERE student_id = $1 ORDER BY item_date DESC, created_at ASC",
      [studentId],
    );
    return result.rows.map(mapItemRow);
  } catch (error) {
    console.error("Failed to list Project JDC checklist items for student", error);
    return memoryItems
      .filter((item) => item.studentId === studentId)
      .sort((a, b) => b.itemDate.localeCompare(a.itemDate));
  }
}

export async function listChecklistItemsForFacilitator(facilitatorId: string): Promise<ProjectJdcChecklistItem[]> {
  const client = getPool();
  if (!client) {
    return memoryItems
      .filter((item) => item.facilitatorId === facilitatorId)
      .sort((a, b) => b.itemDate.localeCompare(a.itemDate));
  }

  try {
    await ensureTables(client);
    const result = await client.query(
      "SELECT * FROM project_jdc_checklist_items WHERE facilitator_id = $1 ORDER BY item_date DESC, created_at ASC",
      [facilitatorId],
    );
    return result.rows.map(mapItemRow);
  } catch (error) {
    console.error("Failed to list Project JDC checklist items for facilitator", error);
    return memoryItems
      .filter((item) => item.facilitatorId === facilitatorId)
      .sort((a, b) => b.itemDate.localeCompare(a.itemDate));
  }
}

export async function listAllChecklistItems(): Promise<ProjectJdcChecklistItem[]> {
  const client = getPool();
  if (!client) return [...memoryItems].sort((a, b) => b.itemDate.localeCompare(a.itemDate));

  try {
    await ensureTables(client);
    const result = await client.query(
      "SELECT * FROM project_jdc_checklist_items ORDER BY item_date DESC, created_at ASC",
    );
    return result.rows.map(mapItemRow);
  } catch (error) {
    console.error("Failed to list all Project JDC checklist items", error);
    return [...memoryItems].sort((a, b) => b.itemDate.localeCompare(a.itemDate));
  }
}

export async function approveAllDoneForFacilitator(facilitatorId: string): Promise<void> {
  const now = new Date().toISOString();
  for (let i = 0; i < memoryItems.length; i += 1) {
    const item = memoryItems[i];
    if (item.facilitatorId === facilitatorId && item.studentDone && !item.facilitatorApproved) {
      memoryItems[i] = { ...item, facilitatorApproved: true, approvedAt: now };
    }
  }

  const client = getPool();
  if (!client) return;

  try {
    await ensureTables(client);
    await client.query(
      `UPDATE project_jdc_checklist_items
       SET facilitator_approved = TRUE, approved_at = NOW()
       WHERE facilitator_id = $1 AND student_done = TRUE AND facilitator_approved = FALSE`,
      [facilitatorId],
    );
  } catch (error) {
    console.error("Failed to approve all Project JDC checklist items", error);
  }
}

export async function markChecklistItemDone(itemId: string, studentId: string): Promise<void> {
  const memoryIndex = memoryItems.findIndex((item) => item.id === itemId && item.studentId === studentId);
  if (memoryIndex >= 0) {
    memoryItems[memoryIndex] = {
      ...memoryItems[memoryIndex],
      studentDone: true,
      studentDoneAt: new Date().toISOString(),
    };
  }

  const client = getPool();
  if (!client) return;

  try {
    await ensureTables(client);
    await client.query(
      `UPDATE project_jdc_checklist_items
       SET student_done = TRUE, student_done_at = NOW()
       WHERE id = $1 AND student_id = $2`,
      [itemId, studentId],
    );
  } catch (error) {
    console.error("Failed to mark Project JDC checklist item done", error);
  }
}

export async function deleteChecklistItem(itemId: string, facilitatorId: string): Promise<void> {
  const memoryIndex = memoryItems.findIndex((item) => item.id === itemId && item.facilitatorId === facilitatorId);
  if (memoryIndex >= 0) memoryItems.splice(memoryIndex, 1);

  const client = getPool();
  if (!client) return;

  try {
    await ensureTables(client);
    await client.query("DELETE FROM project_jdc_checklist_items WHERE id = $1 AND facilitator_id = $2", [
      itemId,
      facilitatorId,
    ]);
  } catch (error) {
    console.error("Failed to delete Project JDC checklist item", error);
  }
}

export async function approveChecklistItem(itemId: string, facilitatorId: string): Promise<void> {
  const memoryIndex = memoryItems.findIndex((item) => item.id === itemId && item.facilitatorId === facilitatorId);
  if (memoryIndex >= 0) {
    memoryItems[memoryIndex] = {
      ...memoryItems[memoryIndex],
      facilitatorApproved: true,
      approvedAt: new Date().toISOString(),
    };
  }

  const client = getPool();
  if (!client) return;

  try {
    await ensureTables(client);
    await client.query(
      `UPDATE project_jdc_checklist_items
       SET facilitator_approved = TRUE, approved_at = NOW()
       WHERE id = $1 AND facilitator_id = $2`,
      [itemId, facilitatorId],
    );
  } catch (error) {
    console.error("Failed to approve Project JDC checklist item", error);
  }
}

export async function removeEnrollmentsForUser(userId: string): Promise<void> {
  for (let i = memoryEnrollments.length - 1; i >= 0; i -= 1) {
    if (memoryEnrollments[i].studentId === userId || memoryEnrollments[i].facilitatorId === userId) {
      memoryEnrollments.splice(i, 1);
    }
  }

  const client = getPool();
  if (!client) return;

  try {
    await ensureTables(client);
    await client.query(
      "DELETE FROM project_jdc_enrollments WHERE student_id = $1 OR facilitator_id = $1",
      [userId],
    );
    await client.query("DELETE FROM project_jdc_facilitator_statuses WHERE facilitator_id = $1", [userId]);
  } catch (error) {
    console.error("Failed to remove Project JDC enrollments for user", error);
  }
}

export function dayNumberFor(startDate: string, itemDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const current = new Date(`${itemDate}T00:00:00Z`).getTime();
  return Math.floor((current - start) / 86_400_000) + 1;
}
