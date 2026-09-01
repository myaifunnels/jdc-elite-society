"use server";

import { revalidatePath } from "next/cache";

import { AuthFormState } from "@/app/login/actions";
import { approveAllMemberRegistrations } from "@/lib/auth-store";
import { invalidateRegistrantCrmSync } from "@/lib/crm-store";
import { requireCapability } from "@/lib/session";

export async function approveAllMemberRegistrationsAction(): Promise<AuthFormState> {
  await requireCapability("registrations");

  try {
    const summary = await approveAllMemberRegistrations();
    invalidateRegistrantCrmSync();
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/registrations");
    revalidatePath("/dashboard/contacts");

    if (summary.paymentVerified === 0) {
      return { success: "No pending member or contact registrations to approve." };
    }

    const profileNote =
      summary.stillPendingProfile > 0
        ? ` ${summary.stillPendingProfile} still pending until they finish their profile.`
        : "";

    return {
      success: `Approved ${summary.paymentVerified} registration${summary.paymentVerified === 1 ? "" : "s"}. ${summary.accountsVerified} account${summary.accountsVerified === 1 ? " is" : "s are"} now verified.${profileNote}`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "I couldn't approve pending registrations.",
    };
  }
}
