import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardRole } from "@/lib/types";

const SESSION_COOKIE = "coach-jdc-role";

export type SessionUser = {
  name: string;
  role: DashboardRole;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const role = cookieStore.get(SESSION_COOKIE)?.value;

  if (role === "admin") {
    return { name: "Coach Admin", role };
  }

  if (role === "partner") {
    return { name: "JDC Partner", role };
  }

  return null;
}

export const sessionCookieName = SESSION_COOKIE;

export async function requireSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
