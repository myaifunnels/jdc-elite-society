import { lookupGhlContact, sendGhlSms, syncContactToGhl } from "@/lib/ghl";
import { toE164Phone } from "@/lib/identity";
import { isTextBeeReady } from "@/lib/integrations";
import { getResolvedIntegrationSettings } from "@/lib/integrations-store";

export function notifyPhone() {
  return toE164Phone(process.env.NOTIFY_PHONE || "+639569448114");
}

async function sendTextBeeSms(to: string, body: string) {
  const settings = await getResolvedIntegrationSettings();
  if (!isTextBeeReady(settings)) {
    return { sent: false as const, skipped: true as const };
  }

  try {
    const response = await fetch(
      `https://api.textbee.dev/api/v1/gateway/devices/${settings.textbeeDeviceId}/send-sms`,
      {
        method: "POST",
        headers: {
          "x-api-key": settings.textbeeApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipients: [to], message: body }),
      },
    );

    if (!response.ok) {
      console.error("TextBee SMS failed", response.status, await response.text());
      return { sent: false as const, skipped: false as const };
    }

    return { sent: true as const, skipped: false as const };
  } catch (error) {
    console.error("TextBee SMS error", error);
    return { sent: false as const, skipped: false as const };
  }
}

async function sendTwilioSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM?.trim();
  if (!sid || !token || !from) {
    return { sent: false as const, skipped: true as const };
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });

  if (!response.ok) {
    console.error("Twilio SMS failed", response.status, await response.text());
    return { sent: false as const, skipped: false as const };
  }

  return { sent: true as const, skipped: false as const };
}

async function ensureGhlContactId(name: string, email: string, phone: string) {
  const existing = await lookupGhlContact(email, phone);
  if (existing?.id) {
    return existing.id;
  }
  const synced = await syncContactToGhl({
    name,
    email,
    phone,
    source: "SMS notification",
    tags: ["Notification"],
  });
  return synced.contactId;
}

export async function sendSms(input: { to: string; body: string; name?: string; email?: string }) {
  const to = toE164Phone(input.to);
  if (!to) {
    return { sent: false as const };
  }

  const contactId = await ensureGhlContactId(input.name || to, input.email || `${to.replace(/\D/g, "")}@sms.coachjdc.org`, to);
  if (contactId) {
    const ghl = await sendGhlSms(contactId, input.body);
    if (ghl.ok) {
      return { sent: true as const };
    }
  }

  const textbee = await sendTextBeeSms(to, input.body);
  if (textbee.sent) {
    return { sent: true as const };
  }

  const twilio = await sendTwilioSms(to, input.body);
  if (twilio.sent) {
    return { sent: true as const };
  }

  console.info(`SMS skipped: ${to} :: ${input.body}`);
  return { sent: false as const };
}
