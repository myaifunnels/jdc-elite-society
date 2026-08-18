"use client";

import { Lock, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

import { AuthFormState, loginAccount, registerAccount } from "@/app/login/actions";
import { SiteLogo } from "@/components/branding/site-logo";
import { BrandingSettings } from "@/lib/branding";

const initialState: AuthFormState = {};

export function AuthSplitCard({
  branding,
  initialMode = "login",
}: {
  branding: BrandingSettings;
  initialMode?: "login" | "register";
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [loginState, loginAction, loginPending] = useActionState(loginAccount, initialState);
  const [registerState, registerAction, registerPending] = useActionState(registerAccount, initialState);

  function showLogin() {
    setMode("login");
    router.replace("/login", { scroll: false });
  }

  function showRegister() {
    setMode("register");
    router.replace("/register", { scroll: false });
  }

  return (
    <div className="auth-split">
      <section className="auth-split-hero">
        <SiteLogo branding={branding} href="/" inverted compact={Boolean(branding.logoUrl)} />
        <div className="auth-split-hero-copy">
          <h1>Hello, welcome!</h1>
          <p>
            Sign in to enter the room that matches your role. Members get a coaching path. Partners get assigned
            leads. Admins keep the full command center.
          </p>
          <Link href="/programs" className="auth-view-more">
            View more
          </Link>
        </div>
      </section>

      <section className="auth-split-form">
        {mode === "login" ? (
          <form action={loginAction} className="auth-form">
            <label className="auth-field">
              <span>Email address</span>
              <span className="auth-input-wrap">
                <Mail size={16} aria-hidden />
                <input name="email" type="email" autoComplete="email" placeholder="name@mail.com" />
              </span>
            </label>

            <label className="auth-field">
              <span>Password</span>
              <span className="auth-input-wrap">
                <Lock size={16} aria-hidden />
                <input name="password" type="password" autoComplete="current-password" placeholder="••••••••" />
              </span>
            </label>

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

            <button type="submit" className="auth-btn-login" disabled={loginPending}>
              {loginPending ? "Signing in..." : "Login"}
            </button>

            <p className="auth-switch-copy">Not a member yet?</p>
            <button type="button" className="auth-btn-signup" onClick={showRegister}>
              Sign up
            </button>
          </form>
        ) : (
          <form action={registerAction} className="auth-form">
            <label className="auth-field">
              <span>Full name</span>
              <span className="auth-input-wrap">
                <UserRound size={16} aria-hidden />
                <input name="name" autoComplete="name" placeholder="Juan Dela Cruz" />
              </span>
            </label>

            <label className="auth-field">
              <span>Email address</span>
              <span className="auth-input-wrap">
                <Mail size={16} aria-hidden />
                <input name="email" type="email" autoComplete="email" placeholder="name@mail.com" />
              </span>
            </label>

            <label className="auth-field">
              <span>Password</span>
              <span className="auth-input-wrap">
                <Lock size={16} aria-hidden />
                <input name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" />
              </span>
            </label>

            <fieldset className="auth-roles">
              <legend>What best describes your role here?</legend>
              <label>
                <input type="radio" name="role" value="member" defaultChecked />
                Member
              </label>
              <label>
                <input type="radio" name="role" value="partner" />
                Partner
              </label>
            </fieldset>

            {registerState.error ? <p className="auth-error">{registerState.error}</p> : null}

            <button type="submit" className="auth-btn-signup" disabled={registerPending}>
              {registerPending ? "Creating account..." : "Sign up"}
            </button>

            <p className="auth-switch-copy">Already a member?</p>
            <button type="button" className="auth-btn-login" onClick={showLogin}>
              Login
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
