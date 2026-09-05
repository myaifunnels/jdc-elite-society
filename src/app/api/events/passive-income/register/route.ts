import { NextResponse } from "next/server";
import { z } from "zod";

import { addGhlContactTags, scheduleGhlMessage, syncContactToGhl } from "@/lib/ghl";
import { toE164Phone } from "@/lib/identity";
import { sendEmail } from "@/lib/mail";
import {
  PASSIVE_INCOME_EVENT_START,
  PASSIVE_INCOME_EVENT_TAG,
  PASSIVE_INCOME_EVENT_TITLE,
  passiveIncomeAudienceOptions,
  passiveIncomeConfirmationEmail,
  passiveIncomeConfirmationSms,
  passiveIncomeReminderEmail,
  passiveIncomeReminderSms,
  passiveIncomeReminders,
} from "@/lib/passive-income-event";
import { createPassiveIncomeRegistration, updatePassiveIncomeDelivery } from "@/lib/passive-income-store";
import { sendSms } from "@/lib/sms";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100),
  email: z.email("Enter a valid email address.").transform((value) => value.trim().toLowerCase()),
  phoneCountry: z.string().trim().min(1),
  phoneDial: z.string().trim().min(1),
  phoneNational: z.string().trim().min(7, "Enter a valid phone number.").max(24),
  bestDescribesYou: z.enum(passiveIncomeAudienceOptions, { message: "Choose what best describes you." }),
  consent: z.literal(true, { message: "Please agree to receive your event confirmations and reminders." }),
  website: z.string().optional().default(""),
});

async function scheduleReminders(contactId: string, name: string, email: string, phone: string) {
  const futureReminders = passiveIncomeReminders.filter((reminder) => new Date(reminder.scheduledAt).getTime() > Date.now());
  const results = await Promise.all(
    futureReminders.flatMap((reminder) => [
      scheduleGhlMessage({
        type: "Email",
        contactId,
        emailTo: email,
        subject: reminder.subject,
        html: passiveIncomeReminderEmail(name, reminder),
        message: `${reminder.label}: ${PASSIVE_INCOME_EVENT_TITLE}`,
        scheduledAt: reminder.scheduledAt,
      }),
      scheduleGhlMessage({
        type: "SMS",
        contactId,
        toNumber: phone,
        message: passiveIncomeReminderSms(name, reminder),
        scheduledAt: reminder.scheduledAt,
      }),
    ]),
  );
  return results.length > 0 && results.every((result) => result.ok);
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "We could not read that registration." }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check your details and try again." }, { status: 400 });
  }
  if (parsed.data.website) return NextResponse.json({ ok: true });
  if (Date.now() >= new Date(PASSIVE_INCOME_EVENT_START).getTime()) {
    return NextResponse.json({ error: "Registration for this live session has closed." }, { status: 410 });
  }

  const phone = toE164Phone(`${parsed.data.phoneDial}${parsed.data.phoneNational}`);
  if (!phone) return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });

  try {
    const saved = await createPassiveIncomeRegistration({
      name: parsed.data.name,
      email: parsed.data.email,
      phone,
      bestDescribesYou: parsed.data.bestDescribesYou,
    });
    if (!saved.created && saved.registration.remindersScheduledAt) {
      return NextResponse.json({ ok: true, alreadyRegistered: true, remindersScheduled: true });
    }

    const tags = [PASSIVE_INCOME_EVENT_TAG, "Event Registrant", "Network Marketing", parsed.data.bestDescribesYou];
    const synced = await syncContactToGhl({
      name: parsed.data.name,
      email: parsed.data.email,
      phone,
      bestDescribesYou: parsed.data.bestDescribesYou,
      source: "Passive Income live masterclass registration",
      tags,
    });
    if (synced.contactId) await addGhlContactTags(synced.contactId, tags);

    const remindersScheduled = synced.contactId
      ? await scheduleReminders(synced.contactId, parsed.data.name, parsed.data.email, phone)
      : false;
    await updatePassiveIncomeDelivery(saved.registration.id, { ghlContactId: synced.contactId, remindersScheduled });

    if (saved.created) {
      await Promise.allSettled([
        sendEmail({
          to: parsed.data.email,
          subject: "You're registered: Build Passive Income in Network Marketing",
          html: passiveIncomeConfirmationEmail(parsed.data.name),
          replyTo: "support@coachjdc.org",
        }),
        sendSms({ to: phone, body: passiveIncomeConfirmationSms(parsed.data.name), name: parsed.data.name, email: parsed.data.email }),
      ]);
    }

    return NextResponse.json({ ok: true, alreadyRegistered: !saved.created, remindersScheduled });
  } catch (error) {
    console.error("Passive income registration failed", error);
    return NextResponse.json({ error: "We could not complete your registration. Please try again." }, { status: 500 });
  }
}
