import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { TEMPORARY_MEMBER_PASSWORD } from "@/lib/auth-constants";

export { TEMPORARY_MEMBER_PASSWORD };

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");

  if (!salt || !hash) {
    return false;
  }

  const next = scryptSync(password, salt, 64);
  const current = Buffer.from(hash, "hex");

  if (current.length !== next.length) {
    return false;
  }

  return timingSafeEqual(current, next);
}

export function isTemporaryMemberPassword(password: string) {
  return password === TEMPORARY_MEMBER_PASSWORD;
}
