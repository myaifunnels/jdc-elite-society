"use client";

import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

import { AuthFormState, loginAccount } from "@/app/login/actions";
import { SiteLogo } from "@/components/branding/site-logo";
import { FloatField } from "@/components/forms/float-field";
import { BrandingSettings } from "@/lib/branding";

const initialState: AuthFormState = {};

export function AuthSplitCard({ branding }: { branding: BrandingSettings }) {
  const router = useRouter();
  const [loginState, loginAction, loginPending] = useActionState(loginAccount, initialState);

  return (
    <div className="auth-split">
      <section className="auth-split-hero">
        <SiteLogo branding={branding} href="/" inverted compact={Boolean(branding.logoUrl)} />
        <div className="auth-split-hero-copy">
          <h1>Welcome back.</h1>
          <p>Sign in to open the dashboard that matches your role.</p>
          <Link href="/programs" className="auth-view-more">
            View more
          </Link>
        </div>
      </section>

      <section className="auth-split-form">
        <div className="auth-mode-toggle" role="tablist" aria-label="Account">
          <button type="button" className="is-active">
            Sign in
          </button>
          <button type="button" onClick={() => router.replace("/register")}>
            Register
          </button>
        </div>

        <form action={loginAction} className="auth-form">
          <FloatField label="Enter your email address" icon={<Mail size={16} aria-hidden />}>
            <input name="email" type="email" autoComplete="email" placeholder=" " />
          </FloatField>

          <FloatField label="Enter your password" icon={<Lock size={16} aria-hidden />}>
            <input name="password" type="password" autoComplete="current-password" placeholder=" " />
          </FloatField>

          <div className="auth-row">
            <label className="auth-check">
              <input type="checkbox" name="remember" />
              Remember me
            </label>
            <Link href="/contact" className="auth-forgot">
              Forgot password?
            </Link>
          </div>

          {loginState.error ? <p className="auth-error">{loginState.error}</p> : null}

          <button type="submit" className="auth-btn-login auth-btn-active" disabled={loginPending}>
            {loginPending ? "Signing in..." : "Sign in"}
          </button>

          <p className="auth-switch-copy">Not a member yet?</p>
          <button type="button" className="auth-btn-signup auth-btn-idle" onClick={() => router.replace("/register")}>
            Register
          </button>
        </form>
      </section>
    </div>
  );
}
