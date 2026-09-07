import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a Coach JDC password reset by email or text.",
};

export default async function ForgotPasswordPage() {
  const user = await getSessionUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthPageShell>
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
