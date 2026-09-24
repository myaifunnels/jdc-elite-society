/** Shared payload parsing for the S2 Duplication Checkout Form's GHL webhook actions
 * (verification, confirmed, rejected) — GHL can post either form-encoded or JSON, and the
 * contact fields can arrive flat or nested under a "contact" object depending on how the
 * workflow's custom data is configured. */

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export async function readGhlWebhookPayload(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    const payload: Record<string, unknown> = {};
    form.forEach((value, key) => {
      payload[key] = typeof value === "string" ? value : value.name;
    });
    return payload;
  }

  try {
    return asRecord(await request.json());
  } catch {
    return {};
  }
}

export function pickString(payload: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

export function checkWebhookSecret(request: Request, ...envVars: Array<string | undefined>) {
  const secret = envVars.find((value) => value?.trim())?.trim();
  if (!secret) return true;
  const header = request.headers.get("x-webhook-secret") ?? request.headers.get("authorization") ?? "";
  return header.includes(secret);
}

export function contactFromPayload(payload: Record<string, unknown>) {
  const contact = asRecord(payload.contact);
  const source = Object.keys(contact).length ? contact : payload;

  const email = pickString(source, "email").toLowerCase();
  const firstName = pickString(source, "first_name", "firstName");
  const lastName = pickString(source, "last_name", "lastName");
  const fullName = pickString(source, "full_name", "name", "fullName") || `${firstName} ${lastName}`.trim() || email;
  const phone = pickString(source, "phone");

  return { email, fullName, phone };
}
