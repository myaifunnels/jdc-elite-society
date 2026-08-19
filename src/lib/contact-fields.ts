import { ContactCustomField, ContactFieldValue, ContactRecord } from "@/lib/types";

export function formatContactFieldValue(value: unknown): string {
  if (value == null || value === "") {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => formatContactFieldValue(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    if ("email" in value && typeof value.email === "string") {
      return value.email;
    }
    if ("phone" in value && typeof value.phone === "string") {
      return value.phone;
    }
    if ("value" in value) {
      return formatContactFieldValue(value.value);
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

export function labelFromKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function normalizeContact(contact: Omit<ContactRecord, "standardFields" | "customFields"> & {
  standardFields?: ContactFieldValue[];
  customFields?: ContactCustomField[];
}): ContactRecord {
  return {
    ...contact,
    additionalEmails: contact.additionalEmails ?? [],
    additionalPhones: contact.additionalPhones ?? [],
    standardFields: contact.standardFields ?? [],
    customFields: contact.customFields ?? [],
  };
}

export function customFieldValue(
  fields: ContactCustomField[] | undefined,
  ...keys: string[]
) {
  const matchers = keys.map((key) => key.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const field = (fields ?? []).find((item) => {
    const hay = `${item.key} ${item.label} ${item.id}`.toLowerCase().replace(/[^a-z0-9]/g, "");
    return matchers.some((matcher) => hay.includes(matcher));
  });
  return field?.value ?? "";
}

export function contactIdentityFields(contact: ContactRecord): ContactFieldValue[] {
  if (contact.standardFields?.length) {
    return contact.standardFields;
  }

  return (
    [
      ["name", contact.name],
      ["email", contact.email],
      ["phone", contact.phone],
      ["dateOfBirth", contact.dateOfBirth],
      ["address", contact.address],
      ["city", contact.city],
      ["state", contact.state],
      ["postalCode", contact.postalCode],
      ["country", contact.country],
      ["companyName", contact.companyName],
      ["website", contact.website],
      ["timezone", contact.timezone],
      ["source", contact.source],
      ["assignedTo", contact.assignedTo],
      ["assignedPartner", contact.assignedPartner],
      ["facebookProfileUrl", contact.facebookProfileUrl],
    ] satisfies Array<[string, string | undefined]>
  )
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([key, value]) => ({
      key,
      label: labelFromKey(key),
      value,
    }));
}
