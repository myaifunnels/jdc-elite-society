import { logout } from "@/app/login/actions";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { requireMemberUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const user = await requireMemberUser();

  if (user.mustChangePassword) {
    redirect("/account/password");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-space">
        <div className="container-shell max-w-3xl">
          <p className="eyebrow text-xs">Your account</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Welcome back, {user.name}.
          </h1>
          <p className="mt-4 text-lg text-[var(--muted)]">
            You are signed in with {user.email}. This email and your phone number stay unique in the system, so a second
            registration is not created.
          </p>

          <form action={logout} className="mt-8">
            <button type="submit" className="button-secondary pressable rounded-full px-5 py-3 font-semibold">
              Sign out
            </button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
