import { createLead, findLeadByEmailOrPhone } from "@/lib/crm-store";
import { createMemberAccount, findMemberByEmailOrPhone } from "@/lib/members-store";
import { TEMPORARY_MEMBER_PASSWORD } from "@/lib/auth-constants";
import { LeadInput } from "@/lib/validations";

export type InquiryResult =
  | {
      ok: true;
      duplicate: false;
      leadId: string;
      email: string;
      temporaryPassword: string;
    }
  | {
      ok: false;
      duplicate: true;
      email: string;
      redirectTo: string;
    };

export function memberLoginPath(email: string) {
  const params = new URLSearchParams({
    email,
    reason: "existing",
  });
  return `/login?${params.toString()}`;
}

export async function registerInquiry(input: LeadInput): Promise<InquiryResult> {
  const existingLead = await findLeadByEmailOrPhone(input.email, input.phone);
  const existingMember = await findMemberByEmailOrPhone(input.email, input.phone);
  const existingEmail = existingMember?.email || existingLead?.email;

  if (existingEmail) {
    if (existingLead && !existingMember) {
      await createMemberAccount({
        name: existingLead.name,
        email: existingLead.email,
        phone: existingLead.phone,
      });
    }

    return {
      ok: false,
      duplicate: true,
      email: existingEmail,
      redirectTo: memberLoginPath(existingEmail),
    };
  }

  try {
    const lead = await createLead({
      ...input,
      tags: Array.from(
        new Set(
          [...input.tags.split(",").map((tag) => tag.trim()), input.bestDescribesYou].filter(Boolean),
        ),
      ),
      source: "Website inquiry",
    });

    await createMemberAccount({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
    });

    return {
      ok: true,
      duplicate: false,
      leadId: lead.id,
      email: lead.email,
      temporaryPassword: TEMPORARY_MEMBER_PASSWORD,
    };
  } catch {
    const fallback = await findLeadByEmailOrPhone(input.email, input.phone);
    const email = fallback?.email || input.email;
    return {
      ok: false,
      duplicate: true,
      email,
      redirectTo: memberLoginPath(email),
    };
  }
}
