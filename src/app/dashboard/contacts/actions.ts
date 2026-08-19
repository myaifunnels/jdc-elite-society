"use server";

import { revalidatePath } from "next/cache";

import { hasAccess } from "@/lib/access";
import { parseAffiliatePrograms } from "@/lib/affiliate";
import { upsertProfile } from "@/lib/affiliate-store";
import { findUserByEmail, setAffiliatePrograms } from "@/lib/auth-store";
import { getContact, setContactAffiliateTag, setContactTags } from "@/lib/crm-store";
import { normalizeTag, uniqueTags } from "@/lib/tags";
import { requireCapability } from "@/lib/session";

export async function addContactTag(contactId: string, tag: string) {
  const { user, access } = await requireCapability("contacts.tags");
  const viewer = { ...user, seeAllContacts: hasAccess(access, "contacts.all") };
  const contact = await getContact(viewer, contactId);
  if (!contact) {
    return { error: "Contact not found." };
  }

  const result = await setContactTags(viewer, contactId, uniqueTags([...contact.tags, normalizeTag(tag)]));
  await syncAffiliateFromContact(contact.email, result.ok ? result.tags : contact.tags);
  revalidatePath("/dashboard/contacts");
  revalidatePath(`/dashboard/contacts/${contactId}`);
  revalidatePath("/dashboard/partnership", "layout");
  return result.ok ? { tags: result.tags } : { error: result.error };
}

export async function removeContactTag(contactId: string, tag: string) {
  const { user, access } = await requireCapability("contacts.tags");
  const viewer = { ...user, seeAllContacts: hasAccess(access, "contacts.all") };
  const contact = await getContact(viewer, contactId);
  if (!contact) {
    return { error: "Contact not found." };
  }

  const result = await setContactTags(
    viewer,
    contactId,
    contact.tags.filter((item) => item.toLowerCase() !== normalizeTag(tag).toLowerCase()),
  );
  await syncAffiliateFromContact(contact.email, result.ok ? result.tags : contact.tags);
  revalidatePath("/dashboard/contacts");
  revalidatePath(`/dashboard/contacts/${contactId}`);
  revalidatePath("/dashboard/partnership", "layout");
  return result.ok ? { tags: result.tags } : { error: result.error };
}

export type ContactTagState = {
  error?: string;
  success?: string;
};

async function syncAffiliateFromContact(email: string, tags: string[]) {
  const account = await findUserByEmail(email);
  if (!account) {
    return;
  }
  const programs = parseAffiliatePrograms(tags);
  await setAffiliatePrograms(account.id, programs);
  if (programs.length > 0) {
    await upsertProfile({ userId: account.id, programs, status: "active" });
  }
}

export async function toggleContactAffiliateTag(
  _prev: ContactTagState,
  formData: FormData,
): Promise<ContactTagState> {
  const { user, access } = await requireCapability("contacts.tags");
  const viewer = { ...user, seeAllContacts: hasAccess(access, "contacts.all") };
  const contactId = String(formData.get("contactId") ?? "").trim();
  const tag = String(formData.get("tag") ?? "").trim() === "jdc-partner" ? "jdc-partner" : "pioneer";
  const enabled = String(formData.get("enabled") ?? "") === "on";
  const contact = await getContact(viewer, contactId);

  if (!contact) {
    return { error: "Contact not found." };
  }

  const result = await setContactAffiliateTag(viewer, contactId, tag, enabled);
  if (!result.ok) {
    return { error: result.error };
  }

  await syncAffiliateFromContact(contact.email, result.tags);
  revalidatePath("/dashboard/contacts");
  revalidatePath(`/dashboard/contacts/${contactId}`);
  revalidatePath("/dashboard/partnership", "layout");
  return {
    success: enabled
      ? `Tagged ${contact.name} as ${tag}. Matching logins get that campaign dashboard.`
      : `Removed ${tag} from ${contact.name}.`,
  };
}
