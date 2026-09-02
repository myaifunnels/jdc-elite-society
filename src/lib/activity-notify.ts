import { mastermindOffer } from "@/data/mastermind-offer";
import { listAllUsers } from "@/lib/auth-store";
import { notifyEmails, sendEmail } from "@/lib/mail";
import { createNotifications } from "@/lib/notification-store";
import { notifyPhone, sendSms } from "@/lib/sms";
import { renderTemplate, type SmsTemplateKey } from "@/lib/sms-templates";
import { getSmsTemplateBody } from "@/lib/sms-templates-store";
import { siteUrl } from "@/lib/site";

type Person = { id?: string; name: string; email: string; phone?: string };

export async function listActiveAdmins() {
  const users = await listAllUsers();
  return users.filter((user) => user.role === "admin" && user.active);
}

export async function sendTemplatedSms(
  key: SmsTemplateKey,
  vars: Record<string, string>,
  to: string,
  person?: { name?: string; email?: string },
) {
  const body = renderTemplate(await getSmsTemplateBody(key), vars);
  if (!to.trim() || !body.trim()) {
    return { sent: false as const };
  }
  return sendSms({
    to,
    body,
    name: person?.name,
    email: person?.email,
  });
}

export async function sendTeamSms(key: SmsTemplateKey, vars: Record<string, string>) {
  return sendTemplatedSms(key, vars, notifyPhone(), {
    name: "JDC Team Alerts",
    email: notifyEmails()[0] || mastermindOffer.support.email,
  });
}

export async function notifyAdminsInApp(input: { title: string; body: string; href: string; kind: string }) {
  const admins = await listActiveAdmins();
  await createNotifications(
    admins.map((admin) => admin.id),
    input,
  );
}

export async function notifyPasswordReset(input: {
  name: string;
  email: string;
  phone: string;
  code: string;
  resetUrl: string;
}) {
  await Promise.allSettled([
    sendEmail({
      to: input.email,
      subject: "Reset your JDC Elite Society password",
      html: `
        <p>Hi ${input.name.split(" ")[0] || "there"},</p>
        <p>Use this link to choose a new password. It expires in one hour.</p>
        <p><a href="${input.resetUrl}">Reset password</a></p>
        <p>Or enter this code on the reset page: <strong>${input.code}</strong></p>
        <p>If you did not ask for this, you can ignore the message.</p>
        <p>${siteUrl}</p>
      `,
    }),
    input.phone
      ? sendTemplatedSms("password_reset", { name: input.name, code: input.code }, input.phone, input)
      : Promise.resolve(),
  ]);
}

export async function notifyUniversityWelcome(input: Person) {
  await Promise.allSettled([
    sendEmail({
      to: input.email,
      subject: "Your JDC Elite Society University access is open",
      html: `
        <p>Hi ${input.name.split(" ")[0] || "there"},</p>
        <p>Your University access is on. Open JDC Mastermind Sessions 1 and 2 here:</p>
        <p><a href="${siteUrl}/dashboard/university">${siteUrl}/dashboard/university</a></p>
        <p>Sign in with <strong>${input.email}</strong>. If you have not set a password yet, use Forgot password on the sign-in page.</p>
        <p>Community: <a href="https://community.coachjdc.org">community.coachjdc.org</a></p>
      `,
    }),
    input.phone
      ? sendTemplatedSms("university_welcome", { name: input.name }, input.phone, input)
      : Promise.resolve(),
    input.id
      ? createNotifications([input.id], {
          title: "University is open",
          body: "Mastermind Sessions 1 and 2 are ready in your dashboard.",
          href: "/dashboard/university",
          kind: "university",
        })
      : Promise.resolve(),
  ]);
}

export async function notifySupportTicketOpened(input: {
  member: Person;
  subject: string;
  category: string;
  preview: string;
  ticketId: string;
}) {
  const href = `/dashboard/support?ticket=${encodeURIComponent(input.ticketId)}`;
  const preview = input.preview.slice(0, 140);
  await Promise.allSettled([
    sendTemplatedSms(
      "support_ticket_member",
      { name: input.member.name, subject: input.subject },
      input.member.phone ?? "",
      input.member,
    ),
    sendTeamSms("support_ticket_team", {
      name: input.member.name,
      subject: input.subject,
      category: input.category,
    }),
    sendEmail({
      to: input.member.email,
      subject: `We received your support request: ${input.subject}`,
      html: `<p>Hi ${input.member.name},</p><p>We received <strong>${input.subject}</strong>.</p><p>${preview}</p><p><a href="${siteUrl}${href}">Open Support</a></p>`,
    }),
    sendEmail({
      to: notifyEmails(),
      subject: `New support ticket · ${input.member.name} · ${input.subject}`,
      html: `<p>New support ticket from ${input.member.name} (${input.member.email}).</p><p>Category: ${input.category}</p><p>${preview}</p><p><a href="${siteUrl}${href}">Open Support</a></p>`,
      replyTo: input.member.email,
    }),
    input.member.id
      ? createNotifications([input.member.id], {
          title: "Support ticket sent",
          body: input.subject,
          href,
          kind: "support",
        })
      : Promise.resolve(),
    notifyAdminsInApp({
      title: `Support: ${input.member.name}`,
      body: input.subject,
      href,
      kind: "support",
    }),
  ]);
}

export async function notifySupportReply(input: {
  member: Person;
  subject: string;
  preview: string;
  ticketId: string;
  fromAdmin: boolean;
}) {
  const href = `/dashboard/support?ticket=${encodeURIComponent(input.ticketId)}`;
  const preview = input.preview.slice(0, 140);

  if (input.fromAdmin) {
    await Promise.allSettled([
      sendTemplatedSms(
        "support_reply_member",
        { name: input.member.name, subject: input.subject, preview },
        input.member.phone ?? "",
        input.member,
      ),
      sendEmail({
        to: input.member.email,
        subject: `JDC Support replied: ${input.subject}`,
        html: `<p>Hi ${input.member.name},</p><p>Our team replied on <strong>${input.subject}</strong>.</p><p>${preview}</p><p><a href="${siteUrl}${href}">Open Support</a></p>`,
      }),
      input.member.id
        ? createNotifications([input.member.id], {
            title: "Support replied",
            body: preview,
            href,
            kind: "support",
          })
        : Promise.resolve(),
    ]);
    return;
  }

  await Promise.allSettled([
    sendTeamSms("support_reply_team", { name: input.member.name, subject: input.subject, preview }),
    sendEmail({
      to: notifyEmails(),
      subject: `Support reply · ${input.member.name} · ${input.subject}`,
      html: `<p>${input.member.name} replied on ${input.subject}.</p><p>${preview}</p><p><a href="${siteUrl}${href}">Open Support</a></p>`,
      replyTo: input.member.email,
    }),
    notifyAdminsInApp({
      title: `Reply from ${input.member.name}`,
      body: preview,
      href,
      kind: "support",
    }),
  ]);
}

export async function notifySupportStatus(input: {
  member: Person;
  subject: string;
  status: string;
  ticketId: string;
}) {
  const href = `/dashboard/support?ticket=${encodeURIComponent(input.ticketId)}`;
  await Promise.allSettled([
    sendTemplatedSms(
      "support_status_member",
      { name: input.member.name, subject: input.subject, status: input.status },
      input.member.phone ?? "",
      input.member,
    ),
    sendEmail({
      to: input.member.email,
      subject: `Your support ticket is ${input.status}`,
      html: `<p>Hi ${input.member.name},</p><p>Ticket <strong>${input.subject}</strong> is now <strong>${input.status}</strong>.</p><p><a href="${siteUrl}${href}">Open Support</a></p>`,
    }),
    input.member.id
      ? createNotifications([input.member.id], {
          title: `Ticket ${input.status}`,
          body: input.subject,
          href,
          kind: "support",
        })
      : Promise.resolve(),
  ]);
}

export async function notifyReceiptReupload(input: Person) {
  await Promise.allSettled([
    sendTeamSms("receipt_reupload_team", { name: input.name, email: input.email }),
    sendEmail({
      to: notifyEmails(),
      subject: `Receipt re-uploaded · ${input.name}`,
      html: `<p>${input.name} (${input.email}) uploaded a new Mastermind receipt.</p><p><a href="${siteUrl}/dashboard/contacts">Open Contacts</a></p>`,
      replyTo: input.email,
    }),
    notifyAdminsInApp({
      title: "New receipt uploaded",
      body: `${input.name} sent a payment receipt for review.`,
      href: "/dashboard/contacts",
      kind: "payment",
    }),
  ]);
}

export async function notifyAdminsOfPurchase(input: { title: string; body: string }) {
  await notifyAdminsInApp({
    title: input.title,
    body: input.body,
    href: "/dashboard/contacts",
    kind: "payment",
  });
}

export async function notifyMemberPaymentDecision(input: Person & { approved: boolean }) {
  const href = "/dashboard/university";
  await Promise.allSettled([
    sendEmail({
      to: input.email,
      subject: input.approved ? "Your JDC Mastermind payment is verified" : "We could not verify your receipt",
      html: input.approved
        ? `<p>Hi ${input.name},</p><p>Your payment is verified. University access is fully active.</p><p><a href="${siteUrl}${href}">Open University</a></p>`
        : `<p>Hi ${input.name},</p><p>We could not verify your receipt. University access is on hold. Open Support to send a new receipt.</p><p><a href="${siteUrl}/dashboard/support">Open Support</a></p>`,
    }),
    input.id
      ? createNotifications([input.id], {
          title: input.approved ? "Payment verified" : "Receipt needs another look",
          body: input.approved
            ? "Your Mastermind payment is verified. University is unlocked."
            : "We could not verify the receipt. Open Support to send a new one.",
          href: input.approved ? href : "/dashboard/support",
          kind: "payment",
        })
      : Promise.resolve(),
  ]);
}
