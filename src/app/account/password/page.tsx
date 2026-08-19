import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { SetPasswordForm } from "@/components/auth/set-password-form";
import { getResolvedBrandingSettings } from "@/lib/branding-store";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Replace the temporary password with a password only you know.",
};

export default async function AccountPasswordPage() {
  const user = await requireSessionUser();

  if (user.passwordSet) {
    redirect("/dashboard");
  }

  const branding = await getResolvedBrandingSettings();

  return (
    <AuthPageShell>
      <SetPasswordForm branding={branding} email={user.email} />
    </AuthPageShell>
  );
}
