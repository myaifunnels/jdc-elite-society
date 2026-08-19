"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { authenticateUser, createUser, ensureSeedUsers } from "@/lib/auth-store";
import { syncContactToGhl } from "@/lib/ghl";
import { sessionCookieName } from "@/lib/session";
import { loginSchema, registerSchema } from "@/lib/validations";

export type AuthFormState = {
  error?: string;
};

async function setSessionCookie(userId: string, remember = true) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: remember ? 60 * 60 * 24 * 30 : undefined,
  });
}

export async function registerAccount(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    memberships: formData.getAll("memberships").map(String),
    bestDescribesYou: String(formData.get("bestDescribesYou") ?? ""),
    dateOfBirth: String(formData.get("dateOfBirth") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    facebookProfileUrl: String(formData.get("facebookProfileUrl") ?? "").trim(),
    facebookPhotoUrl: String(formData.get("facebookPhotoUrl") ?? "").trim(),
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Check the registration details and try again." };
  }

  try {
    await ensureSeedUsers();
    const { confirmPassword: _confirmPassword, ...account } = parsed.data;
    const user = await createUser({
      ...account,
      role: "member",
    });
    await setSessionCookie(user.id, true);
    await syncContactToGhl({
      name: parsed.data.name,
      email: parsed.data.email,
      dateOfBirth: parsed.data.dateOfBirth,
      address: parsed.data.address,
      bestDescribesYou: parsed.data.bestDescribesYou,
      facebookProfileUrl: parsed.data.facebookProfileUrl,
      facebookPhotoUrl: parsed.data.facebookPhotoUrl,
      source: "Website registration",
      tags: [
        "Registration",
        ...parsed.data.memberships.map((item) => (item === "jes" ? "JES Member" : "Spartans")),
      ],
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "I couldn't create this account just now.",
    };
  }

  redirect("/dashboard");
}

export async function loginAccount(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || "Check your email and password." };
  }

  const user = await authenticateUser(parsed.data.email, parsed.data.password);

  if (!user) {
    return { error: "That email and password do not match an account." };
  }

  await setSessionCookie(user.id, String(formData.get("remember") ?? "") === "on");
  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
  redirect("/");
}
