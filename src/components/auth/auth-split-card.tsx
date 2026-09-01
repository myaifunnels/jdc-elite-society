"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

import { AuthFormState, loginAccount, registerAccount } from "@/app/login/actions";
import { SiteLogo } from "@/components/branding/site-logo";
import { AddressAutocomplete } from "@/components/forms/address-autocomplete";
import { BrandingSettings } from "@/lib/branding";
import { audienceOptions } from "@/lib/validations";

const initialState: AuthFormState = {};

function MacosField({
  label,
  children,
  action,
}: {
  label: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <label className="macos-field">
      <span className="macos-field-copy">
        <span>{label}</span>
        {children}
      </span>
      {action}
    </label>
  );
}

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
    <div className={`auth-glass-card${mode === "register" ? " register" : ""}`}>
      <div className="auth-brand">
        <SiteLogo branding={branding} href="/" inverted compact={Boolean(branding.logoUrl)} />
      </div>

      <div className="auth-mark" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="9" cy="9" r="2.4" fill="currentColor" />
        </svg>
      </div>

      <h1>{mode === "login" ? "Welcome back" : "Join Elite"}</h1>
      <p className="auth-lead">
        {mode === "login"
          ? "Please enter your details to sign in"
          : "Create your JDC Elite account and open the room that matches your role."}
      </p>

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
          <MacosField
            label="Email"
            action={
              <button type="submit" className="macos-go" disabled={loginPending} aria-label="Sign in">
                <ArrowRight size={16} />
              </button>
            }
          >
            <input name="email" type="email" autoComplete="email" placeholder="name@mail.com" />
          </MacosField>

          <MacosField label="Password">
            <input name="password" type="password" autoComplete="current-password" placeholder="••••••••" />
          </MacosField>

          <div className="auth-row">
            <label className="auth-check">
              <input type="checkbox" name="remember" />
              Remember me
            </label>
            <a href="/contact" className="auth-forgot">
              Forgot password?
            </a>
          </div>

          {loginState.error ? <p className="auth-error">{loginState.error}</p> : null}

          <p className="auth-switch-copy">
            Don&apos;t have an account?{" "}
            <button type="button" onClick={showRegister} className="auth-forgot">
              Create Account
            </button>
          </p>
        </form>
      ) : (
        <form action={registerAction} className="auth-form">
          <MacosField label="Full name">
            <input name="name" autoComplete="name" placeholder="Juan Dela Cruz" />
          </MacosField>

          <MacosField label="Email">
            <input name="email" type="email" autoComplete="email" placeholder="name@mail.com" />
          </MacosField>

          <MacosField label="Password">
            <input name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" />
          </MacosField>

          <MacosField label="Date of birth">
            <input name="dateOfBirth" type="date" autoComplete="bday" required />
          </MacosField>

          <MacosField label="Address">
            <AddressAutocomplete name="address" />
          </MacosField>

          <MacosField label="What best describes you?">
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
          </MacosField>

          <MacosField label="Facebook profile URL">
            <input name="facebookProfileUrl" type="url" autoComplete="url" placeholder="https://facebook.com/you" />
          </MacosField>

          <MacosField label="Facebook photo URL">
            <input name="facebookPhotoUrl" type="url" placeholder="https://..." />
          </MacosField>

          <fieldset className="auth-roles">
            <legend>Your role here</legend>
            <label className="macos-choice">
              <input type="radio" name="role" value="member" defaultChecked />
              <span>
                <strong>Member</strong>
                <span className="block text-sm font-normal text-[rgba(226,234,255,0.68)]">Coached, with a program track.</span>
              </span>
            </label>
            <label className="macos-choice">
              <input type="radio" name="role" value="partner" />
              <span>
                <strong>Partner</strong>
                <span className="block text-sm font-normal text-[rgba(226,234,255,0.68)]">Leads and regional follow-through.</span>
              </span>
            </label>
          </fieldset>

          {registerState.error ? <p className="auth-error">{registerState.error}</p> : null}

          <button type="submit" className="macos-field" disabled={registerPending} style={{ width: "100%", cursor: "pointer", color: "inherit" }}>
            <span className="macos-field-copy text-left">
              <span>JDC Elite</span>
              <strong>{registerPending ? "Creating account..." : "Create account"}</strong>
            </span>
            <span className="macos-go" aria-hidden>
              <ArrowRight size={16} />
            </span>
          </button>

          <p className="auth-switch-copy">
            Already a member?{" "}
            <button type="button" onClick={showLogin} className="auth-forgot">
              Sign in
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
