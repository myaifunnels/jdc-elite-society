import { AuthUser } from "@/lib/types";

export function hasUniversityAccess(
  user: Pick<AuthUser, "role" | "paymentVerified" | "active">,
) {
  if (!user.active) {
    return false;
  }
  if (user.role === "admin" || user.role === "partner") {
    return true;
  }
  // Members and contacts get University on registration. Rejecting payment or deactivating the account is the lock.
  return user.paymentVerified !== false;
}
