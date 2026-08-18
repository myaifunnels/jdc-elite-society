import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
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

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-space">
        <div className="container-shell max-w-xl">
          <RegisterForm />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
