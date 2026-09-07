/** Starts the webinar-reminder sweep loop once when the Next.js server boots, so the 3-day,
 * 2-day, day-of, and start-time reminders (see src/lib/webinar-reminders.ts) "just work" in
 * production with no external cron to configure — this app runs as a single long-lived Node
 * process on Render, not serverless functions, so a plain interval is enough. Guarded by a
 * globalThis flag since `register()` can otherwise run more than once across Next.js's dev-mode
 * module reloads. */
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const globalState = globalThis as typeof globalThis & { __webinarReminderTimer?: NodeJS.Timeout };
  if (globalState.__webinarReminderTimer) {
    return;
  }

  const { sendDueWebinarReminders } = await import("@/lib/webinar-reminders");

  const run = () => {
    sendDueWebinarReminders().catch((error) => {
      console.error("Webinar reminder sweep failed", error);
    });
  };

  run();
  globalState.__webinarReminderTimer = setInterval(run, CHECK_INTERVAL_MS);
}
