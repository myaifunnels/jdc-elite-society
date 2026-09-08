"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { PhoneField } from "@/components/forms/phone-field";
import type { SignedInCheckoutUser } from "@/components/elite/elite-checkout-page";
import { formatPhp, mastermindOffer } from "@/data/mastermind-offer";
import { findCountry } from "@/lib/countries";
import { elitePaymentMethods } from "@/lib/validations";

const DRAFT_STORAGE_KEY = "elite-checkout-draft";

type CheckoutDraft = { fullName: string; email: string; phoneCountry: string; phoneNational: string };

function readDraft(): CheckoutDraft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CheckoutDraft) : null;
  } catch {
    return null;
  }
}

function writeDraft(draft: CheckoutDraft) {
  try {
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Private/restricted browser contexts can throw on storage access -- the visitor just
    // retypes their details after the Google redirect instead of losing the whole checkout.
  }
}

function nationalNumberFor(phoneCountry: string, phone: string) {
  const dial = findCountry(phoneCountry).dial;
  return phone.startsWith(dial) ? phone.slice(dial.length).trim() : phone;
}

function Check({ className = "" }: { className?: string }) {
  return (
    <span className={`elite-dot ${className}`} aria-hidden="true">
      ✓
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}

export function EliteCheckoutForm({ signedInUser }: { signedInUser: SignedInCheckoutUser | null }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  // A signed-in session (from the server) is authoritative; otherwise fall back to whatever
  // draft was saved just before redirecting to Google (see "Continue with Google" below), read
  // once via a lazy initializer rather than an effect + setState pair.
  const initialDraft = useMemo(() => (signedInUser ? null : readDraft()), [signedInUser]);
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(signedInUser?.name ?? initialDraft?.fullName ?? "");
  const [email, setEmail] = useState(signedInUser?.email ?? initialDraft?.email ?? "");
  const [phoneDefaults, setPhoneDefaults] = useState(() => {
    if (signedInUser) {
      return { iso: signedInUser.phoneCountry || "PH", national: nationalNumberFor(signedInUser.phoneCountry, signedInUser.phone) };
    }
    if (initialDraft) {
      return { iso: initialDraft.phoneCountry, national: initialDraft.phoneNational };
    }
    return { iso: "PH", national: "" };
  });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [pending, setPending] = useState(false);

  const [signedIn, setSignedIn] = useState(Boolean(signedInUser));
  const [accountExists, setAccountExists] = useState(false);
  const [checkingAccount, setCheckingAccount] = useState(false);
  const [signinPassword, setSigninPassword] = useState("");
  const [signinError, setSigninError] = useState("");
  const [signinPending, setSigninPending] = useState(false);

  const couponEligible = couponCode.trim().toUpperCase() === mastermindOffer.couponCode;
  const price = couponEligible ? mastermindOffer.couponPrice : mastermindOffer.offerPrice;

  const receiptLabel = useMemo(() => {
    if (!receipt) return "Upload your receipt · JPG, PNG, PDF · Max 5MB";
    return receipt.name;
  }, [receipt]);

  function applyCoupon() {
    if (couponCode.trim().toUpperCase() === mastermindOffer.couponCode) {
      setCouponApplied(true);
      setCouponError("");
      return;
    }
    setCouponApplied(false);
    setCouponError("Invalid coupon code");
  }

  function validateDetails() {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = "Kailangan ang iyong buong pangalan";
    if (!email.trim()) next.email = "Kailangan ang iyong email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Hindi wastong email format";
    const phoneNational = formRef.current?.elements.namedItem("phoneNational") as HTMLInputElement | null;
    if (!phoneNational?.value.trim()) next.mobile = "Kailangan ang iyong mobile number";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validatePayment() {
    const next: Record<string, string> = {};
    if (!paymentMethod) next.paymentMethod = "Pumili ng payment method";
    if (!receipt) next.receipt = "I-upload ang iyong resibo";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function continueTo(nextStep: number) {
    setServerError("");
    const valid = validatePayment();
    if (!valid) return;
    setStep(nextStep);
  }

  function currentPhoneNational() {
    const input = formRef.current?.elements.namedItem("phoneNational") as HTMLInputElement | null;
    return input?.value.trim() ?? "";
  }

  function currentPhoneCountry() {
    const input = formRef.current?.elements.namedItem("phoneCountry") as HTMLInputElement | null;
    return input?.value.trim() || "PH";
  }

  async function goToPaymentStep() {
    setServerError("");
    if (!validateDetails()) return;

    if (signedIn) {
      setStep(2);
      return;
    }

    setCheckingAccount(true);
    try {
      const response = await fetch("/api/elite/check-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          phoneCountry: currentPhoneCountry(),
          phoneNational: currentPhoneNational(),
        }),
      });
      const payload = (await response.json().catch(() => null)) as { exists?: boolean } | null;
      if (payload?.exists) {
        setAccountExists(true);
        return;
      }
      setStep(2);
    } catch {
      // If the check itself fails, don't block checkout on it -- the final submit still
      // safely catches an existing account server-side.
      setStep(2);
    } finally {
      setCheckingAccount(false);
    }
  }

  function resetAccountCheck() {
    setAccountExists(false);
    setSigninError("");
    setSigninPassword("");
  }

  async function handleSignin() {
    setSigninError("");
    if (!signinPassword) {
      setSigninError("Enter your password.");
      return;
    }

    setSigninPending(true);
    try {
      const response = await fetch("/api/elite/checkout/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: signinPassword }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok: true; name: string; email: string; phone: string; phoneCountry: string }
        | { ok: false; error: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setSigninError((payload && !payload.ok && payload.error) || "That didn't work. Try again.");
        setSigninPending(false);
        return;
      }

      setFullName(payload.name);
      setEmail(payload.email);
      setPhoneDefaults({ iso: payload.phoneCountry || "PH", national: nationalNumberFor(payload.phoneCountry, payload.phone) });
      setSignedIn(true);
      setAccountExists(false);
      setSigninPassword("");
      setStep(2);
    } catch {
      setSigninError("That didn't work. Try again.");
    } finally {
      setSigninPending(false);
    }
  }

  function continueWithGoogle() {
    writeDraft({
      fullName: fullName.trim(),
      email: email.trim(),
      phoneCountry: currentPhoneCountry(),
      phoneNational: currentPhoneNational(),
    });
    // Deliberately a hard navigation, not router.push: this hands off to an API route (Google's
    // OAuth dialog), not a Next.js page, so client-side routing doesn't apply here.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/api/auth/google?next=%2Felite%2Fcheckout");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError("");
    if (step === 1) {
      await goToPaymentStep();
      return;
    }
    if (step === 2) {
      continueTo(3);
      return;
    }
    if (!validateDetails() || !validatePayment() || !receipt || !formRef.current) return;

    setPending(true);
    const form = new FormData(formRef.current);
    form.set("fullName", fullName.trim());
    form.set("email", email.trim());
    form.set("paymentMethod", paymentMethod);
    form.set("couponCode", couponCode.trim());
    form.set("receipt", receipt);

    try {
      const response = await fetch("/api/elite/checkout", { method: "POST", body: form });
      const payload = (await response.json().catch(() => null)) as { error?: string; accountExists?: boolean } | null;
      if (!response.ok) {
        if (payload?.accountExists) {
          setStep(1);
          setAccountExists(true);
          setPending(false);
          return;
        }
        setServerError(payload?.error || "Hindi na-submit ang payment. Subukan ulit.");
        setPending(false);
        return;
      }
      router.push("/elite/coaching-offer");
    } catch {
      setServerError("Hindi na-submit ang payment. Subukan ulit.");
      setPending(false);
    }
  }

  return (
    <form ref={formRef} className="elite-form elite-form-premium" onSubmit={onSubmit}>
      <div className="elite-form-brandbar">
        <span className="elite-form-monogram">JDC</span>
        <span className="elite-form-brandcopy">
          <strong>Mastermind Application</strong>
          <small>Private enrollment · Secure submission</small>
        </span>
        <span className="elite-form-secure"><i /> Secure</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem" }}>
        <div>
          <strong className="elite-display" style={{ fontSize: "1rem" }}>
            JDC Mastermind
          </strong>
          <p style={{ margin: "0.2rem 0 0" }}>Full Mastermind Access · Lifetime</p>
        </div>
        <div className="elite-display" style={{ fontSize: "1.4rem", color: "#0b3fae" }}>
          {formatPhp(price)}
        </div>
      </div>

      <div className="elite-form-progress" aria-label={`Checkout step ${step} of 3`}>
        {["Details", "Payment", "Review"].map((label, index) => {
          const number = index + 1;
          return (
            <div className={number === step ? "is-current" : number < step ? "is-complete" : ""} key={label}>
              <span>{number < step ? "✓" : number}</span>
              <small>{label}</small>
            </div>
          );
        })}
      </div>

      <div className="elite-form-step-heading">
        <div>
          <span>STEP {step} OF 3</span>
          <strong>{step === 1 ? "Tell us about you" : step === 2 ? "Confirm your payment" : "Review your application"}</strong>
        </div>
        <small>{step === 1 ? "About 1 minute" : step === 2 ? "Receipt required" : "Final check"}</small>
      </div>

      <div className="elite-form-step" hidden={step !== 1}>
        {signedIn ? (
          <p className="elite-signedin-badge">
            Signed in as <strong>{email}</strong>
          </p>
        ) : null}
        <div className="elite-field">
          <label>
            Full Name <span>*</span>
          </label>
          <input name="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
          {errors.fullName ? <p className="error">{errors.fullName}</p> : null}
        </div>
        <div className="elite-field">
          <label>
            Email Address <span>*</span>
          </label>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (accountExists) resetAccountCheck();
            }}
            autoComplete="email"
            disabled={signedIn}
          />
          {errors.email ? <p className="error">{errors.email}</p> : null}
        </div>
        <div className="elite-field">
          <label>
            Mobile Number <span>*</span>
          </label>
          <PhoneField key={`${phoneDefaults.iso}-${phoneDefaults.national}`} defaultIso={phoneDefaults.iso} defaultNational={phoneDefaults.national} />
          {errors.mobile ? <p className="error">{errors.mobile}</p> : null}
        </div>

        {accountExists ? (
          <div className="elite-signin-panel">
            <p className="elite-signin-panel-title">You already have an account with this email.</p>
            <p className="elite-signin-panel-copy">Sign in to continue your application under your existing account.</p>

            <button type="button" className="elite-google-btn" onClick={continueWithGoogle}>
              Continue with Google
            </button>

            <div className="elite-signin-divider">or sign in with your password</div>

            <div className="elite-field">
              <label>Password</label>
              <input
                type="password"
                value={signinPassword}
                onChange={(event) => setSigninPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>
            {signinError ? <p className="error">{signinError}</p> : null}

            <div className="elite-signin-actions">
              <button type="button" className="elite-form-back" onClick={resetAccountCheck} disabled={signinPending}>
                Use a different email
              </button>
              <button type="button" className="elite-cta" onClick={handleSignin} disabled={signinPending}>
                {signinPending ? "Signing in..." : "Sign in and continue"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {step === 2 ? (
      <div className="elite-form-step" key={step}>
        <div className="elite-field">
          <label>
            Payment Method <span>*</span>
          </label>
          <select
            name="paymentMethod"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
          >
            <option value="">Piliin ang payment method</option>
            {elitePaymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
          {errors.paymentMethod ? <p className="error">{errors.paymentMethod}</p> : null}
        </div>
        <div className="elite-field">
          <label>
            Upload Receipt Screenshot <span>*</span>
          </label>
          <label className="elite-upload">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
            />
            {receiptLabel}
          </label>
          {errors.receipt ? <p className="error">{errors.receipt}</p> : null}
        </div>
        <div className="elite-field">
          <label>
            Coupon Code <em>(optional)</em>
          </label>
          <div className="elite-coupon">
            <input
              value={couponCode}
              onChange={(event) => {
                setCouponCode(event.target.value.toUpperCase());
                setCouponApplied(false);
                setCouponError("");
              }}
              placeholder="Enter your coupon code"
            />
            <button type="button" onClick={applyCoupon}>
              APPLY
            </button>
          </div>
          {couponApplied ? (
            <p className="elite-coupon-success">SPARTANS coupon applied. Save PHP {mastermindOffer.couponDiscount}.</p>
          ) : null}
          {couponError ? <p className="error">{couponError}</p> : null}
        </div>
      </div>
      ) : null}

      {step === 3 ? (
      <div className="elite-form-step" key={step}>
        <div className="elite-review">
          <p className="elite-review-intro">Please confirm your details before we verify your payment.</p>
          <dl>
            <div><dt>Name</dt><dd>{fullName}</dd></div>
            <div><dt>Email</dt><dd>{email}</dd></div>
            <div><dt>Dashboard</dt><dd>Access opens right after you submit</dd></div>
            <div><dt>Payment</dt><dd>{paymentMethod}</dd></div>
            <div><dt>Receipt</dt><dd>{receipt?.name}</dd></div>
            <div className="elite-review-total"><dt>Total</dt><dd>{formatPhp(price)}</dd></div>
          </dl>
          <p className="elite-review-note">
            Your dashboard and Mastermind access open instantly after you submit. We verify your receipt in the
            background.
          </p>
        </div>
      </div>
      ) : null}

      {serverError ? <p className="error">{serverError}</p> : null}

      {!(step === 1 && accountExists) ? (
      <div className="elite-form-actions">
        {step > 1 ? (
          <button className="elite-form-back" type="button" onClick={() => setStep((current) => current - 1)} disabled={pending}>
            Back
          </button>
        ) : null}
        <button className="elite-cta elite-cta-lg elite-cta-rich" type="submit" disabled={pending || checkingAccount}>
          <span className="elite-cta-copy">
            <strong>
              {pending
                ? "Submitting securely..."
                : checkingAccount
                  ? "Checking..."
                  : step === 1
                    ? "Continue to payment"
                    : step === 2
                      ? "Review my details"
                      : "Submit and unlock access"}
            </strong>
            <small>
              {step === 1
                ? "Next: choose payment and upload receipt"
                : step === 2
                  ? "Confirm everything before submitting"
                  : "Your access opens the moment you submit"}
            </small>
          </span>
          <span className="elite-cta-icon">
            <ArrowIcon />
          </span>
        </button>
      </div>
      ) : null}
    </form>
  );
}

export function PaymentInstructions() {
  const { bpi, gcash } = mastermindOffer.payments;
  return (
    <div>
      {[
        {
          n: "1",
          title: "SEND YOUR PAYMENT",
          body: (
            <>
              <div className="elite-account">
                {bpi.label}
                <div>{bpi.name}</div>
                <strong>{bpi.number}</strong>
              </div>
              <div style={{ height: 1, background: "var(--elite-line)", margin: "0.9rem 0" }} />
              <div className="elite-account">
                {gcash.label}
                <div>{gcash.name}</div>
                <strong>{gcash.number}</strong>
              </div>
            </>
          ),
        },
        {
          n: "2",
          title: "SAVE YOUR RECEIPT",
          body: <p>Take a clear screenshot of your payment confirmation after the transfer is complete.</p>,
        },
        {
          n: "3",
          title: "UPLOAD AND CONFIRM",
          body: (
            <p>
              Upload the screenshot below and double-check your name and email. We&apos;ll use those details to verify
              your payment and send your access.
            </p>
          ),
        },
      ].map((step) => (
        <div className="elite-pay-row" key={step.n}>
          <span className="elite-step">{step.n}</span>
          <div>
            <h4>{step.title}</h4>
            {step.body}
          </div>
        </div>
      ))}
    </div>
  );
}

export function IncludeList({ items }: { items: readonly string[] }) {
  return (
    <ul className="elite-list">
      {items.map((item) => (
        <li key={item}>
          <Check />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
