import { PasswordChangeForm } from "@/components/auth/password-change-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { requireMemberUser } from "@/lib/session";

export default async function AccountPasswordPage() {
  const user = await requireMemberUser();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-space">
        <div className="container-shell max-w-3xl">
          <p className="eyebrow text-xs">Password</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Set a new password for {user.email}
          </h1>
          <p className="mt-4 mb-8 text-lg text-[var(--muted)]">
            Replace the temporary password with a password only you know, then confirm it.
          </p>
          <PasswordChangeForm />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
