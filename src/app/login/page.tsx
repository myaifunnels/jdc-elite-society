import type { Metadata } from "next";

import { loginAsRole } from "@/app/login/actions";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { MemberLoginForm } from "@/components/auth/member-login-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in with your inquiry email or enter the Coach JDC dashboard.",
};

type LoginPageProps = {
  searchParams: Promise<{ email?: string; reason?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const existing = params.reason === "existing";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-space">
        <div className="container-shell max-w-5xl">
          <div className="mb-8 max-w-2xl">
            <p className="eyebrow text-xs">Login</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
              {existing ? "This email or phone is already in the system." : "Sign in to continue."}
            </h1>
            <p className="mt-4 text-lg text-[var(--muted)]">
              {existing
                ? "Use the email you registered with. The temporary password is JDCELITESOCIETY. After login you will create a new password and confirmation password."
                : "Members sign in with the email from the inquiry form. Admins and partners still have dashboard access below."}
            </p>
          </div>

          <div className="mb-6">
            <MemberLoginForm email={params.email ?? ""} existing={existing} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <AdminLoginForm />

            <form
              action={async () => {
                "use server";
                await loginAsRole("partner");
              }}
              className="glass-panel rounded-[2rem] p-8"
            >
              <p className="eyebrow text-xs">Partner</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
                See assigned leads and partner KPIs
              </h2>
              <ul className="mt-5 grid gap-3 text-sm text-[var(--muted)]">
                <li>• Review partner-owned leads</li>
                <li>• Track routing and conversion performance</li>
                <li>• Stay within role-based visibility boundaries</li>
              </ul>
              <button
                type="submit"
                className="button-secondary pressable mt-8 rounded-full px-5 py-3 font-semibold"
              >
                Continue as partner
              </button>
            </form>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
