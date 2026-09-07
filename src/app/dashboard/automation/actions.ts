"use server";

import { revalidatePath } from "next/cache";

import { isEmailTemplateKey } from "@/lib/email-templates";
import {
  deleteEmailTemplate,
  resetEmailTemplate,
  saveEmailTemplate,
} from "@/lib/email-templates-store";
import { saveIntegrationSettings } from "@/lib/integrations-store";
import { sendEmail } from "@/lib/mail";
import { requireCapability } from "@/lib/session";
import { sendSms } from "@/lib/sms";
import { isSmsTemplateKey, renderTemplate } from "@/lib/sms-templates";
import {
  deleteSmsTemplate,
  resetSmsTemplate,
  saveSmsTemplate,
} from "@/lib/sms-templates-store";

export type AutomationFormState = { error?: string; success?: string };

/** Sample values used to preview {{vars}} when sending a test SMS or email — covers every var
 * across both template sets so any template can be test-sent without a "missing var" gap. */
const SAMPLE_VARS: Record<string, string> = {
  name: "Test Buyer",
  price: "PHP 2,000",
  paymentMethod: "GCash",
  hours: "1 online hour",
  format: "Online · 1 hour",
  code: "482193",
  subject: "Payment help",
  preview: "Need help with my receipt",
  status: "Awaiting your reply",
  category: "Payment",
  email: "member@coachjdc.org",
  resetUrl: "https://coachjdc.org/reset-password?token=sample",
  siteUrl: "https://coachjdc.org",
  url: "https://coachjdc.org/dashboard/support",
  communityUrl: "https://community.coachjdc.org",
  supportEmail: "support@coachjdc.org",
  supportPhone: "+639171234567",
  contactsUrl: "https://coachjdc.org/dashboard/contacts",
  eliteUrl: "https://elite.coachjdc.org",
  receiptHtml: "<a href=\"#\">Open receipt</a>",
  tagsHtml: "<li>Sample tag</li>",
  couponCode: "None",
  phone: "+639171234567",
};

export async function saveSmsFromNumberAction(
  _prevState: AutomationFormState,
  formData: FormData,
): Promise<AutomationFormState> {
  await requireCapability("automation");
  const smsFromNumber = String(formData.get("smsFromNumber") ?? "").trim();
  if (!smsFromNumber) {
    return { error: "Enter a from number." };
  }
  await saveIntegrationSettings({ smsFromNumber });
  revalidatePath("/dashboard/automation");
  return { success: "From number saved." };
}

export async function saveSmsTemplateAction(
  _prevState: AutomationFormState,
  formData: FormData,
): Promise<AutomationFormState> {
  await requireCapability("automation");
  const id = String(formData.get("id") ?? "").trim() || undefined;
  const rawKey = String(formData.get("key") ?? "").trim();
  const key = isSmsTemplateKey(rawKey) ? rawKey : null;
  const label = String(formData.get("label") ?? "").trim();
  const body = String(formData.get("body") ?? "");

  if (!label) {
    return { error: "Give this template a label." };
  }
  if (!body.trim()) {
    return { error: "The message body can't be empty." };
  }

  await saveSmsTemplate({ id, key, label, body });
  revalidatePath("/dashboard/automation");
  return { success: "Template saved." };
}

export async function resetSmsTemplateAction(
  _prevState: AutomationFormState,
  formData: FormData,
): Promise<AutomationFormState> {
  await requireCapability("automation");
  const key = String(formData.get("key") ?? "").trim();
  if (!isSmsTemplateKey(key)) {
    return { error: "Missing template." };
  }
  await resetSmsTemplate(key);
  revalidatePath("/dashboard/automation");
  return { success: "Template reset to the default wording." };
}

export async function deleteSmsTemplateAction(
  _prevState: AutomationFormState,
  formData: FormData,
): Promise<AutomationFormState> {
  await requireCapability("automation");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { error: "Missing template." };
  }
  await deleteSmsTemplate(id);
  revalidatePath("/dashboard/automation");
  return { success: "Template deleted." };
}

export async function sendTestSmsAction(
  _prevState: AutomationFormState,
  formData: FormData,
): Promise<AutomationFormState> {
  await requireCapability("automation");
  const to = String(formData.get("to") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!to) {
    return { error: "Enter a phone number to send the test to." };
  }
  if (!body) {
    return { error: "The message is empty." };
  }

  const rendered = renderTemplate(body, SAMPLE_VARS);

  const result = await sendSms({ to, body: rendered, name: "Test Buyer" });
  if (!result.sent) {
    return { error: "Couldn't send — check that GHL, TextBee, or Twilio is connected on the Integrations page." };
  }
  return { success: `Test text sent to ${to}.` };
}

export async function saveEmailFromAddressAction(
  _prevState: AutomationFormState,
  formData: FormData,
): Promise<AutomationFormState> {
  await requireCapability("automation");
  const emailFromAddress = String(formData.get("emailFromAddress") ?? "").trim();
  if (!emailFromAddress) {
    return { error: "Enter a from address." };
  }
  await saveIntegrationSettings({ emailFromAddress });
  revalidatePath("/dashboard/automation");
  return { success: "From address saved." };
}

export async function saveEmailTemplateAction(
  _prevState: AutomationFormState,
  formData: FormData,
): Promise<AutomationFormState> {
  await requireCapability("automation");
  const id = String(formData.get("id") ?? "").trim() || undefined;
  const rawKey = String(formData.get("key") ?? "").trim();
  const key = isEmailTemplateKey(rawKey) ? rawKey : null;
  const label = String(formData.get("label") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const html = String(formData.get("html") ?? "");

  if (!label) {
    return { error: "Give this template a label." };
  }
  if (!subject) {
    return { error: "The email needs a subject line." };
  }
  if (!html.trim()) {
    return { error: "The email body can't be empty." };
  }

  await saveEmailTemplate({ id, key, label, subject, html });
  revalidatePath("/dashboard/automation");
  return { success: "Template saved." };
}

export async function resetEmailTemplateAction(
  _prevState: AutomationFormState,
  formData: FormData,
): Promise<AutomationFormState> {
  await requireCapability("automation");
  const key = String(formData.get("key") ?? "").trim();
  if (!isEmailTemplateKey(key)) {
    return { error: "Missing template." };
  }
  await resetEmailTemplate(key);
  revalidatePath("/dashboard/automation");
  return { success: "Template reset to the default wording." };
}

export async function deleteEmailTemplateAction(
  _prevState: AutomationFormState,
  formData: FormData,
): Promise<AutomationFormState> {
  await requireCapability("automation");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { error: "Missing template." };
  }
  await deleteEmailTemplate(id);
  revalidatePath("/dashboard/automation");
  return { success: "Template deleted." };
}

export async function sendTestEmailAction(
  _prevState: AutomationFormState,
  formData: FormData,
): Promise<AutomationFormState> {
  await requireCapability("automation");
  const to = String(formData.get("to") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const html = String(formData.get("html") ?? "").trim();

  if (!to) {
    return { error: "Enter an email address to send the test to." };
  }
  if (!subject) {
    return { error: "The email needs a subject line." };
  }
  if (!html) {
    return { error: "The email body is empty." };
  }

  const result = await sendEmail({
    to,
    subject: renderTemplate(subject, SAMPLE_VARS),
    html: renderTemplate(html, SAMPLE_VARS),
  });
  if (!result.sent) {
    return { error: "Couldn't send — check that RESEND_API_KEY is configured." };
  }
  return { success: `Test email sent to ${to}.` };
}
