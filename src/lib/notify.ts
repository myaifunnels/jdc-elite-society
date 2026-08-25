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
    <p>Natanggap na namin ang iyong JDC Mastermind payment (${input.priceLabel}) — <strong>bukas na agad ang iyong access</strong>, hindi mo na kailangang maghintay.</p>
    <p>Sa background, bini-verify pa rin namin ang iyong resibo. Habang tapos na ang setup mo, makikita mo na:</p>
    <ul>
      <li>Access sa iyong JDC dashboard, ngayon din</li>
      <li>Access links para sa JDC Mastermind Sessions</li>
      <li>Invitation sa JDC Elite Society Portal (${mastermindOffer.communityUrl})</li>
    </ul>
    <p>I-check ang inbox at spam/promotions. May tanong? Message kami sa ${mastermindOffer.support.email} o ${mastermindOffer.support.phone}.</p>
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

  const buyerSms = `JDC Mastermind: Natanggap namin ang iyong payment (${input.priceLabel}). Bukas na ang access mo, ngayon din! I-check ang email. ${mastermindOffer.communityUrl.replace("https://", "")}`;
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

export type CoachingOfferNotice = {
  name: string;
  email: string;
  phone: string;
  paymentMethod: string;
  priceLabel: string;
  coachingHours: number;
  coachingMode: "online" | "in-person";
  receiptUrl: string;
  tags: string[];
};

export async function notifyCoachingOfferPurchase(input: CoachingOfferNotice) {
  const contactsUrl = `${siteUrl}/dashboard/contacts`;
  const tagList = input.tags.map((tag) => `<li>${tag}</li>`).join("");
  const formatLabel = input.coachingMode === "in-person" ? "Face-to-Face" : "Online";
  const hoursLabel = `${input.coachingHours} ${formatLabel.toLowerCase()} hour${input.coachingHours === 1 ? "" : "s"}`;

  const buyerHtml = `
    <p>Salamat, ${input.name}.</p>
    <p>Natanggap na namin ang iyong 1-on-1 Coaching payment (${input.priceLabel}) para sa ${hoursLabel} kasama si Coach Jayson Dela Cruz.</p>
    <p>Bini-verify namin ang resibo sa background. Ang JDC Team ay mag-me-message sa iyo para i-schedule ang session mo.</p>
    <p>May tanong? Message kami sa ${mastermindOffer.support.email} o ${mastermindOffer.support.phone}.</p>
    <p>— Coach JDC at ang JDC Elite Society Team</p>
  `;

  const teamHtml = `
    <p>New 1-on-1 Coaching add-on purchase.</p>
    <ul>
      <li><strong>Name:</strong> ${input.name}</li>
      <li><strong>Email:</strong> ${input.email}</li>
      <li><strong>Mobile:</strong> ${input.phone}</li>
      <li><strong>Format:</strong> ${formatLabel} · ${hoursLabel}</li>
      <li><strong>Method:</strong> ${input.paymentMethod}</li>
      <li><strong>Amount:</strong> ${input.priceLabel}</li>
      <li><strong>Receipt:</strong> ${input.receiptUrl ? `<a href="${input.receiptUrl}">Open receipt</a>` : "Filename only"}</li>
    </ul>
    <p>Tags</p>
    <ul>${tagList}</ul>
    <p><a href="${contactsUrl}">Open contacts</a></p>
  `;

  const buyerSms = `JDC Coaching: Natanggap namin ang iyong payment (${input.priceLabel}) para sa ${hoursLabel}. Mage-message kami para i-schedule.`;
  const teamSms = `New Coaching add-on: ${input.name} · ${formatLabel} · ${hoursLabel} · ${input.priceLabel}. Verify receipt.`;

  await Promise.allSettled([
    sendEmail({
      to: input.email,
      subject: "Natanggap na namin ang iyong 1-on-1 Coaching payment",
      html: buyerHtml,
      replyTo: mastermindOffer.support.email,
    }),
    sendEmail({
      to: notifyEmails(),
      subject: `New Coaching add-on · ${input.name} · ${input.priceLabel}`,
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
