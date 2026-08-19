"use server";

import { revalidatePath } from "next/cache";

import { hasAccess } from "@/lib/access";
import { getContact, setContactTags } from "@/lib/crm-store";
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
  revalidatePath("/dashboard/contacts");
  revalidatePath(`/dashboard/contacts/${contactId}`);
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
  revalidatePath("/dashboard/contacts");
  revalidatePath(`/dashboard/contacts/${contactId}`);
  return result.ok ? { tags: result.tags } : { error: result.error };
}
