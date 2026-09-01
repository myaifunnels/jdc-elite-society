import { TEMPORARY_MEMBER_PASSWORD } from "@/lib/auth-constants";
import {
  createUser,
  findUserByEmail,
  findUserByEmailOrPhone,
  issueTemporaryPassword,
  setMemberPaymentVerified,
} from "@/lib/auth-store";
import { formatInternationalPhone } from "@/lib/countries";
import { createLead } from "@/lib/crm-store";
import { grantCommunityAndMastermindAccess } from "@/lib/ghl-community";
import { toE164Phone } from "@/lib/identity";
import { sendEmail } from "@/lib/mail";
import { sendSms } from "@/lib/sms";
import { eliteSiteUrl, siteUrl } from "@/lib/site";

const AD_REGISTRANTS = [
  {
    name: "Marvie Mariano",
    email: "mvprevail@gmail.com",
    phone: "2036069090",
    phoneCountry: "US",
  },
] as const;

export async function grantInstantUniversityAccess(input: {
  name: string;
  email: string;
  phone?: string;
  phoneCountry?: string;
  company?: string;
  source?: string;
  extraTags?: string[];
  createPortal?: boolean;
  notify?: boolean;
}) {
  const email = input.email.trim().toLowerCase();
  const phone =
    input.phoneCountry && input.phone
      ? formatInternationalPhone(input.phoneCountry, input.phone)
      : toE164Phone(input.phone ?? "");
  const community = await grantCommunityAndMastermindAccess({
    name: input.name,
    email,
    phone,
    extraTags: input.extraTags,
  });

  await createLead({
    name: input.name,
    email,
    phone: phone || input.phone || "",
    dateOfBirth: "",
    address: "",
    city: "",
    tags: community.tags,
    bestDescribesYou: "JDC Mastermind buyer",
    programInterest: "JDC Mastermind",
    source: input.source ?? "University access grant",
    ghlContactId: community.contactId,
  }).catch((error) => {
    console.error("Failed to upsert Mastermind CRM lead", error);
  });

  if (input.createPortal === false) {
    return { email, tags: community.tags, granted: community.granted, created: false };
  }

  let created = false;
  let user = await findUserByEmailOrPhone(email, phone || input.phone || "");
  if (!user) {
    await createUser({
      name: input.name,
      email,
      password: TEMPORARY_MEMBER_PASSWORD,
      role: "member",
      phone: phone || input.phone,
      phoneCountry: input.phoneCountry ?? (phone.startsWith("+1") ? "US" : "PH"),
      company: input.company ?? "JDC Mastermind",
      memberships: ["jes"],
      profileComplete: true,
      paymentVerified: true,
      passwordSet: false,
    });
    created = true;
    user = await findUserByEmail(email);
  } else if (!user.paymentVerified) {
    await setMemberPaymentVerified(user.id, true);
    user = (await findUserByEmail(email)) ?? user;
  }

  if (!user) {
    return { email, tags: community.tags, granted: community.granted, created };
  }

  if (!user.passwordSet) {
    await issueTemporaryPassword(user.id);
  }

  const shouldNotify = input.notify ?? created;
  if (shouldNotify) {
    await sendEmail({
      to: email,
      subject: "Your JDC Elite Society University access is open",
      html: `
        <p>Hi ${input.name.split(" ")[0] || "there"},</p>
        <p>Your University access is on. Open the JDC Elite Society community and JDC Mastermind Sessions 1 and 2 here:</p>
        <p><a href="${siteUrl}/dashboard/university">${siteUrl}/dashboard/university</a></p>
        <p>Sign in with <strong>${email}</strong>. If you have not set a password yet, use the temporary password <strong>${TEMPORARY_MEMBER_PASSWORD}</strong> and change it on first login.</p>
        <p>Community: <a href="https://community.coachjdc.org">community.coachjdc.org</a></p>
        <p>Offer page: <a href="${eliteSiteUrl}">${eliteSiteUrl}</a></p>
      `,
    }).catch((error) => console.error("University welcome email failed", error));

    if (phone) {
      await sendSms({
        to: phone,
        name: input.name,
        email,
        body: `JDC Elite Society: University is open. Mastermind Sessions 1 & 2 are in your dashboard. Sign in at ${siteUrl.replace("https://", "")}/login`,
      }).catch((error) => console.error("University welcome SMS failed", error));
    }
  }

  return { email, userId: user.id, tags: community.tags, granted: community.granted, created };
}

export async function provisionAdRegistrants() {
  for (const person of AD_REGISTRANTS) {
    await grantInstantUniversityAccess({
      name: person.name,
      email: person.email,
      phone: person.phone,
      phoneCountry: person.phoneCountry,
      source: "Ad registration",
      extraTags: ["Ad registrant", "JDC Mastermind"],
    });
  }
}
