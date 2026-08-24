import { mastermindOffer } from "@/data/mastermind-offer";
import { notifyEmails, sendEmail } from "@/lib/mail";
import { eliteSiteUrl, siteUrl } from "@/lib/site";
import { notifyPhone, sendSms } from "@/lib/sms";

export type MastermindNotice = {
  name: string;
  email: string;
  phone: string;
  paymentMethod: string;
  priceLabel: string;
  couponCode: string;
  receiptUrl: string;
  tags: string[];
};

export async function notifyMastermindPurchase(input: MastermindNotice) {
  const contactsUrl = `${siteUrl}/dashboard/contacts`;
  const tagList = input.tags.map((tag) => `<li>${tag}</li>`).join("");

  const buyerHtml = `
    <p>Salamat, ${input.name}.</p>
    <p>Natanggap na namin ang iyong JDC Mastermind payment (${input.priceLabel}).</p>
    <p>Bini-verify namin ito ngayon. Sa loob ng 24 oras, makakatanggap ka ng email na may:</p>
    <ul>
      <li>Confirmation na approved ang iyong membership</li>
      <li>Access links para sa JDC Mastermind Sessions</li>
      <li>Invitation sa JDC Elite Society Portal (${mastermindOffer.communityUrl})</li>
    </ul>
    <p>I-check ang inbox at spam/promotions. Kung wala pa pagkatapos ng 24 oras, message kami sa ${mastermindOffer.support.email} o ${mastermindOffer.support.phone}.</p>
    <p>— Coach JDC at ang JDC Elite Society Team</p>
  `;

  const teamHtml = `
    <p>New JDC Mastermind payment submitted.</p>
    <ul>
      <li><strong>Name:</strong> ${input.name}</li>
      <li><strong>Email:</strong> ${input.email}</li>
      <li><strong>Mobile:</strong> ${input.phone}</li>
      <li><strong>Method:</strong> ${input.paymentMethod}</li>
      <li><strong>Amount:</strong> ${input.priceLabel}</li>
      <li><strong>Coupon:</strong> ${input.couponCode || "None"}</li>
      <li><strong>Receipt:</strong> ${input.receiptUrl ? `<a href="${input.receiptUrl}">Open receipt</a>` : "Filename only"}</li>
    </ul>
    <p>Tags</p>
    <ul>${tagList}</ul>
    <p><a href="${contactsUrl}">Open contacts</a> · <a href="${eliteSiteUrl}">Elite offer</a></p>
  `;

  const buyerSms = `JDC Mastermind: Natanggap namin ang iyong payment (${input.priceLabel}). I-check ang email para sa access. ${mastermindOffer.communityUrl.replace("https://", "")}`;
  const teamSms = `New JDC Mastermind payment: ${input.name} · ${input.priceLabel} · ${input.paymentMethod}. Verify receipt.`;

  await Promise.allSettled([
    sendEmail({
      to: input.email,
      subject: "Natanggap na namin ang iyong JDC Mastermind payment",
      html: buyerHtml,
      replyTo: mastermindOffer.support.email,
    }),
    sendEmail({
      to: notifyEmails(),
      subject: `New Mastermind payment · ${input.name} · ${input.priceLabel}`,
      html: teamHtml,
      replyTo: input.email,
    }),
    sendSms({ to: input.phone, body: buyerSms, name: input.name, email: input.email }),
    sendSms({
      to: notifyPhone(),
      body: teamSms,
      name: "JDC Team Alerts",
      email: notifyEmails()[0] || mastermindOffer.support.email,
    }),
  ]);
}
