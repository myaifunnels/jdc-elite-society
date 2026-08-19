import { siteUrl } from "@/lib/site";

function mailFrom() {
  return process.env.MAIL_FROM || process.env.RESEND_FROM || "Coach JDC <noreply@coachjdc.org>";
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const resendKey = process.env.RESEND_API_KEY?.trim();

  if (!resendKey) {
    console.info(`Password reset for ${to}: ${resetUrl}`);
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
      subject: "Reset your Coach JDC password",
      html: `<p>Use this link to choose a new password. It expires in one hour.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not ask for this, you can ignore the email.</p><p>${siteUrl}</p>`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Failed to send password reset email", response.status, detail);
    return { sent: false as const };
  }

  return { sent: true as const };
}
