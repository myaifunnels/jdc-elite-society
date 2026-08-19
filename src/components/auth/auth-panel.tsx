"use client";

import { Calendar, Image as ImageIcon, Lock, Mail, MapPin, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, type FormEvent, type ReactNode } from "react";

import { AuthFormState, loginAccount, registerAccount } from "@/app/login/actions";
import { SiteLogo } from "@/components/branding/site-logo";
import { AddressAutocomplete } from "@/components/forms/address-autocomplete";
import { BrandingSettings } from "@/lib/branding";
import { membershipTheme, type Membership } from "@/lib/membership";
import { audienceOptions } from "@/lib/validations";

const initialState: AuthFormState = {};

const registerSteps = [
  {
    title: "Account",
    copy: "Create the login you will use for your dashboard.",
  },
  {
    title: "Profile",
    copy: "A few details so we can put you in the right room.",
  },
  {
    title: "Connect",
    copy: "Optional Facebook links for your member profile.",
  },
];

function AuthField({
  label,
  icon,
  className,
  children,
}: {
  label: string;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className ? `auth-field ${className}` : "auth-field"}>
      <span>{label}</span>
      <span className="auth-input-wrap">
        {icon}
        {children}
      </span>
    </label>
  );
}

function fieldValue(form: HTMLFormElement, name: string) {
  return String(new FormData(form).get(name) ?? "").trim();
}

function fieldValues(form: HTMLFormElement, name: string) {
  return [...new FormData(form).getAll(name)].map((value) => String(value));
}

export function AuthPanel({
  branding,
  mode,
}: {
  branding: BrandingSettings;
  mode: "login" | "register";
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState("");
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loginState, loginAction, loginPending] = useActionState(loginAccount, initialState);
  const [registerState, registerAction, registerPending] = useActionState(registerAccount, initialState);

  const stepCopy = registerSteps[step];
  const windowTitle = mode === "login" ? "Sign In" : `Register — ${stepCopy.title}`;

  useEffect(() => {
    if (mode !== "register") {
      return;
    }

    const root = document.documentElement;
    const previous = root.dataset.membership ?? "";
    const next = membershipTheme(memberships);
    if (next) {
      root.dataset.membership = next;
    } else {
      delete root.dataset.membership;
    }

    return () => {
      if (previous) {
        root.dataset.membership = previous;
      } else {
        delete root.dataset.membership;
      }
    };
  }, [memberships, mode]);

  function toggleMembership(value: Membership) {
    setMemberships((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  function goTo(next: number) {
    setStepError("");
    setStep(next);
  }

  function validateStep(form: HTMLFormElement, current: number) {
    if (current === 0) {
      if (fieldValue(form, "name").length < 2) return "Enter your full name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue(form, "email"))) return "Enter a valid email.";
      if (fieldValue(form, "password").length < 8) return "Use at least 8 characters.";
      if (fieldValue(form, "password") !== fieldValue(form, "confirmPassword")) return "Passwords do not match.";
      return "";
    }

    if (current === 1) {
      if (!fieldValue(form, "dateOfBirth")) return "Enter your date of birth.";
      if (fieldValue(form, "address").length < 5) return "Enter your address.";
      if (!fieldValue(form, "bestDescribesYou")) return "Tell us what best describes you.";
      if (fieldValues(form, "memberships").length < 1) return "Choose Spartans, JES Member, or both.";
      return "";
    }

    return "";
  }

  function onRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    if (step < registerSteps.length - 1) {
      event.preventDefault();
      const error = validateStep(event.currentTarget, step);
      if (error) {
        setStepError(error);
        return;
      }
      goTo(step + 1);
    }
  }

  return (
    <div className={mode === "login" ? "macos-window is-signin" : "macos-window"}>
      <header className="macos-titlebar">
        <p className="macos-title">{windowTitle}</p>
      </header>

      <div className="macos-toolbar">
        <div className="macos-segment" role="tablist" aria-label="Account">
          <button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => router.replace("/login")}>
            Sign In
          </button>
          <button
            type="button"
            className={mode === "register" ? "is-active" : ""}
            onClick={() => router.replace("/register")}
          >
            Register
          </button>
        </div>
      </div>

      <div className="macos-body">
        <SiteLogo branding={branding} href="/" compact={Boolean(branding.logoUrl)} />

        {mode === "login" ? (
          <form action={loginAction} className="auth-form auth-form-login">
            <p className="macos-lead">Sign in to open the dashboard that matches your role.</p>

            <AuthField label="Email" icon={<Mail size={15} aria-hidden />}>
              <input name="email" type="email" autoComplete="username" placeholder="name@mail.com" />
            </AuthField>

            <AuthField label="Password" icon={<Lock size={15} aria-hidden />}>
              <input name="password" type="password" autoComplete="current-password" placeholder="••••••••" />
            </AuthField>

            <div className="auth-row">
              <label className="auth-check">
                <input type="checkbox" name="remember" />
                Remember me
              </label>
              <Link href="/forgot-password" className="auth-forgot">
                Forgot password?
              </Link>
            </div>

            {loginState.error ? <p className="auth-error">{loginState.error}</p> : null}

            <div className="macos-actions">
              <p className="auth-switch-copy">
                Not a member yet?{" "}
                <Link href="/register" className="auth-forgot">
                  Register
                </Link>
              </p>
              <button type="submit" className="macos-btn macos-btn-primary" disabled={loginPending}>
                {loginPending ? "Signing In..." : "Sign In"}
              </button>
            </div>
          </form>
        ) : (
          <form action={registerAction} className="auth-form auth-form-grid" noValidate onSubmit={onRegisterSubmit}>
            <div className="macos-stepper" aria-label="Registration steps">
              {registerSteps.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  className={index === step ? "is-active" : index < step ? "is-done" : ""}
                  onClick={() => {
                    if (index < step) goTo(index);
                  }}
                >
                  <span>{index + 1}</span>
                  {item.title}
                </button>
              ))}
            </div>

            <div className="macos-lead">
              <p className="macos-kicker">
                Step {step + 1} of {registerSteps.length}
              </p>
              <p>{stepCopy.copy}</p>
            </div>

            <div className={step === 0 ? "macos-step is-active" : "macos-step"} hidden={step !== 0}>
              <AuthField label="Full name" icon={<UserRound size={15} aria-hidden />}>
                <input name="name" autoComplete="name" placeholder="Juan Dela Cruz" />
              </AuthField>
              <AuthField label="Email address" icon={<Mail size={15} aria-hidden />}>
                <input name="email" type="email" autoComplete="email" placeholder="name@mail.com" />
              </AuthField>
              <AuthField label="Password" icon={<Lock size={15} aria-hidden />}>
                <input name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" />
              </AuthField>
              <AuthField label="Confirm password" icon={<Lock size={15} aria-hidden />}>
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                />
              </AuthField>
            </div>

            <div className={step === 1 ? "macos-step is-active" : "macos-step"} hidden={step !== 1}>
              <AuthField label="Date of birth" icon={<Calendar size={15} aria-hidden />}>
                <input name="dateOfBirth" type="date" autoComplete="bday" />
              </AuthField>
              <AuthField label="Address" icon={<MapPin size={15} aria-hidden />}>
                <AddressAutocomplete name="address" placeholder="Street, city, province or country" />
              </AuthField>
              <AuthField label="What best describes you?" className="auth-span-2">
                <select name="bestDescribesYou" defaultValue="">
                  <option value="" disabled>
                    Select one
                  </option>
                  {audienceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </AuthField>
              <fieldset className="auth-roles">
                <legend>Your role here</legend>
                <div className="auth-roles-row">
                  <label>
                    <input
                      type="checkbox"
                      name="memberships"
                      value="spartan"
                      checked={memberships.includes("spartan")}
                      onChange={() => toggleMembership("spartan")}
                    />
                    Spartans
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="memberships"
                      value="jes"
                      checked={memberships.includes("jes")}
                      onChange={() => toggleMembership("jes")}
                    />
                    JES Member
                  </label>
                </div>
                <p className="auth-note">
                  JES means JDC Elite Society. Select Spartans, JES Member, or both if you belong to each.
                </p>
              </fieldset>
            </div>

            <div className={step === 2 ? "macos-step is-active" : "macos-step"} hidden={step !== 2}>
              <AuthField label="Facebook profile URL" icon={<UserRound size={15} aria-hidden />}>
                <input
                  name="facebookProfileUrl"
                  type="url"
                  autoComplete="url"
                  placeholder="https://facebook.com/your.profile"
                />
              </AuthField>
              <AuthField label="Facebook profile picture URL" icon={<ImageIcon size={15} aria-hidden />}>
                <input name="facebookPhotoUrl" type="url" placeholder="https://... your Facebook photo" />
              </AuthField>
            </div>

            {stepError || registerState.error ? (
              <p className="auth-error">{stepError || registerState.error}</p>
            ) : null}

            <div className="macos-actions">
              {step === 0 ? (
                <p className="auth-switch-copy">
                  Already a member?{" "}
                  <Link href="/login" className="auth-forgot">
                    Sign In
                  </Link>
                </p>
              ) : (
                <button type="button" className="macos-btn macos-btn-secondary" onClick={() => goTo(step - 1)}>
                  Go Back
                </button>
              )}
              <button type="submit" className="macos-btn macos-btn-primary" disabled={registerPending}>
                {step < registerSteps.length - 1
                  ? "Continue"
                  : registerPending
                    ? "Creating Account..."
                    : "Create Account"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
