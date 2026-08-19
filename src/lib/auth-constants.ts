export const TEMPORARY_MEMBER_PASSWORD = "JDCELITESOCIETY";

export function existingAccountLoginPath(email: string) {
  const params = new URLSearchParams({
    email: email.trim().toLowerCase(),
    reason: "existing",
  });
  return `/login?${params.toString()}`;
}

export function isTemporaryMemberPassword(password: string) {
  return password === TEMPORARY_MEMBER_PASSWORD;
}
