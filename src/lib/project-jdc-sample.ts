// Practice data for Project JDC: real contacts become sample students so facilitators can try every screen.
// Every row is flagged is_sample, and "Remove sample data" deletes all of it without touching the contacts.

import { PILLARS, TASK_IDEAS, type Pillar } from "@/lib/project-jdc-pillars";
import {
  addDaysIso,
  emptyProof,
  type ProjectJdcChecklistItem,
  type ProjectJdcEnrollment,
  type ProjectJdcProof,
  type ProjectJdcStatus,
} from "@/lib/project-jdc-store";
import type { AuthUser } from "@/lib/types";

export const SAMPLE_PER_FACILITATOR = 15;
const HISTORY_DAYS = 14;

const BIG_TASKS: Array<{ label: string; pillar: Pillar; days: number }> = [
  { label: "Finish your vision board", pillar: "mental", days: 4 },
  { label: "Open a savings account", pillar: "financial", days: 5 },
  { label: "Complete the 3-day water challenge", pillar: "physical", days: 3 },
  { label: "Write a letter to your future self", pillar: "emotional", days: 4 },
  { label: "Join a prayer or reflection group", pillar: "spiritual", days: 5 },
  { label: "Refer 1 person to Project JDC", pillar: "financial", days: 5 },
];

const NOTES: Record<Pillar, string[]> = {
  physical: ["Walked around the barangay after dinner.", "Did my workout before work.", "Here's my step counter for today."],
  emotional: ["Called my mom and we talked for an hour.", "Wrote in my journal before sleeping.", "Thanked my co-worker for helping me."],
  financial: ["Posted my story and got 12 reactions.", "Invited my cousin, she registered!", "Listed all my expenses in my notebook."],
  mental: ["Watched the whole training and took notes.", "Read 2 chapters of Rich Dad Poor Dad.", "Planned tomorrow before 9 PM."],
  spiritual: ["Prayed for 15 minutes this morning.", "Wrote 3 things I'm grateful for.", "Helped an elderly neighbor carry groceries."],
};

const SEND_BACK_NOTES = [
  "Please add a screenshot so I can check.",
  "Can you send the link to your post?",
  "Nice start! Add a photo of it, please.",
];

const AT_RISK_NOTES = ["Busy at work this week", "Hasn't replied to messages", "Lost their phone, following up"];

/** Small seeded random generator so a run is repeatable. */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(list: T[], random: () => number): T {
  return list[Math.floor(random() * list.length)];
}

function timeOn(date: string, random: () => number) {
  const hour = 7 + Math.floor(random() * 14);
  const minute = Math.floor(random() * 60);
  return new Date(`${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+08:00`).toISOString();
}

function sampleProof(pillar: Pillar, random: () => number, serial: number): ProjectJdcProof {
  const roll = random();
  if (roll < 0.15) return emptyProof();
  return {
    note: pick(NOTES[pillar], random),
    links: roll < 0.55 ? [`https://example.com/project-jdc/sample-proof/${pillar}-${serial}`] : [],
    images: [],
  };
}

export function buildSampleData({
  users,
  enrolledIds,
  today,
}: {
  users: AuthUser[];
  enrolledIds: Set<string>;
  today: string;
}) {
  const random = seeded(20261113);
  const facilitators = users.filter((user) => user.role === "facilitator").sort((a, b) => a.name.localeCompare(b.name));
  const contacts = users.filter((user) => user.role === "contact" && !enrolledIds.has(user.id));

  // Shuffle so each facilitator gets a mix, not an alphabetical slice.
  for (let i = contacts.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [contacts[i], contacts[j]] = [contacts[j], contacts[i]];
  }

  const stamp = Date.now().toString(36);
  let serial = 0;
  const nextId = (prefix: string) => `${prefix}-sample-${stamp}-${(serial += 1)}`;
  const enrollments: ProjectJdcEnrollment[] = [];
  const items: ProjectJdcChecklistItem[] = [];

  function addItem(input: {
    studentId: string;
    facilitatorId: string;
    itemDate: string;
    dueDate?: string;
    label: string;
    pillar: Pillar;
    diligence: number;
  }) {
    const lastDay = input.dueDate ?? input.itemDate;
    const chance = input.itemDate === today ? input.diligence * 0.4 : lastDay < today ? input.diligence : input.diligence * 0.6;
    const id = nextId("pji");
    let studentDone = random() < chance;
    let facilitatorApproved = false;
    let reviewNote = "";
    let doneDate: string | null = null;

    if (studentDone) {
      doneDate = input.dueDate ? addDaysIso(input.itemDate, Math.floor(random() * 3)) : input.itemDate;
      if (doneDate > today) doneDate = today;
      const daysAgo = Math.round((Date.parse(today) - Date.parse(doneDate)) / 86_400_000);
      // Older work is mostly checked; the last day or two is waiting for the facilitator.
      facilitatorApproved = daysAgo >= 2 ? random() < 0.96 : daysAgo === 1 ? random() < 0.6 : false;
      if (!facilitatorApproved && random() < 0.08) {
        studentDone = false;
        reviewNote = pick(SEND_BACK_NOTES, random);
      }
    }

    const approvedOn = doneDate && addDaysIso(doneDate, 1) <= today ? addDaysIso(doneDate, 1) : today;
    items.push({
      id,
      studentId: input.studentId,
      facilitatorId: input.facilitatorId,
      itemDate: input.itemDate,
      dueDate: input.dueDate ?? null,
      label: input.label,
      category: input.pillar,
      studentDone,
      studentDoneAt: studentDone && doneDate ? timeOn(doneDate, random) : null,
      facilitatorApproved,
      approvedAt: facilitatorApproved ? timeOn(approvedOn, random) : null,
      proof: studentDone ? sampleProof(input.pillar, random, serial) : emptyProof(),
      reviewNote,
      isSample: true,
      createdAt: new Date(`${input.itemDate}T06:00:00+08:00`).toISOString(),
    });
  }

  facilitators.forEach((facilitator, facilitatorIndex) => {
    const mine = contacts.splice(0, SAMPLE_PER_FACILITATOR);
    const weekTask = BIG_TASKS[facilitatorIndex % BIG_TASKS.length];
    const lateTask = BIG_TASKS[(facilitatorIndex + 3) % BIG_TASKS.length];

    mine.forEach((student, studentIndex) => {
      const roll = random();
      const status: ProjectJdcStatus = roll < 0.14 ? "at_risk" : roll < 0.2 ? "inactive" : "active";
      const diligence = status === "inactive" ? 0.08 : status === "at_risk" ? 0.35 : 0.6 + random() * 0.35;
      const startDate = addDaysIso(today, -(3 + Math.floor(random() * 22)));
      const base = { studentId: student.id, facilitatorId: facilitator.id, diligence };

      enrollments.push({
        id: nextId("enr"),
        studentId: student.id,
        facilitatorId: facilitator.id,
        startDate,
        status,
        notes: status === "at_risk" ? pick(AT_RISK_NOTES, random) : "",
        isSample: true,
        createdAt: new Date(`${startDate}T06:00:00+08:00`).toISOString(),
      });

      // Three daily tasks that rotate through all five areas.
      const historyStart = addDaysIso(today, -(HISTORY_DAYS - 1));
      const firstDay = startDate > historyStart ? startDate : historyStart;
      for (let date = firstDay, dayIndex = 0; date <= today; date = addDaysIso(date, 1), dayIndex += 1) {
        // Inactive students stopped getting tasks after their first few days.
        if (status === "inactive" && dayIndex > 4) break;
        for (let slot = 0; slot < 3; slot += 1) {
          const pillar = PILLARS[(dayIndex + studentIndex + slot * 2) % PILLARS.length];
          const ideas = TASK_IDEAS[pillar];
          addItem({ ...base, itemDate: date, label: ideas[(dayIndex + slot) % ideas.length], pillar });
        }
      }

      // Bigger tasks with deadlines: one due later this week, one that was due yesterday.
      addItem({
        ...base,
        itemDate: addDaysIso(today, -1),
        dueDate: addDaysIso(today, weekTask.days - 1),
        label: weekTask.label,
        pillar: weekTask.pillar,
      });
      const lateStart = addDaysIso(today, -lateTask.days - 1);
      if (startDate <= lateStart) {
        addItem({ ...base, itemDate: lateStart, dueDate: addDaysIso(today, -1), label: lateTask.label, pillar: lateTask.pillar });
      }
    });
  });

  return { enrollments, items, facilitatorCount: facilitators.length, studentCount: enrollments.length };
}
