"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { authenticateMember, updateMemberPassword } from "@/lib/members-store";
import { isTemporaryMemberPassword } from "@/lib/password";
import { getSessionUser, sessionCookieName, setSessionUser } from "@/lib/session";
import { DashboardRole } from "@/lib/types";

export type AdminLoginState = {
  error?: string;
};

export type MemberLoginState = {
  error?: string;
};

export type PasswordChangeState = {
  error?: string;
  success?: string;
};

export async function loginAsRole(role: DashboardRole) {
  await setSessionUser({
    name: role === "admin" ? "Coach Admin" : "JDC Partner",
    role,
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

export async function loginMember(
  _prevState: MemberLoginState,
  formData: FormData,
): Promise<MemberLoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter the email you registered with, then sign in." };
  }

  const member = await authenticateMember(email, password);
  if (!member) {
    return {
      error: "That email and password did not match a member account. Use the email from your inquiry form.",
    };
  }

  const mustChangePassword = member.mustChangePassword || isTemporaryMemberPassword(password);

  await setSessionUser({
    name: member.name,
    role: "member",
    email: member.email,
    mustChangePassword,
  });

  redirect(mustChangePassword ? "/account/password" : "/account");
}

export async function changeMemberPassword(
  _prevState: PasswordChangeState,
  formData: FormData,
): Promise<PasswordChangeState> {
  const user = await getSessionUser();

  if (!user || user.role !== "member" || !user.email) {
    return { error: "Sign in with your email first." };
  }

  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (password.length < 8) {
    return { error: "Use a new password with at least 8 characters." };
  }

  if (password !== confirmation) {
    return { error: "The new password and confirmation password must match." };
  }

  if (isTemporaryMemberPassword(password)) {
    return { error: "Choose a new password. Do not reuse JDCELITESOCIETY." };
  }

  const updated = await updateMemberPassword(user.email, password);
  if (!updated) {
    return { error: "We could not update that password. Try signing in again." };
  }

  await setSessionUser({
    name: updated.name,
    role: "member",
    email: updated.email,
    mustChangePassword: false,
  });

  redirect("/account");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
  redirect("/");
}
