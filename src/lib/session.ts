import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardRole } from "@/lib/types";

const SESSION_COOKIE = "coach-jdc-role";

export type SessionRole = DashboardRole | "member";

export type SessionUser = {
  name: string;
  role: SessionRole;
  email?: string;
  mustChangePassword?: boolean;
};

export const sessionCookieName = SESSION_COOKIE;

function parseSession(value?: string): SessionUser | null {
  if (!value) {
    return null;
  }

  if (value === "admin") {
    return { name: "Coach Admin", role: "admin" };
  }

  if (value === "partner") {
    return { name: "JDC Partner", role: "partner" };
  }

  try {
    const parsed = JSON.parse(value) as SessionUser;
    if (parsed?.role === "admin" || parsed?.role === "partner" || parsed?.role === "member") {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  return parseSession(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function setSessionUser(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function requireSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireStaffUser() {
  const user = await requireSessionUser();

  if (user.role === "member") {
    redirect(user.mustChangePassword ? "/account/password" : "/account");
  }

  return user as SessionUser & { role: DashboardRole };
}

export async function requireMemberUser() {
  const user = await requireSessionUser();

  if (user.role !== "member") {
    redirect("/login");
  }

  return user;
}
