"use server";

import { revalidatePath } from "next/cache";

import { getContact, setContactTags } from "@/lib/crm-store";
import { normalizeTag, uniqueTags } from "@/lib/tags";
import { requireRoles } from "@/lib/session";

export async function addContactTag(contactId: string, tag: string) {
  const user = await requireRoles(["admin", "partner"]);
  const contact = await getContact(user, contactId);
  if (!contact) {
    return { error: "Contact not found." };
  }

  const result = await setContactTags(user, contactId, uniqueTags([...contact.tags, normalizeTag(tag)]));
  revalidatePath("/dashboard/contacts");
  revalidatePath(`/dashboard/contacts/${contactId}`);
  return result.ok ? { tags: result.tags } : { error: result.error };
}

export async function removeContactTag(contactId: string, tag: string) {
  const user = await requireRoles(["admin", "partner"]);
  const contact = await getContact(user, contactId);
  if (!contact) {
    return { error: "Contact not found." };
  }

  const result = await setContactTags(
    user,
    contactId,
    contact.tags.filter((item) => item.toLowerCase() !== normalizeTag(tag).toLowerCase()),
  );
  revalidatePath("/dashboard/contacts");
  revalidatePath(`/dashboard/contacts/${contactId}`);
  return result.ok ? { tags: result.tags } : { error: result.error };
}
