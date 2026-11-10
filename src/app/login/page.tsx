import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AuthPanel } from "@/components/auth/auth-panel";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in with your email and password, or register first.",
};

type LoginPageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getSessionUser();
  const params = await searchParams;

  if (user) {
    redirect(user.passwordSet ? "/dashboard" : "/account/password");
  }

  return (
    <AuthPageShell>
      <AuthPanel mode="login" email={params.email ?? ""} />
    </AuthPageShell>
  );
}
