import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth/auth-panel";
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
    <div className="auth-screen auth-screen-centered">
      <main className="auth-screen-main auth-screen-main-centered">
        <AuthPanel branding={branding} mode="login" />
      </main>
    </div>
  );
}
