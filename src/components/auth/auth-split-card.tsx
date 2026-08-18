"use client";

import { Calendar, Image as ImageIcon, Lock, Mail, MapPin, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

import { AuthFormState, loginAccount, registerAccount } from "@/app/login/actions";
import { SiteLogo } from "@/components/branding/site-logo";
import { AddressAutocomplete } from "@/components/forms/address-autocomplete";
import { BrandingSettings } from "@/lib/branding";
import { audienceOptions } from "@/lib/validations";

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
          <h1>{mode === "login" ? "Welcome back." : "Join the room."}</h1>
          <p>
            {mode === "login"
              ? "Sign in to open the dashboard that matches your role."
              : "Register as a member or partner. Your details sync into the JDC Elite Society account."}
          </p>
          <Link href="/programs" className="auth-view-more">
            View more
          </Link>
        </div>
      </section>

      <section className="auth-split-form">
        <div className="auth-mode-toggle" role="tablist" aria-label="Account">
          <button type="button" className={mode === "login" ? "is-active" : ""} onClick={showLogin}>
            Sign in
          </button>
          <button type="button" className={mode === "register" ? "is-active" : ""} onClick={showRegister}>
            Register
          </button>
        </div>

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

            <button type="submit" className="auth-btn-login auth-btn-active" disabled={loginPending}>
              {loginPending ? "Signing in..." : "Sign in"}
            </button>

            <p className="auth-switch-copy">Not a member yet?</p>
            <button type="button" className="auth-btn-signup auth-btn-idle" onClick={showRegister}>
              Register
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

            <label className="auth-field">
              <span>Date of birth</span>
              <span className="auth-input-wrap">
                <Calendar size={16} aria-hidden />
                <input name="dateOfBirth" type="date" autoComplete="bday" required />
              </span>
            </label>

            <label className="auth-field">
              <span>Address</span>
              <span className="auth-input-wrap">
                <MapPin size={16} aria-hidden />
                <AddressAutocomplete name="address" />
              </span>
            </label>

            <label className="auth-field">
              <span>What best describes you?</span>
              <span className="auth-input-wrap">
                <select name="bestDescribesYou" defaultValue="" required>
                  <option value="" disabled>
                    Select one
                  </option>
                  {audienceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <label className="auth-field">
              <span>Facebook profile URL</span>
              <span className="auth-input-wrap">
                <UserRound size={16} aria-hidden />
                <input
                  name="facebookProfileUrl"
                  type="url"
                  autoComplete="url"
                  placeholder="https://facebook.com/your.profile"
                />
              </span>
            </label>

            <label className="auth-field">
              <span>Facebook profile picture URL</span>
              <span className="auth-input-wrap">
                <ImageIcon size={16} aria-hidden />
                <input
                  name="facebookPhotoUrl"
                  type="url"
                  placeholder="https://... your Facebook photo"
                />
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

            <button type="submit" className="auth-btn-signup auth-btn-active" disabled={registerPending}>
              {registerPending ? "Creating account..." : "Register"}
            </button>

            <p className="auth-switch-copy">Already a member?</p>
            <button type="button" className="auth-btn-login auth-btn-idle" onClick={showLogin}>
              Sign in
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
