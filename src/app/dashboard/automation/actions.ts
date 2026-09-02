"use server";

import { revalidatePath } from "next/cache";

import { saveIntegrationSettings } from "@/lib/integrations-store";
import { requireCapability } from "@/lib/session";
import { sendSms } from "@/lib/sms";
import { isSmsTemplateKey, renderTemplate } from "@/lib/sms-templates";
import {
  deleteSmsTemplate,
  resetSmsTemplate,
  saveSmsTemplate,
} from "@/lib/sms-templates-store";

export type AutomationFormState = { error?: string; success?: string };

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

  const rendered = renderTemplate(body, {
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
  });

  const result = await sendSms({ to, body: rendered, name: "Test Buyer" });
  if (!result.sent) {
    return { error: "Couldn't send — check that GHL, TextBee, or Twilio is connected on the Integrations page." };
  }
  return { success: `Test text sent to ${to}.` };
}
