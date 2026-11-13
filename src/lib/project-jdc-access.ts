// Who can do what in Project JDC: admins and mentors (staff), facilitators, students,
// plus "view as", which lets staff open any facilitator's or student's dashboard.

import { cookies } from "next/headers";

import { parseAccessRole } from "@/lib/access";
import { getUserAccessRecord, saveUserAccess } from "@/lib/access-store";
import { getPublicUserById } from "@/lib/auth-store";
import { addMentorRow, listMentorRows } from "@/lib/project-jdc-store";
import { readSignedValue, requireCapability, requireSessionUser, sessionCookieOptions, signValue } from "@/lib/session";
import type { AuthUser } from "@/lib/types";

/** Made mentors automatically the first time their account is found. */
const DEFAULT_MENTOR_NAMES = ["Jayson Dela Cruz", "Katrina Dela Cruz"];
const DEFAULT_MARKER = "__default:";
const VIEW_AS_COOKIE = "pjdc-view-as";

function nameKey(name: string) {
  return name.toLowerCase().replace(/^coach\s+/, "").replace(/[^a-z]/g, "");
}

/** Mentors may not be admins; make sure Project JDC is switched on for their account. */
export async function grantProjectJdc(user: Pick<AuthUser, "id" | "role">) {
  if (user.role === "admin") return;
  const record = await getUserAccessRecord(user.id, parseAccessRole(user.role));
  if (record.overrides.projectJdc === true) return;
  await saveUserAccess(user.id, record.role, { ...record.overrides, projectJdc: true });
}

/** Undo grantProjectJdc for someone who is no longer a mentor (facilitators and students keep it by role). */
export async function revokeProjectJdc(user: Pick<AuthUser, "id" | "role">) {
  if (user.role === "admin") return;
  const record = await getUserAccessRecord(user.id, parseAccessRole(user.role));
  if (record.overrides.projectJdc !== true) return;
  const overrides = { ...record.overrides };
  delete overrides.projectJdc;
  await saveUserAccess(user.id, record.role, overrides);
}

/** Ids of everyone who is a mentor. Applies the default mentors once their accounts exist. */
export async function loadMentorIds(users: AuthUser[]): Promise<Set<string>> {
  const rows = await listMentorRows();
  const applied = new Set(rows.filter((row) => row.startsWith(DEFAULT_MARKER)).map((row) => row.slice(DEFAULT_MARKER.length)));

  for (const name of DEFAULT_MENTOR_NAMES) {
    const key = nameKey(name);
    if (applied.has(key)) continue;
    const matches = users.filter((user) => user.active !== false && nameKey(user.name) === key);
    if (matches.length === 0) continue;
    for (const match of matches) {
      await addMentorRow(match.id);
      await grantProjectJdc(match);
      rows.push(match.id);
    }
    // Remember it was applied, so removing them later sticks.
    await addMentorRow(`${DEFAULT_MARKER}${key}`);
  }

  const known = new Set(users.map((user) => user.id));
  return new Set(rows.filter((row) => !row.startsWith("__") && known.has(row)));
}

export type ProjectJdcViewer = {
  user: AuthUser;
  isMentor: boolean;
  /** Admins and mentors: see and manage everyone. */
  isStaff: boolean;
};

/** Like requireCapability("projectJdc"), but mentors always get in. */
export async function requireProjectJdc(): Promise<ProjectJdcViewer> {
  const user = await requireSessionUser();
  const isMentor = (await listMentorRows()).includes(user.id);
  if (!isMentor) await requireCapability("projectJdc");
  return { user, isMentor, isStaff: user.role === "admin" || isMentor };
}

/** The person a staff member is looking at through "view as", if any. */
export async function readViewAs(viewerId: string): Promise<string | null> {
  const value = readSignedValue((await cookies()).get(VIEW_AS_COOKIE)?.value);
  if (!value) return null;
  const [owner, target] = value.split("|");
  return owner === viewerId && target ? target : null;
}

export async function setViewAs(viewerId: string, targetId: string) {
  (await cookies()).set(VIEW_AS_COOKIE, signValue(`${viewerId}|${targetId}`), sessionCookieOptions(60 * 60 * 8));
}

export async function clearViewAs() {
  const store = await cookies();
  store.set(VIEW_AS_COOKIE, "", { ...sessionCookieOptions(0), expires: new Date(0) });
  store.delete(VIEW_AS_COOKIE);
}

/**
 * Whose facilitator work an action counts for: the facilitator themselves, or the facilitator
 * a staff member is currently viewing as. Null means staff acting for no one in particular.
 */
export async function actingFacilitatorId(viewer: ProjectJdcViewer): Promise<string | null> {
  if (!viewer.isStaff) return viewer.user.role === "facilitator" ? viewer.user.id : null;
  const target = await readViewAs(viewer.user.id);
  if (target) {
    const person = await getPublicUserById(target);
    if (person?.role === "facilitator") return person.id;
  }
  return viewer.user.role === "facilitator" ? viewer.user.id : null;
}
