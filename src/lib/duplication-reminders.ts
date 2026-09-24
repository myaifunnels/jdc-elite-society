import { sendSms } from "@/lib/sms";
import { renderTemplate, type SmsTemplateKey } from "@/lib/sms-templates";
import { getSmsTemplateBody } from "@/lib/sms-templates-store";
import {
  listConfirmedDuplicationEnrollments,
  markDuplicationReminderSent,
  type DuplicationEnrollment,
} from "@/lib/duplication-enrollments-store";

/** Follow-up reminders for JDC Mastermind: Duplication Season's two live sessions. Mirrors the
 * webinar reminder sweep (see src/lib/webinar-reminders.ts) but against two fixed session times
 * instead of one per-webinar time, and only to enrollees whose payment is confirmed. Called on
 * an interval from src/instrumentation.ts, and reachable via /api/cron/duplication-reminders for
 * an external scheduler or manual trigger. */

type Stage = "5d" | "3d" | "2d" | "24h" | "3h" | "1h";

const STAGE_ORDER: Stage[] = ["5d", "3d", "2d", "24h", "3h", "1h"];

const STAGE_KEYS: Record<Stage, SmsTemplateKey> = {
  "5d": "duplication_followup_5d",
  "3d": "duplication_followup_3d",
  "2d": "duplication_followup_2d",
  "24h": "duplication_followup_24h",
  "3h": "duplication_followup_3h",
  "1h": "duplication_followup_1h",
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// 7:30 PM Manila (UTC+8) = 11:30 UTC.
type Session = { key: "session1" | "session2"; label: string; dateLabel: string; start: Date };

const SESSIONS: Session[] = [
  { key: "session1", label: "Session 1", dateLabel: "October 2", start: new Date("2026-10-02T11:30:00Z") },
  { key: "session2", label: "Session 2", dateLabel: "October 9", start: new Date("2026-10-09T11:30:00Z") },
];

const TIME_LABEL = "7:30 PM";

function stageTargets(start: Date): Record<Stage, Date> {
  const startMs = start.getTime();
  return {
    "5d": new Date(startMs - 5 * DAY_MS),
    "3d": new Date(startMs - 3 * DAY_MS),
    "2d": new Date(startMs - 2 * DAY_MS),
    "24h": new Date(startMs - 24 * HOUR_MS),
    "3h": new Date(startMs - 3 * HOUR_MS),
    "1h": new Date(startMs - 1 * HOUR_MS),
  };
}

async function sendStage(session: Session, stage: Stage, enrollee: DuplicationEnrollment) {
  const vars = {
    name: enrollee.name,
    sessionLabel: session.label,
    dateLabel: session.dateLabel,
    timeLabel: TIME_LABEL,
  };
  const key = STAGE_KEYS[stage];
  const smsBody = await getSmsTemplateBody(key);

  await sendSms({ to: enrollee.phone, body: renderTemplate(smsBody, vars), name: enrollee.name, email: enrollee.email });
  await markDuplicationReminderSent(enrollee.id, `${session.key}:${stage}`);
}

export async function sendDueDuplicationReminders() {
  const now = Date.now();
  let sent = 0;
  let failed = 0;

  const enrollees = await listConfirmedDuplicationEnrollments();
  if (enrollees.length === 0) {
    return { sent, failed };
  }

  for (const session of SESSIONS) {
    const startMs = session.start.getTime();
    const targets = stageTargets(session.start);

    for (const stage of STAGE_ORDER) {
      const targetMs = targets[stage].getTime();
      if (now < targetMs || now >= startMs) {
        continue;
      }

      for (const enrollee of enrollees) {
        if (!enrollee.phone || enrollee.remindersSent.includes(`${session.key}:${stage}`)) {
          continue;
        }
        try {
          await sendStage(session, stage, enrollee);
          sent += 1;
        } catch (error) {
          failed += 1;
          console.error(`Failed to send duplication ${session.key} ${stage} reminder`, enrollee.id, error);
        }
      }
    }
  }

  return { sent, failed };
}
