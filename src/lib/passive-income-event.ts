export const PASSIVE_INCOME_EVENT_KEY = "passive-income-network-marketing-2026-09-18";
export const PASSIVE_INCOME_EVENT_TAG = "Passive Income Webinar - Sep 18 2026";
export const PASSIVE_INCOME_EVENT_TITLE = "How to Build Passive Income in Network Marketing";
export const PASSIVE_INCOME_EVENT_START = "2026-09-18T11:30:00.000Z";
export const PASSIVE_INCOME_EVENT_TIME_LABEL = "September 18, 2026 at 7:30 PM";
export const PASSIVE_INCOME_EVENT_TIME_ZONE = "Philippine Time (GMT+8)";

export const passiveIncomeAudienceOptions = [
  "I am new to network marketing",
  "I am already a network marketer",
  "I am an OFW",
  "I am an employee",
  "I am a business owner",
  "I am exploring an extra income stream",
] as const;

export type PassiveIncomeReminderKey = "three-days" | "two-days" | "event-day" | "thirty-minutes";

export type PassiveIncomeReminder = {
  key: PassiveIncomeReminderKey;
  scheduledAt: string;
  label: string;
  subject: string;
};

export const passiveIncomeReminders: PassiveIncomeReminder[] = [
  { key: "three-days", scheduledAt: "2026-09-15T11:30:00.000Z", label: "3 days to go", subject: "3 days to go: your passive income masterclass" },
  { key: "two-days", scheduledAt: "2026-09-16T11:30:00.000Z", label: "2 days to go", subject: "2 days to go: Build Passive Income in Network Marketing" },
  { key: "event-day", scheduledAt: "2026-09-18T01:00:00.000Z", label: "We go live today", subject: "We go live today at 7:30 PM" },
  { key: "thirty-minutes", scheduledAt: "2026-09-18T11:00:00.000Z", label: "We start in 30 minutes", subject: "Starting in 30 minutes: join the masterclass" },
];

export function passiveIncomeZoomUrl() {
  const value = process.env.PASSIVE_INCOME_ZOOM_URL?.trim() ?? "";
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function escapeEventHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function emailFrame(name: string, heading: string, intro: string) {
  const safeName = escapeEventHtml(name.split(" ")[0] || "there");
  const zoomUrl = passiveIncomeZoomUrl();
  const access = zoomUrl
    ? `<p style="margin:28px 0"><a href="${escapeEventHtml(zoomUrl)}" style="display:inline-block;background:#1769ff;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px">Open the Zoom room</a></p><p style="font-size:13px;color:#64748b">Keep this email private. The button above is your event access.</p>`
    : `<p style="padding:14px 16px;border-radius:12px;background:#eff6ff;color:#1e3a8a">We will email your private Zoom access before the session.</p>`;

  return `<div style="margin:0;background:#f3f6fb;padding:28px 12px;font-family:Arial,sans-serif;color:#101828"><div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dbe3ef;border-radius:20px;overflow:hidden"><div style="background:#07111f;padding:24px 28px;color:#ffffff"><div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#65a7ff">Coach JDC live masterclass</div><h1 style="font-size:28px;line-height:1.12;margin:12px 0 0">${escapeEventHtml(heading)}</h1></div><div style="padding:28px"><p>Hi ${safeName},</p><p style="font-size:16px;line-height:1.65">${intro}</p><div style="margin:22px 0;padding:18px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0"><strong>${PASSIVE_INCOME_EVENT_TIME_LABEL}</strong><br /><span style="color:#475467">${PASSIVE_INCOME_EVENT_TIME_ZONE}</span></div>${access}<p style="line-height:1.65">Come ready with a notebook and your questions. Please enter the room five minutes early.</p><p style="margin-top:26px">See you there,<br /><strong>Coach JDC and the JDC Elite Society Team</strong></p></div></div></div>`;
}

export function passiveIncomeConfirmationEmail(name: string) {
  return emailFrame(name, "You are registered", `Your seat is confirmed for <strong>${PASSIVE_INCOME_EVENT_TITLE}</strong>. We will show you a practical framework for building income that can continue beyond your daily effort.`);
}

export function passiveIncomeReminderEmail(name: string, reminder: PassiveIncomeReminder) {
  const intro = reminder.key === "thirty-minutes"
    ? `We start in 30 minutes. Open the Zoom room below and get settled for <strong>${PASSIVE_INCOME_EVENT_TITLE}</strong>.`
    : `${escapeEventHtml(reminder.label)}. Your seat is saved for <strong>${PASSIVE_INCOME_EVENT_TITLE}</strong>.`;
  return emailFrame(name, reminder.label, intro);
}

export function passiveIncomeConfirmationSms(name: string) {
  const firstName = name.split(" ")[0] || "there";
  return `Coach JDC: Hi ${firstName}, you're registered for our Passive Income masterclass on Sep 18, 7:30 PM. Check your email for access. Reply STOP to opt out.`;
}

export function passiveIncomeReminderSms(name: string, reminder: PassiveIncomeReminder) {
  const firstName = name.split(" ")[0] || "there";
  const lead = reminder.key === "thirty-minutes" ? "we start in 30 minutes" : reminder.label.toLowerCase();
  return `Coach JDC: Hi ${firstName}, ${lead}. Passive Income in Network Marketing is Sep 18 at 7:30 PM. Check your email for Zoom access. Reply STOP to opt out.`;
}
