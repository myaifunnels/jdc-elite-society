import { renderEmailTemplate } from "@/lib/email-templates-store";
import { sendEmail } from "@/lib/mail";
import { grantInstantUniversityAccess } from "@/lib/member-access";
import { sendSms } from "@/lib/sms";
import { renderTemplate } from "@/lib/sms-templates";
import { getSmsTemplateBody } from "@/lib/sms-templates-store";
import { siteUrl } from "@/lib/site";
import { formatWebinarDateLabel, formatWebinarTimeLabel, type WebinarRecord } from "@/lib/webinars";

/** Sent once, right when a registration is confirmed for any webinar — the "you're in" message
 * with that webinar's own date, time, and Zoom link. Uses the single "webinar_registration_confirmed"
 * template (Dashboard > Automation > Webinars), so every future webinar automatically gets this
 * confirmation with no extra setup. */
async function notifyWebinarRegistrationConfirmed(
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

/** Sent the instant a webinar registration attempt matches an existing account — this fires
 * immediately, whether or not the visitor ever notices the in-page "sign in" prompt or completes
 * it, so they always get told (by email and text, and it lands in their dashboard Inbox) that
 * they need to sign in with the temporary password to confirm their seat. */
export async function notifyExistingAccountWebinarSignin(
  webinar: WebinarRecord,
  registrant: { name: string; email: string; phone: string },
  tempPassword: string,
) {
  const vars = { name: registrant.name, webinarTitle: webinar.title, tempPassword, siteUrl };

  const [smsBody, email] = await Promise.all([
    getSmsTemplateBody("webinar_existing_account"),
    renderEmailTemplate("webinar_existing_account", vars),
  ]);

  await Promise.allSettled([
    registrant.phone
      ? sendSms({ to: registrant.phone, body: renderTemplate(smsBody, vars), name: registrant.name, email: registrant.email })
      : Promise.resolve(),
    registrant.email ? sendEmail({ to: registrant.email, subject: email.subject, html: email.html }) : Promise.resolve(),
  ]);
}

/**
 * Runs everything a confirmed webinar registration should trigger: University/community access
 * when this webinar has it turned on (every such registrant gets the same standing as a paid
 * Mastermind buyer — this grants membership on the external community platform via GHL and flips
 * paymentVerified locally, see src/lib/member-access.ts), plus the webinar's own
 * registration-confirmed SMS/email with its date, time, and Zoom link, sent either way.
 * `notify: false` on the access grant avoids also sending the generic "University is open"
 * message right alongside the webinar-specific one.
 */
export async function confirmWebinarRegistration(
  webinar: WebinarRecord,
  registrant: { name: string; email: string; phone: string },
) {
  await Promise.allSettled([
    webinar.grantsUniversityAccess
      ? grantInstantUniversityAccess({
          name: registrant.name,
          email: registrant.email,
          phone: registrant.phone,
          source: `Webinar registration · ${webinar.title}`,
          extraTags: ["Webinar registrant"],
          notify: false,
        })
      : Promise.resolve(),
    notifyWebinarRegistrationConfirmed(webinar, registrant),
  ]);
}
