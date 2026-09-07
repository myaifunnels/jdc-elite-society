import { renderEmailTemplate } from "@/lib/email-templates-store";
import { sendEmail } from "@/lib/mail";
import { sendSms } from "@/lib/sms";
import { renderTemplate } from "@/lib/sms-templates";
import { getSmsTemplateBody } from "@/lib/sms-templates-store";
import { siteUrl } from "@/lib/site";
import { formatWebinarDateLabel, formatWebinarTimeLabel, type WebinarRecord } from "@/lib/webinars";

/** Sent once, right when a registration is confirmed for any webinar — the "you're in" message
 * with that webinar's own date, time, and Zoom link. Uses the single "webinar_registration_confirmed"
 * template (Dashboard > Automation > Webinars), so every future webinar automatically gets this
 * confirmation with no extra setup. */
export async function notifyWebinarRegistrationConfirmed(
  webinar: WebinarRecord,
  registrant: { name: string; email: string; phone: string },
) {
  const vars = {
    name: registrant.name,
    webinarTitle: webinar.title,
    dateLabel: formatWebinarDateLabel(webinar.scheduledAt),
    timeLabel: formatWebinarTimeLabel(webinar.scheduledAt),
    zoomLink: webinar.zoomLink || siteUrl,
    siteUrl,
  };

  const [smsBody, email] = await Promise.all([
    getSmsTemplateBody("webinar_registration_confirmed"),
    renderEmailTemplate("webinar_registration_confirmed", vars),
  ]);

  await Promise.allSettled([
    registrant.phone
      ? sendSms({ to: registrant.phone, body: renderTemplate(smsBody, vars), name: registrant.name, email: registrant.email })
      : Promise.resolve(),
    registrant.email ? sendEmail({ to: registrant.email, subject: email.subject, html: email.html }) : Promise.resolve(),
  ]);
}
