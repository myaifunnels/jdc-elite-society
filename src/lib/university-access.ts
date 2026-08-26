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
  return user.paymentVerified === true;
}
