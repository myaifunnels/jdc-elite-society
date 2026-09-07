import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AuthPanel } from "@/components/auth/auth-panel";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a Coach JDC account and open the dashboard.",
};

export default async function RegisterPage() {
  const user = await getSessionUser();

  if (user) {
    redirect(user.passwordSet ? "/dashboard" : "/account/password");
  }

  return (
    <AuthPageShell>
      <AuthPanel mode="register" />
    </AuthPageShell>
  );
}
