import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthSplitCard } from "@/components/auth/auth-split-card";
import { SiteHeader } from "@/components/layout/site-header";
import { getResolvedBrandingSettings } from "@/lib/branding-store";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a Coach JDC account as a member or partner and open the dashboard that matches your role.",
};

export default async function RegisterPage() {
  const user = await getSessionUser();

  if (user) {
    redirect("/dashboard");
  }

  const branding = await getResolvedBrandingSettings();

  return (
    <div className="auth-screen">
      <SiteHeader />
      <main className="auth-screen-main">
        <AuthSplitCard branding={branding} initialMode="register" />
      </main>
    </div>
  );
}
