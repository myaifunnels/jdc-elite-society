import { mastermindOffer } from "@/data/mastermind-offer";
import { listAllUsers } from "@/lib/auth-store";
import { renderEmailTemplate } from "@/lib/email-templates-store";
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
  const firstName = input.name.split(" ")[0] || "there";
  const { subject, html } = await renderEmailTemplate("password_reset", {
    name: firstName,
    code: input.code,
    resetUrl: input.resetUrl,
    siteUrl,
  });
  await Promise.allSettled([
    sendEmail({ to: input.email, subject, html }),
    input.phone
      ? sendTemplatedSms("password_reset", { name: input.name, code: input.code }, input.phone, input)
      : Promise.resolve(),
  ]);
}

export async function notifyUniversityWelcome(input: Person) {
  const firstName = input.name.split(" ")[0] || "there";
  const { subject, html } = await renderEmailTemplate("university_welcome", {
    name: firstName,
    email: input.email,
    siteUrl,
  });
  await Promise.allSettled([
    sendEmail({ to: input.email, subject, html }),
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
  const url = `${siteUrl}${href}`;
  const [memberEmail, teamEmail] = await Promise.all([
    renderEmailTemplate("support_ticket_member", { name: input.member.name, subject: input.subject, preview, url }),
    renderEmailTemplate("support_ticket_team", {
      name: input.member.name,
      email: input.member.email,
      subject: input.subject,
      category: input.category,
      preview,
      url,
    }),
  ]);
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
    sendEmail({ to: input.member.email, subject: memberEmail.subject, html: memberEmail.html }),
    sendEmail({ to: notifyEmails(), subject: teamEmail.subject, html: teamEmail.html, replyTo: input.member.email }),
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
  const url = `${siteUrl}${href}`;

  if (input.fromAdmin) {
    const memberEmail = await renderEmailTemplate("support_reply_member", {
      name: input.member.name,
      subject: input.subject,
      preview,
      url,
    });
    await Promise.allSettled([
      sendTemplatedSms(
        "support_reply_member",
        { name: input.member.name, subject: input.subject, preview },
        input.member.phone ?? "",
        input.member,
      ),
      sendEmail({ to: input.member.email, subject: memberEmail.subject, html: memberEmail.html }),
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

  const teamEmail = await renderEmailTemplate("support_reply_team", {
    name: input.member.name,
    subject: input.subject,
    preview,
    url,
  });
  await Promise.allSettled([
    sendTeamSms("support_reply_team", { name: input.member.name, subject: input.subject, preview }),
    sendEmail({ to: notifyEmails(), subject: teamEmail.subject, html: teamEmail.html, replyTo: input.member.email }),
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
  const url = `${siteUrl}${href}`;
  const memberEmail = await renderEmailTemplate("support_status_member", {
    name: input.member.name,
    subject: input.subject,
    status: input.status,
    url,
  });
  await Promise.allSettled([
    sendTemplatedSms(
      "support_status_member",
      { name: input.member.name, subject: input.subject, status: input.status },
      input.member.phone ?? "",
      input.member,
    ),
    sendEmail({ to: input.member.email, subject: memberEmail.subject, html: memberEmail.html }),
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
  const teamEmail = await renderEmailTemplate("receipt_reupload_team", { name: input.name, email: input.email, siteUrl });
  await Promise.allSettled([
    sendTeamSms("receipt_reupload_team", { name: input.name, email: input.email }),
    sendEmail({ to: notifyEmails(), subject: teamEmail.subject, html: teamEmail.html, replyTo: input.email }),
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
  const decisionEmail = await renderEmailTemplate(input.approved ? "payment_approved" : "payment_rejected", {
    name: input.name,
    siteUrl,
  });
  await Promise.allSettled([
    sendEmail({ to: input.email, subject: decisionEmail.subject, html: decisionEmail.html }),
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
