import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { hasAccess, type Capability } from "@/lib/access";
import { resolveAccess } from "@/lib/access-store";
import { getPublicUserById } from "@/lib/auth-store";
import { AuthUser, DashboardRole } from "@/lib/types";

const SESSION_COOKIE = "coach-jdc-user";

export type SessionUser = AuthUser;

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!userId) {
    return null;
  }

  return getPublicUserById(userId);
}

export const sessionCookieName = SESSION_COOKIE;

export async function requireSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRoles(roles: DashboardRole[]) {
  const user = await requireSessionUser();

  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}

export async function requireCapability(capability: Capability) {
  const user = await requireSessionUser();
  const access = await resolveAccess(user);

  if (!hasAccess(access, capability)) {
    redirect("/dashboard");
  }

  return { user, access };
}

export async function requireAffiliateAccess() {
  const { user } = await requireCapability("partnership");
  return user;
}
