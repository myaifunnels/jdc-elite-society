export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function phonesMatch(left: string, right: string) {
  const a = normalizePhoneDigits(left);
  const b = normalizePhoneDigits(right);

  if (!a || !b || a.length < 8 || b.length < 8) {
    return false;
  }

  if (a === b) {
    return true;
  }

  return a.slice(-10) === b.slice(-10);
}

export function emailsMatch(left: string, right: string) {
  return Boolean(left && right && normalizeEmail(left) === normalizeEmail(right));
}
