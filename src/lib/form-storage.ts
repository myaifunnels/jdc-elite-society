export const inquiryDraftStorageKey = "coach-jdc-inquiry-draft";

export function readStoredForm(storageKey: string): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
  } catch {
    return {};
  }
}

export function writeStoredForm(storageKey: string, values: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = Object.fromEntries(
    Object.entries(values).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
  window.localStorage.setItem(storageKey, JSON.stringify(payload));
}

export function shouldPersistField(field: Element) {
  if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) {
    return false;
  }

  if (field.dataset.sticky === "off") {
    return false;
  }

  if (field instanceof HTMLInputElement && (field.type === "password" || field.type === "hidden" || field.type === "file")) {
    return false;
  }

  return Boolean(field.name);
}
