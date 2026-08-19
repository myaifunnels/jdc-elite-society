"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { AccessMap, AccessOverride, CAPABILITIES, parseAccessRole } from "@/lib/access";
import { saveRoleDefaults, saveUserAccess } from "@/lib/access-store";
import { createUser, findUserByEmail, updateUserRole } from "@/lib/auth-store";
import { requireCapability } from "@/lib/session";

function mapFromForm(formData: FormData, prefix: string): AccessMap {
  const next = {} as AccessMap;
  for (const item of CAPABILITIES) {
    next[item.id] = formData.get(`${prefix}:${item.id}`) === "on";
  }
  return next;
}

function overridesFromForm(formData: FormData): AccessOverride {
  const overrides: AccessOverride = {};
  for (const item of CAPABILITIES) {
    const value = String(formData.get(`cap:${item.id}`) ?? "inherit");
    if (value === "allow") {
      overrides[item.id] = true;
    }
    if (value === "deny") {
      overrides[item.id] = false;
    }
  }
  return overrides;
}

export async function saveRoleDefaultAction(formData: FormData) {
  await requireCapability("access");
  const role = parseAccessRole(String(formData.get("role") ?? "member"));
  await saveRoleDefaults(role, mapFromForm(formData, "cap"));
  revalidatePath("/dashboard/access");
}

export async function saveUserAccessAction(formData: FormData) {
  await requireCapability("access");
  const userId = String(formData.get("userId") ?? "");
  const role = parseAccessRole(String(formData.get("role") ?? "member"));
  if (!userId) {
    return;
  }
  await updateUserRole(userId, role);
  await saveUserAccess(userId, role, overridesFromForm(formData));
  revalidatePath("/dashboard/access");
  revalidatePath(`/dashboard/access/${userId}`);
  revalidatePath("/dashboard/contacts");
}

export async function grantContactPortalAction(formData: FormData) {
  await requireCapability("access");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!email || !name) {
    return;
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    await updateUserRole(existing.id, "contact");
    await saveUserAccess(existing.id, "contact", {});
  } else {
    const user = await createUser({
      name,
      email,
      password: randomBytes(18).toString("hex"),
      role: "contact",
      passwordSet: false,
      profileComplete: true,
      paymentVerified: true,
    });
    await saveUserAccess(user.id, "contact", {});
  }

  revalidatePath("/dashboard/access");
  revalidatePath("/dashboard/contacts");
}
