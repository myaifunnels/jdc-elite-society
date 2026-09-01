import { mastermindOffer } from "@/data/mastermind-offer";
import { notifyEmails, sendEmail } from "@/lib/mail";
import { eliteSiteUrl, siteUrl } from "@/lib/site";
import { notifyPhone, sendSms } from "@/lib/sms";
import { getSmsTemplateBody } from "@/lib/sms-templates-store";
import { renderTemplate } from "@/lib/sms-templates";

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

  const [buyerSmsBody, teamSmsBody] = await Promise.all([
    getSmsTemplateBody("mastermind_purchase_buyer"),
    getSmsTemplateBody("mastermind_purchase_team"),
  ]);
  const buyerSms = renderTemplate(buyerSmsBody, { name: input.name, price: input.priceLabel });
  const teamSms = renderTemplate(teamSmsBody, {
    name: input.name,
    price: input.priceLabel,
    paymentMethod: input.paymentMethod,
  });

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

  const [buyerSmsBody, teamSmsBody] = await Promise.all([
    getSmsTemplateBody("coaching_offer_buyer"),
    getSmsTemplateBody("coaching_offer_team"),
  ]);
  const buyerSms = renderTemplate(buyerSmsBody, { name: input.name, price: input.priceLabel, hours: hoursLabel });
  const teamSms = renderTemplate(teamSmsBody, {
    name: input.name,
    price: input.priceLabel,
    format: `${formatLabel} · ${hoursLabel}`,
  });

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

export async function notifyPaymentApproved(input: { name: string; email: string; phone: string }) {
  const body = renderTemplate(await getSmsTemplateBody("payment_approved"), { name: input.name });
  await sendSms({ to: input.phone, body, name: input.name, email: input.email });
}

export async function notifyPaymentRejected(input: { name: string; email: string; phone: string }) {
  const body = renderTemplate(await getSmsTemplateBody("payment_rejected"), { name: input.name });
  await sendSms({ to: input.phone, body, name: input.name, email: input.email });
}
