import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
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

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-space">
        <div className="container-shell">
          <div className="mb-8 max-w-2xl">
            <p className="eyebrow text-xs">Account</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Sign in, or register if you don&apos;t have an account yet.
            </h1>
            <p className="mt-4 text-lg text-[var(--muted)]">
              After you enter, we open the dashboard that matches your role — member, partner, or admin.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <LoginForm showRegisterLink={false} />
            <RegisterForm showSignInLink={false} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
