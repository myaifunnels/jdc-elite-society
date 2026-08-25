"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AccessMap, AccessOverride, CAPABILITIES, parseAccessRole } from "@/lib/access";
import { deleteUserAccess, saveRoleDefaults, saveUserAccess } from "@/lib/access-store";
import { removeProfileForUser } from "@/lib/affiliate-store";
import {
  createUser,
  deleteUser,
  findUserByEmail,
  getPublicUserById,
  setUserActive,
  updateUserRole,
} from "@/lib/auth-store";
import { hideAndRemoveContactByEmail, unhideContactEmail } from "@/lib/crm-store";
import { deletePasswordResetsForUser } from "@/lib/password-reset";
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
  await unhideContactEmail(email);
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

export type DeactivateUserState = {
  error?: string;
  success?: string;
};

export async function deactivateUserAction(
  _prevState: DeactivateUserState,
  formData: FormData,
): Promise<DeactivateUserState> {
  const { user: actor } = await requireCapability("access");
  if (actor.role !== "admin") {
    return { error: "Only admin can deactivate accounts." };
  }

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) {
    return { error: "Missing account." };
  }
  if (userId === actor.id) {
    return { error: "You can't deactivate the account you're signed in with." };
  }

  try {
    await setUserActive(userId, false);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "I couldn't deactivate this account." };
  }

  revalidatePath("/dashboard/access");
  revalidatePath("/dashboard/contacts");
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/registrations");
  return { success: "Account deactivated. They can no longer sign in or access the dashboard." };
}

export async function reactivateUserAction(
  _prevState: DeactivateUserState,
  formData: FormData,
): Promise<DeactivateUserState> {
  await requireCapability("access");
  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) {
    return { error: "Missing account." };
  }

  try {
    await setUserActive(userId, true);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "I couldn't reactivate this account." };
  }

  revalidatePath("/dashboard/access");
  revalidatePath("/dashboard/contacts");
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/registrations");
  return { success: "Account reactivated." };
}

export type DeleteUserState = {
  error?: string;
};

export async function deleteUserAction(
  _prevState: DeleteUserState,
  formData: FormData,
): Promise<DeleteUserState> {
  const { user: actor } = await requireCapability("access");
  if (actor.role !== "admin") {
    return { error: "Only admin can delete accounts." };
  }

  const userId = String(formData.get("userId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nextPath = String(formData.get("redirectTo") ?? "/dashboard/contacts").trim();
  const redirectTo = nextPath.startsWith("/dashboard") ? nextPath : "/dashboard/contacts";

  const target = userId ? await getPublicUserById(userId) : email ? await findUserByEmail(email) : null;
  const contactEmail = target?.email || email;
  if (!contactEmail) {
    return { error: "Missing account." };
  }
  if (target?.id === actor.id) {
    return { error: "You can't delete the account you're signed in with." };
  }

  try {
    await hideAndRemoveContactByEmail(contactEmail);
    if (target) {
      await deleteUserAccess(target.id);
      await deletePasswordResetsForUser(target.id);
      await removeProfileForUser(target.id);
      await deleteUser(target.id);
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "I couldn't delete this account." };
  }

  revalidatePath("/dashboard/access");
  revalidatePath("/dashboard/contacts");
  revalidatePath("/dashboard/registrations");
  revalidatePath("/dashboard");
  redirect(redirectTo);
}
