"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { sessionCookieName } from "@/lib/session";
import { DashboardRole } from "@/lib/types";

export type AdminLoginState = {
  error?: string;
};

export async function loginAsRole(role: DashboardRole) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/dashboard");
}

export async function loginAdmin(
  _prevState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (username !== "admin" || password !== "admin") {
    return { error: "Use admin / admin for this dashboard login." };
  }

  await loginAsRole("admin");
  return {};
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
  redirect("/");
}
