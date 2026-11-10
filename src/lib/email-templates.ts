import type { SmsTemplateKey } from "@/lib/sms-templates";

/** Reuses the SMS template keys 1:1 — every automatic activity that texts someone also emails
 * them (or emails the team), so the same key identifies both the SMS and the email side of one
 * automation, keeping the Automation tab's SMS and Email lists aligned. */
export type EmailTemplateKey = SmsTemplateKey;

export type EmailTemplateDefinition = {
  key: EmailTemplateKey;
  label: string;
  description: string;
  vars: string[];
  defaultSubject: string;
  defaultHtml: string;
};

export type EmailTemplate = {
  id: string;
  key: EmailTemplateKey | null;
  label: string;
  description: string;
  vars: string[];
  subject: string;
  html: string;
  isCustom: boolean;
  updatedAt: string;
};

export const EMAIL_TEMPLATE_GROUPS: Array<{ id: string; label: string; keys: EmailTemplateKey[] }> = [
  { id: "auth", label: "Account", keys: ["password_reset", "university_welcome"] },
  {
    id: "elite",
    label: "JDC Elite Society",
    keys: [
      "mastermind_purchase_buyer",
      "mastermind_purchase_team",
      "coaching_offer_buyer",
      "coaching_offer_team",
      "payment_approved",
      "payment_rejected",
      "receipt_reupload_team",
    ],
  },
  {
    id: "support",
    label: "Support",
    keys: ["support_ticket_member", "support_ticket_team", "support_reply_member", "support_reply_team", "support_status_member"],
  },
  {
    id: "webinars",
    label: "Webinars",
    keys: [
      "webinar_registration_confirmed",
      "webinar_existing_account",
      "webinar_reminder_3d",
      "webinar_reminder_2d",
      "webinar_reminder_dayof",
      "webinar_reminder_start",
    ],
  },
];

export const EMAIL_TEMPLATE_DEFINITIONS: EmailTemplateDefinition[] = [
  {
    key: "password_reset",
    label: "Forgot password — reset link",
    description: "Sent when someone requests a password reset. Includes the reset link and a fallback code.",
    vars: ["name", "code", "resetUrl", "siteUrl"],
    defaultSubject: "Reset your JDC Elite Society password",
    defaultHtml:
      "<p>Hi {{name}},</p><p>Use this link to choose a new password. It expires in one hour.</p><p><a href=\"{{resetUrl}}\">Reset password</a></p><p>Or enter this code on the reset page: <strong>{{code}}</strong></p><p>If you did not ask for this, you can ignore the message.</p><p>{{siteUrl}}</p>",
  },
  {
    key: "university_welcome",
    label: "University access open",
    description: "Sent when University / Mastermind access is granted and a portal account is ready.",
    vars: ["name", "email", "siteUrl"],
    defaultSubject: "Your JDC Elite Society University access is open",
    defaultHtml:
      "<p>Hi {{name}},</p><p>Your University access is on. Open JDC Mastermind Sessions 1 and 2 here:</p><p><a href=\"{{siteUrl}}/dashboard/university\">{{siteUrl}}/dashboard/university</a></p><p>Sign in with <strong>{{email}}</strong>. If you have not set a password yet, use Forgot password on the sign-in page.</p><p>Community: <a href=\"https://community.coachjdc.org\">community.coachjdc.org</a></p>",
  },
  {
    key: "mastermind_purchase_buyer",
    label: "JDC Mastermind — payment received (buyer)",
    description: "Sent to the buyer the moment their Mastermind checkout is submitted.",
    vars: ["name", "price", "communityUrl", "supportEmail", "supportPhone"],
    defaultSubject: "Natanggap na namin ang iyong JDC Mastermind payment",
    defaultHtml:
      "<p>Salamat, {{name}}.</p><p>Natanggap na namin ang iyong JDC Mastermind payment ({{price}}) — <strong>bukas na agad ang iyong access</strong>, hindi mo na kailangang maghintay.</p><p>Sa background, bini-verify pa rin namin ang iyong resibo. Habang tapos na ang setup mo, makikita mo na:</p><ul><li>Access sa iyong JDC dashboard, ngayon din</li><li>Access links para sa JDC Mastermind Sessions</li><li>Invitation sa JDC Elite Society Portal ({{communityUrl}})</li></ul><p>I-check ang inbox at spam/promotions. May tanong? Message kami sa {{supportEmail}} o {{supportPhone}}.</p><p>— Coach JDC at ang JDC Elite Society Team</p>",
  },
  {
    key: "mastermind_purchase_team",
    label: "JDC Mastermind — payment received (team alert)",
    description: "Sent to the team notify inbox when a new Mastermind payment comes in. {{tagsHtml}} and {{receiptHtml}} are pre-built list/link snippets.",
    vars: ["name", "email", "phone", "paymentMethod", "price", "couponCode", "receiptHtml", "tagsHtml", "contactsUrl", "eliteUrl"],
    defaultSubject: "New Mastermind payment · {{name}} · {{price}}",
    defaultHtml:
      "<p>New JDC Mastermind payment submitted.</p><ul><li><strong>Name:</strong> {{name}}</li><li><strong>Email:</strong> {{email}}</li><li><strong>Mobile:</strong> {{phone}}</li><li><strong>Method:</strong> {{paymentMethod}}</li><li><strong>Amount:</strong> {{price}}</li><li><strong>Coupon:</strong> {{couponCode}}</li><li><strong>Receipt:</strong> {{receiptHtml}}</li></ul><p>Tags</p><ul>{{tagsHtml}}</ul><p><a href=\"{{contactsUrl}}\">Open contacts</a> &middot; <a href=\"{{eliteUrl}}\">Elite offer</a></p>",
  },
  {
    key: "coaching_offer_buyer",
    label: "1-on-1 Coaching — payment received (buyer)",
    description: "Sent to the buyer after they grab the post-checkout coaching offer.",
    vars: ["name", "price", "hours", "supportEmail", "supportPhone"],
    defaultSubject: "Natanggap na namin ang iyong 1-on-1 Coaching payment",
    defaultHtml:
      "<p>Salamat, {{name}}.</p><p>Natanggap na namin ang iyong 1-on-1 Coaching payment ({{price}}) para sa {{hours}} kasama si Coach Jayson Dela Cruz.</p><p>Bini-verify namin ang resibo sa background. Ang JDC Team ay mag-me-message sa iyo para i-schedule ang session mo.</p><p>May tanong? Message kami sa {{supportEmail}} o {{supportPhone}}.</p><p>— Coach JDC at ang JDC Elite Society Team</p>",
  },
  {
    key: "coaching_offer_team",
    label: "1-on-1 Coaching — payment received (team alert)",
    description: "Sent to the team notify inbox when a coaching add-on payment comes in.",
    vars: ["name", "email", "phone", "format", "paymentMethod", "price", "receiptHtml", "tagsHtml", "contactsUrl"],
    defaultSubject: "New Coaching add-on · {{name}} · {{price}}",
    defaultHtml:
      "<p>New 1-on-1 Coaching add-on purchase.</p><ul><li><strong>Name:</strong> {{name}}</li><li><strong>Email:</strong> {{email}}</li><li><strong>Mobile:</strong> {{phone}}</li><li><strong>Format:</strong> {{format}}</li><li><strong>Method:</strong> {{paymentMethod}}</li><li><strong>Amount:</strong> {{price}}</li><li><strong>Receipt:</strong> {{receiptHtml}}</li></ul><p>Tags</p><ul>{{tagsHtml}}</ul><p><a href=\"{{contactsUrl}}\">Open contacts</a></p>",
  },
  {
    key: "payment_approved",
    label: "Payment approved",
    description: "Sent to the buyer when an admin approves their Mastermind payment.",
    vars: ["name", "siteUrl"],
    defaultSubject: "Your JDC Mastermind payment is verified",
    defaultHtml:
      "<p>Hi {{name}},</p><p>Your payment is verified. University access is fully active.</p><p><a href=\"{{siteUrl}}/dashboard/university\">Open University</a></p>",
  },
  {
    key: "payment_rejected",
    label: "Payment rejected",
    description: "Sent to the buyer when an admin rejects their Mastermind payment.",
    vars: ["name", "siteUrl"],
    defaultSubject: "We could not verify your receipt",
    defaultHtml:
      "<p>Hi {{name}},</p><p>We could not verify your receipt. University access is on hold. Open Support to send a new receipt.</p><p><a href=\"{{siteUrl}}/dashboard/support\">Open Support</a></p>",
  },
  {
    key: "receipt_reupload_team",
    label: "Receipt re-uploaded (team alert)",
    description: "Sent to the team notify inbox when a member uploads a new payment receipt from Support.",
    vars: ["name", "email", "siteUrl"],
    defaultSubject: "Receipt re-uploaded · {{name}}",
    defaultHtml:
      "<p>{{name}} ({{email}}) uploaded a new Mastermind receipt.</p><p><a href=\"{{siteUrl}}/dashboard/contacts\">Open Contacts</a></p>",
  },
  {
    key: "support_ticket_member",
    label: "Support ticket opened (member)",
    description: "Confirms to the member that their support ticket was created.",
    vars: ["name", "subject", "preview", "url"],
    defaultSubject: "We received your support request: {{subject}}",
    defaultHtml:
      "<p>Hi {{name}},</p><p>We received <strong>{{subject}}</strong>.</p><p>{{preview}}</p><p><a href=\"{{url}}\">Open Support</a></p>",
  },
  {
    key: "support_ticket_team",
    label: "Support ticket opened (team alert)",
    description: "Sent to the team notify inbox when a customer opens a ticket.",
    vars: ["name", "email", "subject", "category", "preview", "url"],
    defaultSubject: "New support ticket · {{name}} · {{subject}}",
    defaultHtml:
      "<p>New support ticket from {{name}} ({{email}}).</p><p>Category: {{category}}</p><p>{{preview}}</p><p><a href=\"{{url}}\">Open Support</a></p>",
  },
  {
    key: "support_reply_member",
    label: "Support reply (member)",
    description: "Sent to the member when an admin replies.",
    vars: ["name", "subject", "preview", "url"],
    defaultSubject: "JDC Support replied: {{subject}}",
    defaultHtml:
      "<p>Hi {{name}},</p><p>Our team replied on <strong>{{subject}}</strong>.</p><p>{{preview}}</p><p><a href=\"{{url}}\">Open Support</a></p>",
  },
  {
    key: "support_reply_team",
    label: "Support reply (team alert)",
    description: "Sent to the team when a member replies on an open ticket.",
    vars: ["name", "subject", "preview", "url"],
    defaultSubject: "Support reply · {{name}} · {{subject}}",
    defaultHtml: "<p>{{name}} replied on {{subject}}.</p><p>{{preview}}</p><p><a href=\"{{url}}\">Open Support</a></p>",
  },
  {
    key: "support_status_member",
    label: "Support status update (member)",
    description: "Sent when an admin changes ticket status (waiting, resolved, completed).",
    vars: ["name", "subject", "status", "url"],
    defaultSubject: "Your support ticket is {{status}}",
    defaultHtml:
      "<p>Hi {{name}},</p><p>Ticket <strong>{{subject}}</strong> is now <strong>{{status}}</strong>.</p><p><a href=\"{{url}}\">Open Support</a></p>",
  },
  {
    key: "webinar_registration_confirmed",
    label: "Webinar registration confirmed",
    description: "Sent the moment someone registers for a webinar, whichever webinar it is. {{zoomLink}} and the date/time come from that webinar automatically.",
    vars: ["name", "webinarTitle", "dateLabel", "timeLabel", "zoomLink", "siteUrl"],
    defaultSubject: "You're registered: {{webinarTitle}}",
    defaultHtml:
      "<p>Hi {{name}},</p><p>You're in! <strong>{{webinarTitle}}</strong> is on <strong>{{dateLabel}}</strong> at <strong>{{timeLabel}}</strong> (Manila time).</p><p><a href=\"{{zoomLink}}\">Join on Zoom</a></p><p>We'll send you a few reminders before it starts — keep an eye on your email and phone.</p><p>{{siteUrl}}</p>",
  },
  {
    key: "webinar_existing_account",
    label: "Webinar registration — existing account found",
    description:
      "Sent the moment someone registers for a webinar using an email/phone that already has a JDC account. They must sign in to finish reserving their seat.",
    vars: ["name", "webinarTitle", "tempPassword", "siteUrl"],
    defaultSubject: "Sign in to confirm your seat: {{webinarTitle}}",
    defaultHtml:
      "<p>Hi {{name}},</p><p>You already have a JDC account, so we could not auto-register you for <strong>{{webinarTitle}}</strong> yet.</p><p>Sign in with this email and the temporary password <strong>{{tempPassword}}</strong>, then reserve your seat again on the webinar page to confirm it.</p><p><a href=\"{{siteUrl}}/login\">Sign in</a></p>",
  },
  {
    key: "webinar_reminder_3d",
    label: "Webinar reminder — 3 days before",
    description: "Sent automatically 3 days before every webinar, to every confirmed registrant.",
    vars: ["name", "webinarTitle", "dateLabel", "timeLabel", "zoomLink"],
    defaultSubject: "3 days to go: {{webinarTitle}}",
    defaultHtml:
      "<p>Hi {{name}},</p><p><strong>{{webinarTitle}}</strong> is in 3 days — <strong>{{dateLabel}}</strong> at <strong>{{timeLabel}}</strong> (Manila time).</p><p><a href=\"{{zoomLink}}\">Join on Zoom</a></p>",
  },
  {
    key: "webinar_reminder_2d",
    label: "Webinar reminder — 2 days before",
    description: "Sent automatically 2 days before every webinar, to every confirmed registrant.",
    vars: ["name", "webinarTitle", "dateLabel", "timeLabel", "zoomLink"],
    defaultSubject: "2 days to go: {{webinarTitle}}",
    defaultHtml:
      "<p>Hi {{name}},</p><p><strong>{{webinarTitle}}</strong> is in 2 days — <strong>{{dateLabel}}</strong> at <strong>{{timeLabel}}</strong> (Manila time).</p><p><a href=\"{{zoomLink}}\">Join on Zoom</a></p>",
  },
  {
    key: "webinar_reminder_dayof",
    label: "Webinar reminder — day of the webinar",
    description: "Sent automatically the morning of every webinar, to every confirmed registrant.",
    vars: ["name", "webinarTitle", "dateLabel", "timeLabel", "zoomLink"],
    defaultSubject: "Today's the day: {{webinarTitle}}",
    defaultHtml:
      "<p>Hi {{name}},</p><p>Today's the day! <strong>{{webinarTitle}}</strong> starts today at <strong>{{timeLabel}}</strong> (Manila time).</p><p><a href=\"{{zoomLink}}\">Join on Zoom</a></p>",
  },
  {
    key: "webinar_reminder_start",
    label: "Webinar reminder — starting now",
    description: "Sent automatically at the exact start time of every webinar, to every confirmed registrant.",
    vars: ["name", "webinarTitle", "timeLabel", "zoomLink"],
    defaultSubject: "{{webinarTitle}} is starting now",
    defaultHtml:
      "<p>Hi {{name}},</p><p><strong>{{webinarTitle}}</strong> is starting now.</p><p><a href=\"{{zoomLink}}\">Join on Zoom</a></p>",
  },
];

export function definitionFor(key: EmailTemplateKey) {
  return EMAIL_TEMPLATE_DEFINITIONS.find((item) => item.key === key);
}

export function isEmailTemplateKey(value: string): value is EmailTemplateKey {
  return EMAIL_TEMPLATE_DEFINITIONS.some((item) => item.key === value);
}
