import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { hasAccess, type Capability } from "@/lib/access";
import { resolveAccess } from "@/lib/access-store";
import { getPublicUserById } from "@/lib/auth-store";
import { AuthUser, DashboardRole } from "@/lib/types";

const SESSION_COOKIE = "coach-jdc-user";
export const impersonatorCookieName = "coach-jdc-impersonator";

export type SessionUser = AuthUser;

function cookieSecret() {
  return process.env.AUTH_SECRET || process.env.DATABASE_URL || "coach-jdc-dev-secret";
}

function signValue(value: string) {
  const signature = createHmac("sha256", cookieSecret()).update(value).digest("hex").slice(0, 32);
  return `${value}.${signature}`;
}

function readSignedValue(raw: string | undefined) {
  if (!raw) {
    return null;
  }
  const index = raw.lastIndexOf(".");
  if (index < 1) {
    return null;
  }
  const value = raw.slice(0, index);
  const signature = raw.slice(index + 1);
  const expected = createHmac("sha256", cookieSecret()).update(value).digest("hex").slice(0, 32);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }
  return value;
}

export type ImpersonationState = {
  adminId: string;
  targetId: string;
};

export function encodeImpersonation(state: ImpersonationState) {
  return signValue(`${state.adminId}:${state.targetId}`);
}

export function decodeImpersonation(raw: string | undefined): ImpersonationState | null {
  const value = readSignedValue(raw);
  if (!value) {
    return null;
  }
  const [adminId, targetId] = value.split(":");
  if (!adminId || !targetId) {
    return null;
  }
  return { adminId, targetId };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!userId) {
    return null;
  }

  return getPublicUserById(userId);
}

export const sessionCookieName = SESSION_COOKIE;

export async function getImpersonator() {
  const cookieStore = await cookies();
  const sessionUser = await getSessionUser();
  const state = decodeImpersonation(cookieStore.get(impersonatorCookieName)?.value);
  if (!state || !sessionUser || sessionUser.id !== state.targetId) {
    return null;
  }
  const admin = await getPublicUserById(state.adminId);
  return admin?.role === "admin" ? admin : null;
}

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
