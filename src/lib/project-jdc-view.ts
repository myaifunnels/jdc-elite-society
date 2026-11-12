import { listAllUsers } from "@/lib/auth-store";
import {
  addDaysIso,
  dayNumberFor,
  listAllChecklistItems,
  listEnrollments,
  listFacilitatorStatuses,
  listWeeklyPlansForWeek,
  manilaTodayIso,
  weekEndIso,
  weekStartIso,
  type ProjectJdcChecklistItem,
  type ProjectJdcStatus,
  type ProjectJdcWeeklyPlan,
} from "@/lib/project-jdc-store";
import type { AuthUser } from "@/lib/types";

// Plain, serializable shapes handed to the Project JDC screens (server and client).

export type PjdcPerson = {
  id: string;
  name: string;
  photoUrl: string;
  status: ProjectJdcStatus;
};

export type PjdcStudent = PjdcPerson & {
  facilitatorId: string;
  email: string;
  phone: string;
  startDate: string;
  day: number;
  notes: string;
  lastCheckIn: string | null;
  doneToday: number;
  totalToday: number;
  tasksDone: number;
  streak: number;
};

export type PjdcFacilitator = PjdcPerson & {
  target: number;
  targetLabel: string;
  newThisWeek: number;
  students: PjdcStudent[];
};

export type PjdcLeader = {
  id: string;
  name: string;
  photoUrl: string;
  score: number;
  detail: string;
};

export type PjdcLeaderboards = {
  students: { week: PjdcLeader[]; all: PjdcLeader[] };
  facilitators: { week: PjdcLeader[]; all: PjdcLeader[] };
};

export type PjdcData = {
  today: string;
  weekStart: string;
  users: AuthUser[];
  items: ProjectJdcChecklistItem[];
  plans: Map<string, ProjectJdcWeeklyPlan>;
  facilitators: PjdcFacilitator[];
  students: PjdcStudent[];
  unassigned: PjdcPerson[];
  leaderboards: PjdcLeaderboards;
};

export const PROGRAM_DAYS = 30;

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** Days in a row (ending today, or yesterday if today isn't done yet) with at least one task done. */
export function streakFor(doneDates: Set<string>, today: string): number {
  let cursor = doneDates.has(today) ? today : addDaysIso(today, -1);
  let streak = 0;
  while (doneDates.has(cursor)) {
    streak += 1;
    cursor = addDaysIso(cursor, -1);
  }
  return streak;
}

function rank(entries: PjdcLeader[]): PjdcLeader[] {
  return entries
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export async function loadProjectJdcData(): Promise<PjdcData> {
  const today = manilaTodayIso();
  const weekStart = weekStartIso(today);
  const weekEnd = weekEndIso(weekStart);

  const [users, enrollments, items, weeklyPlans, facilitatorStatuses] = await Promise.all([
    listAllUsers(),
    listEnrollments(),
    listAllChecklistItems(),
    listWeeklyPlansForWeek(weekStart),
    listFacilitatorStatuses(),
  ]);

  const userById = new Map(users.map((user) => [user.id, user]));
  const plans = new Map(weeklyPlans.map((plan) => [plan.facilitatorId, plan]));

  const itemsByStudent = new Map<string, ProjectJdcChecklistItem[]>();
  for (const item of items) {
    const list = itemsByStudent.get(item.studentId) ?? [];
    list.push(item);
    itemsByStudent.set(item.studentId, list);
  }

  const students: PjdcStudent[] = enrollments.flatMap((enrollment) => {
    const user = userById.get(enrollment.studentId);
    if (!user) return [];
    const mine = itemsByStudent.get(enrollment.studentId) ?? [];
    const done = mine.filter((item) => item.studentDone);
    const todayItems = mine.filter((item) => item.itemDate === today);
    const lastCheckIn = done.reduce<string | null>(
      (latest, item) => (item.studentDoneAt && (!latest || item.studentDoneAt > latest) ? item.studentDoneAt : latest),
      null,
    );
    return [
      {
        id: user.id,
        name: user.name,
        photoUrl: user.facebookPhotoUrl ?? "",
        status: enrollment.status,
        facilitatorId: enrollment.facilitatorId,
        email: user.email.endsWith("@ghl.invalid") ? "" : user.email,
        phone: user.phone,
        startDate: enrollment.startDate,
        day: dayNumberFor(enrollment.startDate, today),
        notes: enrollment.notes,
        lastCheckIn,
        doneToday: todayItems.filter((item) => item.studentDone).length,
        totalToday: todayItems.length,
        tasksDone: done.length,
        streak: streakFor(new Set(done.map((item) => item.itemDate)), today),
      },
    ];
  });

  const facilitators: PjdcFacilitator[] = users
    .filter((user) => user.role === "facilitator")
    .map((user) => {
      const plan = plans.get(user.id);
      const mine = students.filter((student) => student.facilitatorId === user.id);
      return {
        id: user.id,
        name: user.name,
        photoUrl: user.facebookPhotoUrl ?? "",
        status: facilitatorStatuses.get(user.id) ?? "active",
        target: plan?.targetCount ?? 0,
        targetLabel: plan?.targetLabel ?? "",
        newThisWeek: mine.filter((student) => student.startDate >= weekStart && student.startDate <= weekEnd).length,
        students: mine.sort((a, b) => a.name.localeCompare(b.name)),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const enrolledIds = new Set(enrollments.map((enrollment) => enrollment.studentId));
  const unassigned: PjdcPerson[] = users
    .filter((user) => user.role === "student" && !enrolledIds.has(user.id))
    .map((user) => ({ id: user.id, name: user.name, photoUrl: user.facebookPhotoUrl ?? "", status: "active" }));

  const doneThisWeek = (studentId: string) =>
    (itemsByStudent.get(studentId) ?? []).filter(
      (item) => item.studentDone && item.itemDate >= weekStart && item.itemDate <= weekEnd,
    ).length;

  const leaderboards: PjdcLeaderboards = {
    students: {
      week: rank(
        students.map((student) => {
          const score = doneThisWeek(student.id);
          return { id: student.id, name: student.name, photoUrl: student.photoUrl, score, detail: plural(score, "task") };
        }),
      ),
      all: rank(
        students.map((student) => ({
          id: student.id,
          name: student.name,
          photoUrl: student.photoUrl,
          score: student.tasksDone,
          detail: `${plural(student.tasksDone, "task")} · ${plural(student.streak, "day")} in a row`,
        })),
      ),
    },
    facilitators: {
      week: rank(
        facilitators.map((facilitator) => ({
          id: facilitator.id,
          name: facilitator.name,
          photoUrl: facilitator.photoUrl,
          score: facilitator.newThisWeek,
          detail: facilitator.target
            ? `${facilitator.newThisWeek} of ${facilitator.target} goal`
            : plural(facilitator.newThisWeek, "new student"),
        })),
      ),
      all: rank(
        facilitators.map((facilitator) => ({
          id: facilitator.id,
          name: facilitator.name,
          photoUrl: facilitator.photoUrl,
          score: facilitator.students.length,
          detail: plural(facilitator.students.length, "student"),
        })),
      ),
    },
  };

  return { today, weekStart, users, items, plans, facilitators, students, unassigned, leaderboards };
}
