import { siteUrl } from "@/lib/site";

function mailFrom() {
  return process.env.MAIL_FROM || process.env.RESEND_FROM || "Coach JDC <noreply@coachjdc.org>";
}

export function notifyEmails() {
  const raw = process.env.NOTIFY_EMAIL || "support@coachjdc.org,team@mail.coachjdc.org";
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function sendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const to = (Array.isArray(input.to) ? input.to : [input.to]).filter(Boolean);

  if (!resendKey) {
    console.info(`Email skipped (no RESEND_API_KEY): ${input.subject} -> ${to.join(", ")}`);
    return { sent: false as const };
  }

  if (to.length === 0) {
    return { sent: false as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: mailFrom(),
      to,
      subject: input.subject,
      html: input.html,
      reply_to: input.replyTo,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Failed to send email", response.status, detail);
    return { sent: false as const };
  }

  return { sent: true as const };
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendEmail({
    to,
    subject: "Reset your Coach JDC password",
    html: `<p>Use this link to choose a new password. It expires in one hour.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not ask for this, you can ignore the email.</p><p>${siteUrl}</p>`,
  });
}
