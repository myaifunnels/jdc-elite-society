"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { formatPhp, mastermindOffer } from "@/data/mastermind-offer";
import { elitePaymentMethods } from "@/lib/validations";

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

export function EliteCheckoutForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [coachingHours, setCoachingHours] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [pending, setPending] = useState(false);

  const couponEligible = couponCode.trim().toUpperCase() === mastermindOffer.couponCode;
  const basePrice = couponEligible ? mastermindOffer.couponPrice : mastermindOffer.offerPrice;
  const coachingTotal = coachingHours * mastermindOffer.coachingPricePerHour;
  const price = basePrice + coachingTotal;

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
    if (!mobile.trim()) next.mobile = "Kailangan ang iyong mobile number";
    else if (!/^09\d{2}\s?\d{3}\s?\d{4}$/.test(mobile.replace(/-/g, ""))) next.mobile = "Format: 09XX XXX XXXX";
    if (password.length < 8) next.password = "Use at least 8 characters";
    if (!confirmPassword) next.confirmPassword = "Confirm your password";
    else if (password !== confirmPassword) next.confirmPassword = "Passwords do not match";
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
    const valid = step === 1 ? validateDetails() : validatePayment();
    if (!valid) return;
    setStep(nextStep);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError("");
    if (step === 1) {
      continueTo(2);
      return;
    }
    if (step === 2) {
      continueTo(3);
      return;
    }
    if (!validateDetails() || !validatePayment() || !receipt) return;

    setPending(true);
    const form = new FormData();
    form.set("fullName", fullName.trim());
    form.set("email", email.trim());
    form.set("mobile", mobile.trim());
    form.set("password", password);
    form.set("confirmPassword", confirmPassword);
    form.set("paymentMethod", paymentMethod);
    form.set("couponCode", couponCode.trim());
    form.set("coachingHours", String(coachingHours));
    form.set("receipt", receipt);

    try {
      const response = await fetch("/api/elite/checkout", { method: "POST", body: form });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setServerError(payload?.error || "Hindi na-submit ang payment. Subukan ulit.");
        setPending(false);
        return;
      }
      router.push("/elite/thank-you");
    } catch {
      setServerError("Hindi na-submit ang payment. Subukan ulit.");
      setPending(false);
    }
  }

  return (
    <form className="elite-form elite-form-premium" onSubmit={onSubmit}>
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
        <div className="elite-display" style={{ fontSize: "1.4rem", color: "var(--elite-blue-soft)" }}>
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

      <div className="elite-form-step" key={step}>
        {step === 1 ? (
          <>
            <div className="elite-field">
              <label>
                Full Name <span>*</span>
              </label>
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
              {errors.fullName ? <p className="error">{errors.fullName}</p> : null}
            </div>
            <div className="elite-field">
              <label>
                Email Address <span>*</span>
              </label>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
              {errors.email ? <p className="error">{errors.email}</p> : null}
            </div>
            <div className="elite-field">
              <label>
                Mobile Number <span>*</span>
              </label>
              <input
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                placeholder="09XX XXX XXXX"
                autoComplete="tel"
              />
              {errors.mobile ? <p className="error">{errors.mobile}</p> : null}
            </div>
            <div className="elite-field">
              <label>
                Create Password <span>*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
              />
              <small className="elite-field-hint">This password opens your private JDC dashboard.</small>
              {errors.password ? <p className="error">{errors.password}</p> : null}
            </div>
            <div className="elite-field">
              <label>
                Confirm Password <span>*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
              />
              {errors.confirmPassword ? <p className="error">{errors.confirmPassword}</p> : null}
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div className={`elite-order-bump ${coachingHours > 0 ? "is-selected" : ""}`}>
              <div className="elite-order-bump-head">
                <span className="elite-order-bump-icon" aria-hidden="true">✦</span>
                <div>
                  <small>PRIVATE COACHING UPGRADE</small>
                  <strong>Work 1-on-1 with Coach Jayson Dela Cruz</strong>
                </div>
                <span className="elite-order-bump-price">{formatPhp(mastermindOffer.coachingPricePerHour)} / hour</span>
              </div>
              <p>
                Add a focused online coaching session for personalized strategy, clarity, and direct guidance on your
                next business move.
              </p>
              <button
                type="button"
                className="elite-order-bump-toggle"
                aria-pressed={coachingHours > 0}
                onClick={() => setCoachingHours((current) => (current > 0 ? 0 : 1))}
              >
                <span aria-hidden="true">{coachingHours > 0 ? "✓" : "+"}</span>
                {coachingHours > 0 ? "Private coaching added" : "Yes, add private coaching"}
              </button>
              {coachingHours > 0 ? (
                <>
                  <div className="elite-order-bump-hours">
                    <label htmlFor="coaching-hours">How many coaching hours?</label>
                    <select
                      id="coaching-hours"
                      value={coachingHours}
                      onChange={(event) => setCoachingHours(Number(event.target.value))}
                    >
                      {Array.from({ length: 10 }, (_, index) => index + 1).map((hours) => (
                        <option key={hours} value={hours}>
                          {hours} hour{hours === 1 ? "" : "s"} · {formatPhp(hours * mastermindOffer.coachingPricePerHour)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="elite-order-bump-total">
                    <span>Updated order total</span>
                    <strong>{formatPhp(price)}</strong>
                  </div>
                </>
              ) : null}
            </div>
            <div className="elite-field">
              <label>
                Payment Method <span>*</span>
              </label>
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
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
                  placeholder="Enter SPARTANS for PHP 500 off"
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
          </>
        ) : null}

        {step === 3 ? (
          <div className="elite-review">
            <p className="elite-review-intro">Please confirm your details before we verify your payment.</p>
            <dl>
              <div><dt>Name</dt><dd>{fullName}</dd></div>
              <div><dt>Email</dt><dd>{email}</dd></div>
              <div><dt>Mobile</dt><dd>{mobile}</dd></div>
              <div><dt>Dashboard</dt><dd>Account ready after submission</dd></div>
              <div><dt>Payment</dt><dd>{paymentMethod}</dd></div>
              <div>
                <dt>Session</dt>
                <dd>{coachingHours > 0 ? `${coachingHours} hour${coachingHours === 1 ? "" : "s"} with Coach Jayson` : "Not added"}</dd>
              </div>
              <div><dt>Receipt</dt><dd>{receipt?.name}</dd></div>
              <div><dt>Mastermind</dt><dd>{formatPhp(basePrice)}</dd></div>
              {coachingHours > 0 ? <div><dt>Coaching</dt><dd>{formatPhp(coachingTotal)}</dd></div> : null}
              <div className="elite-review-total"><dt>Total</dt><dd>{formatPhp(price)}</dd></div>
            </dl>
            <p className="elite-review-note">Your dashboard opens immediately. Mastermind access unlocks after payment verification.</p>
          </div>
        ) : null}
      </div>

      {serverError ? <p className="error">{serverError}</p> : null}

      <div className="elite-form-actions">
        {step > 1 ? (
          <button className="elite-form-back" type="button" onClick={() => setStep((current) => current - 1)} disabled={pending}>
            Back
          </button>
        ) : null}
        <button className="elite-cta elite-cta-lg elite-cta-rich" type="submit" disabled={pending}>
          <span className="elite-cta-copy">
            <strong>
              {pending
                ? "Submitting securely..."
                : step === 1
                  ? "Continue to payment"
                  : step === 2
                    ? "Review my details"
                    : "Submit for verification"}
            </strong>
            <small>
              {step === 1
                ? "Next: choose payment and upload receipt"
                : step === 2
                  ? "Confirm everything before submitting"
                  : "We will verify your payment as soon as possible"}
            </small>
          </span>
          <span className="elite-cta-icon">
            <ArrowIcon />
          </span>
        </button>
      </div>
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
