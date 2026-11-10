"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ensurePortalUserForContact, findUserById } from "@/lib/auth-store";
import {
  decodeImpersonation,
  encodeImpersonation,
  getImpersonator,
  impersonatorCookieName,
  requireSessionUser,
  sessionCookieName,
} from "@/lib/session";

function sessionOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

export async function openUserDashboard(formData: FormData) {
  const actor = await requireSessionUser();
  const impersonator = await getImpersonator();
  const admin = impersonator ?? actor;
  if (admin.role !== "admin") {
    redirect("/dashboard/contacts");
  }

  const userId = String(formData.get("userId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  let target = userId ? await findUserById(userId) : null;
  if (!target && email) {
    const provisioned = await ensurePortalUserForContact({ name: name || email, email, phone });
    target = provisioned ? await findUserById(provisioned.id) : null;
  }
  if (!target || target.role === "admin") {
    redirect("/dashboard/contacts");
  }

  const cookieStore = await cookies();
  cookieStore.set(
    impersonatorCookieName,
    encodeImpersonation({ adminId: admin.id, targetId: target.id }),
    sessionOptions(60 * 60 * 8),
  );
  cookieStore.set(sessionCookieName, target.id, sessionOptions(60 * 60 * 8));
  redirect("/dashboard");
}

export async function stopImpersonation() {
  const cookieStore = await cookies();
  const current = await requireSessionUser();
  const state = decodeImpersonation(cookieStore.get(impersonatorCookieName)?.value);
  cookieStore.delete(impersonatorCookieName);
  if (state && current.id === state.targetId) {
    cookieStore.set(sessionCookieName, state.adminId, sessionOptions(60 * 60 * 24 * 30));
  }
  redirect("/dashboard/contacts");
}
