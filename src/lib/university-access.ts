import { AuthUser } from "@/lib/types";

export function hasUniversityAccess(
  user: Pick<AuthUser, "role" | "paymentVerified" | "active">,
) {
  // University access is unlocked for every active registrant — straight into the community discussion.
  return user.active;
}
