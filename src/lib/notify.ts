import { mastermindOffer } from "@/data/mastermind-offer";
import { notifyAdminsOfPurchase } from "@/lib/activity-notify";
import { renderEmailTemplate } from "@/lib/email-templates-store";
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
  const tagsHtml = input.tags.map((tag) => `<li>${tag}</li>`).join("");
  const receiptHtml = input.receiptUrl ? `<a href="${input.receiptUrl}">Open receipt</a>` : "Filename only";

  const [buyerEmail, teamEmail, buyerSmsBody, teamSmsBody] = await Promise.all([
    renderEmailTemplate("mastermind_purchase_buyer", {
      name: input.name,
      price: input.priceLabel,
      communityUrl: mastermindOffer.communityUrl,
      supportEmail: mastermindOffer.support.email,
      supportPhone: mastermindOffer.support.phone,
    }),
    renderEmailTemplate("mastermind_purchase_team", {
      name: input.name,
      email: input.email,
      phone: input.phone,
      paymentMethod: input.paymentMethod,
      price: input.priceLabel,
      couponCode: input.couponCode || "None",
      receiptHtml,
      tagsHtml,
      contactsUrl,
      eliteUrl: eliteSiteUrl,
    }),
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
    sendEmail({ to: input.email, subject: buyerEmail.subject, html: buyerEmail.html, replyTo: mastermindOffer.support.email }),
    sendEmail({ to: notifyEmails(), subject: teamEmail.subject, html: teamEmail.html, replyTo: input.email }),
    sendSms({ to: input.phone, body: buyerSms, name: input.name, email: input.email }),
    sendSms({
      to: notifyPhone(),
      body: teamSms,
      name: "JDC Team Alerts",
      email: notifyEmails()[0] || mastermindOffer.support.email,
    }),
    notifyAdminsOfPurchase({
      title: `Mastermind payment · ${input.name}`,
      body: `${input.priceLabel} via ${input.paymentMethod}`,
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
  const tagsHtml = input.tags.map((tag) => `<li>${tag}</li>`).join("");
  const receiptHtml = input.receiptUrl ? `<a href="${input.receiptUrl}">Open receipt</a>` : "Filename only";
  const formatLabel = input.coachingMode === "in-person" ? "Face-to-Face" : "Online";
  const hoursLabel = `${input.coachingHours} ${formatLabel.toLowerCase()} hour${input.coachingHours === 1 ? "" : "s"}`;

  const [buyerEmail, teamEmail, buyerSmsBody, teamSmsBody] = await Promise.all([
    renderEmailTemplate("coaching_offer_buyer", {
      name: input.name,
      price: input.priceLabel,
      hours: hoursLabel,
      supportEmail: mastermindOffer.support.email,
      supportPhone: mastermindOffer.support.phone,
    }),
    renderEmailTemplate("coaching_offer_team", {
      name: input.name,
      email: input.email,
      phone: input.phone,
      format: `${formatLabel} · ${hoursLabel}`,
      paymentMethod: input.paymentMethod,
      price: input.priceLabel,
      receiptHtml,
      tagsHtml,
      contactsUrl,
    }),
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
    sendEmail({ to: input.email, subject: buyerEmail.subject, html: buyerEmail.html, replyTo: mastermindOffer.support.email }),
    sendEmail({ to: notifyEmails(), subject: teamEmail.subject, html: teamEmail.html, replyTo: input.email }),
    sendSms({ to: input.phone, body: buyerSms, name: input.name, email: input.email }),
    sendSms({
      to: notifyPhone(),
      body: teamSms,
      name: "JDC Team Alerts",
      email: notifyEmails()[0] || mastermindOffer.support.email,
    }),
    notifyAdminsOfPurchase({
      title: `Coaching add-on · ${input.name}`,
      body: `${input.priceLabel} · ${formatLabel}`,
    }),
  ]);
}

export async function notifyPaymentApproved(input: { id?: string; name: string; email: string; phone: string }) {
  const { notifyMemberPaymentDecision } = await import("@/lib/activity-notify");
  const body = renderTemplate(await getSmsTemplateBody("payment_approved"), { name: input.name });
  await Promise.allSettled([
    sendSms({ to: input.phone, body, name: input.name, email: input.email }),
    notifyMemberPaymentDecision({ ...input, approved: true }),
  ]);
}

export async function notifyPaymentRejected(input: { id?: string; name: string; email: string; phone: string }) {
  const { notifyMemberPaymentDecision } = await import("@/lib/activity-notify");
  const body = renderTemplate(await getSmsTemplateBody("payment_rejected"), { name: input.name });
  await Promise.allSettled([
    sendSms({ to: input.phone, body, name: input.name, email: input.email }),
    notifyMemberPaymentDecision({ ...input, approved: false }),
  ]);
}
