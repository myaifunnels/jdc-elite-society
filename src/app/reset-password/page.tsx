import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your Coach JDC account.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const user = await getSessionUser();

  if (user) {
    redirect("/dashboard");
  }

  const { token = "" } = await searchParams;

  return (
    <AuthPageShell>
      <ResetPasswordForm token={token} />
    </AuthPageShell>
  );
}
