import { getResolvedIntegrationSettings } from "@/lib/integrations-store";

export type GhlContactInput = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  bestDescribesYou?: string;
  facebookProfileUrl?: string;
  facebookPhotoUrl?: string;
  source?: string;
  tags?: string[];
};

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] || name,
    lastName: parts.slice(1).join(" "),
  };
}

export async function syncContactToGhl(input: GhlContactInput) {
  const settings = await getResolvedIntegrationSettings();
  const token = settings.ghlApiKey;
  const locationId = settings.ghlLocationId;

  if (!token || !locationId) {
    return { skipped: true as const };
  }

  const { firstName, lastName } = splitName(input.name);
  const tags = Array.from(
    new Set(
      [
        "JDC Elite Society",
        "Website",
        input.source ?? "Website registration",
        input.bestDescribesYou ?? "",
        ...(input.tags ?? []),
      ].filter(Boolean),
    ),
  );

  const body = {
    locationId,
    firstName,
    lastName,
    email: input.email,
    phone: input.phone || undefined,
    dateOfBirth: input.dateOfBirth || undefined,
    address1: input.address || undefined,
    city: input.city || undefined,
    website: input.facebookProfileUrl || undefined,
    source: input.source || "JDC Elite Society website",
    tags,
    customFields: [
      input.company ? { key: "company", field_value: input.company } : null,
      input.bestDescribesYou
        ? { key: "best_describes_you", field_value: input.bestDescribesYou }
        : null,
      input.facebookPhotoUrl
        ? { key: "facebook_profile_picture", field_value: input.facebookPhotoUrl }
        : null,
      input.facebookProfileUrl
        ? { key: "facebook_profile", field_value: input.facebookProfileUrl }
        : null,
    ].filter(Boolean),
  };

  try {
    const response = await fetch("https://services.leadconnectorhq.com/contacts/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("GHL contact sync failed", response.status, detail);
      return { skipped: false as const, ok: false as const };
    }

    return { skipped: false as const, ok: true as const };
  } catch (error) {
    console.error("GHL contact sync error", error);
    return { skipped: false as const, ok: false as const };
  }
}
