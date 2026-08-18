import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthSplitCard } from "@/components/auth/auth-split-card";
import { SiteHeader } from "@/components/layout/site-header";
import { getResolvedBrandingSettings } from "@/lib/branding-store";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Coach JDC dashboard, or register as a member or partner.",
};

export default async function LoginPage() {
  const user = await getSessionUser();

  if (user) {
    redirect("/dashboard");
  }

  const branding = await getResolvedBrandingSettings();

  return (
    <div className="auth-screen">
      <SiteHeader overlay />
      <main className="auth-screen-main">
        <AuthSplitCard branding={branding} initialMode="login" />
      </main>
    </div>
  );
}
