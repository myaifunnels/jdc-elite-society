import { renderEmailTemplate } from "@/lib/email-templates-store";
import { sendEmail } from "@/lib/mail";
import { sendSms } from "@/lib/sms";
import { renderTemplate, type SmsTemplateKey } from "@/lib/sms-templates";
import { getSmsTemplateBody } from "@/lib/sms-templates-store";
import { siteUrl } from "@/lib/site";
import { formatWebinarDateLabel, formatWebinarTimeLabel, type WebinarRecord } from "@/lib/webinars";
import { listWebinars } from "@/lib/webinars-store";
import { listRegistrants, markReminderSent, type WebinarRegistrant } from "@/lib/webinar-registrants-store";

type Stage = "3d" | "2d" | "dayof" | "start";

const STAGE_ORDER: Stage[] = ["3d", "2d", "dayof", "start"];

const STAGE_KEYS: Record<Stage, SmsTemplateKey> = {
  "3d": "webinar_reminder_3d",
  "2d": "webinar_reminder_2d",
  dayof: "webinar_reminder_dayof",
  start: "webinar_reminder_start",
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

/** The "day of" reminder fires at 9:00 AM Manila time on the webinar's calendar day (Manila
 * observes no DST, so a fixed +8:00 offset is always correct — same convention used for the
 * admin webinar form's datetime round-trip). Falls back to 1 hour before start if that webinar
 * is scheduled earlier than 9 AM, so the reminder never lands after the event begins. */
function dayOfReminderTime(start: Date) {
  const manilaMs = start.getTime() + MANILA_OFFSET_MS;
  const manilaMidnightMs = Math.floor(manilaMs / DAY_MS) * DAY_MS;
  const nineAm = new Date(manilaMidnightMs - MANILA_OFFSET_MS + 9 * 60 * 60 * 1000);
  return nineAm.getTime() < start.getTime() ? nineAm : new Date(start.getTime() - 60 * 60 * 1000);
}

function stageTargets(webinar: WebinarRecord): Record<Stage, Date> | null {
  const start = new Date(webinar.scheduledAt);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  return {
    "3d": new Date(start.getTime() - 3 * DAY_MS),
    "2d": new Date(start.getTime() - 2 * DAY_MS),
    dayof: dayOfReminderTime(start),
    start,
  };
}

async function sendStage(webinar: WebinarRecord, stage: Stage, registrant: WebinarRegistrant) {
  const vars = {
    name: registrant.name,
    webinarTitle: webinar.title,
    dateLabel: formatWebinarDateLabel(webinar.scheduledAt),
    timeLabel: formatWebinarTimeLabel(webinar.scheduledAt),
    zoomLink: webinar.zoomLink || siteUrl,
    siteUrl,
  };
  const key = STAGE_KEYS[stage];

  const [smsBody, email] = await Promise.all([getSmsTemplateBody(key), renderEmailTemplate(key, vars)]);

  await Promise.allSettled([
    registrant.phone
      ? sendSms({ to: registrant.phone, body: renderTemplate(smsBody, vars), name: registrant.name, email: registrant.email })
      : Promise.resolve(),
    registrant.email ? sendEmail({ to: registrant.email, subject: email.subject, html: email.html }) : Promise.resolve(),
  ]);
  await markReminderSent(registrant.id, stage);
}

/**
 * Sweeps every webinar's confirmed registrants and sends whichever reminder stage (3 days
 * before, 2 days before, morning-of, or start time) is currently due and hasn't already gone
 * out. Safe to call repeatedly/concurrently — each stage only ever sends once per registrant,
 * guarded by webinar_registrants.reminders_sent. New webinars need no extra setup: every stage's
 * timing and content derive from that webinar's own scheduledAt/zoomLink/title, so the same four
 * reminders apply automatically to every webinar as soon as it's created.
 *
 * Called on an interval from instrumentation.ts (see src/instrumentation.ts) so this "just
 * works" in production with no external cron to configure. Also reachable via
 * /api/cron/webinar-reminders for an external scheduler or manual trigger.
 */
export async function sendDueWebinarReminders() {
  const webinars = await listWebinars();
  const now = Date.now();
  let sent = 0;
  let failed = 0;

  for (const webinar of webinars) {
    const targets = stageTargets(webinar);
    if (!targets) {
      continue;
    }

    const startMs = new Date(webinar.scheduledAt).getTime();
    let registrants: WebinarRegistrant[] | null = null;

    for (const stage of STAGE_ORDER) {
      const targetMs = targets[stage].getTime();
      if (now < targetMs) {
        continue;
      }

      // Never send a pre-event reminder after the event already started. The "starting now"
      // reminder gets its own short window so a long outage doesn't blast a stale "starting
      // now" message hours later.
      const cutoffMs = stage === "start" ? startMs + 2 * 60 * 60 * 1000 : startMs;
      if (now >= cutoffMs) {
        continue;
      }

      registrants ??= (await listRegistrants(webinar.id)).filter((item) => item.status === "confirmed");
      if (registrants.length === 0) {
        continue;
      }

      for (const registrant of registrants) {
        if (registrant.remindersSent.includes(stage)) {
          continue;
        }
        try {
          await sendStage(webinar, stage, registrant);
          sent += 1;
        } catch (error) {
          failed += 1;
          console.error(`Failed to send webinar ${stage} reminder`, webinar.id, registrant.id, error);
        }
      }
    }
  }

  return { sent, failed };
}
