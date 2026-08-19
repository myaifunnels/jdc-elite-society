import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AuthPanel } from "@/components/auth/auth-panel";
import { getResolvedBrandingSettings } from "@/lib/branding-store";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in with your email and password, or register first.",
};

type LoginPageProps = {
  searchParams: Promise<{ email?: string; reason?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getSessionUser();
  const params = await searchParams;

  if (user) {
    redirect(user.passwordSet ? "/dashboard" : "/account/password");
  }

  const branding = await getResolvedBrandingSettings();

  return (
    <AuthPageShell>
      <AuthPanel
        branding={branding}
        mode="login"
        email={params.email ?? ""}
        existing={params.reason === "existing"}
      />
    </AuthPageShell>
  );
}
