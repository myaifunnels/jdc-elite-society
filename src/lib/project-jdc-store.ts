import { Pool } from "pg";

export type ProjectJdcEnrollment = {
  id: string;
  studentId: string;
  facilitatorId: string;
  startDate: string;
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

const memoryEnrollments: ProjectJdcEnrollment[] = [];
const memoryItems: ProjectJdcChecklistItem[] = [];

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
  tableReady = true;
}

function mapEnrollmentRow(row: Record<string, unknown>): ProjectJdcEnrollment {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    facilitatorId: String(row.facilitator_id),
    startDate: new Date(String(row.start_date)).toISOString().slice(0, 10),
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

export function dayNumberFor(startDate: string, itemDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const current = new Date(`${itemDate}T00:00:00Z`).getTime();
  return Math.floor((current - start) / 86_400_000) + 1;
}
