import type { Metadata } from "next";

import { loginAsRole } from "@/app/login/actions";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Login",
  description: "Choose a demo dashboard role for the Coach JDC platform.",
};

export default async function LoginPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-space">
        <div className="container-shell max-w-5xl">
          <div className="mb-8 max-w-2xl">
            <p className="eyebrow text-xs">Dashboard access</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
              Enter the CRM workspace as an admin or partner.
            </h1>
            <p className="mt-4 text-lg text-[var(--muted)]">
              Admin access now uses explicit credentials, while partner access stays lightweight for previewing the role-based experience.
            </p>
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
