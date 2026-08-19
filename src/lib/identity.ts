export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function phonesMatch(left: string, right: string) {
  const a = normalizePhoneDigits(left);
  const b = normalizePhoneDigits(right);

  if (!a || !b) {
    return false;
  }

  if (a === b) {
    return true;
  }

  const aTail = a.slice(-10);
  const bTail = b.slice(-10);
  return aTail.length >= 10 && aTail === bTail;
}

export function emailsMatch(left: string, right: string) {
  return normalizeEmail(left) === normalizeEmail(right);
}
