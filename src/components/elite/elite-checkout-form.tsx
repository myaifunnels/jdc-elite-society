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
  const [paymentMethod, setPaymentMethod] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [pending, setPending] = useState(false);

  const price = couponApplied ? mastermindOffer.couponPrice : mastermindOffer.offerPrice;

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
    form.set("paymentMethod", paymentMethod);
    form.set("couponCode", couponCode.trim());
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
    <form className="elite-form elite-glass" onSubmit={onSubmit}>
      <p className="elite-kicker" style={{ textAlign: "left" }}>
        COMPLETE YOUR ACCESS
      </p>
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
          </>
        ) : null}

        {step === 2 ? (
          <>
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
              <div><dt>Payment</dt><dd>{paymentMethod}</dd></div>
              <div><dt>Receipt</dt><dd>{receipt?.name}</dd></div>
              <div><dt>Total</dt><dd>{formatPhp(price)}</dd></div>
            </dl>
            <p className="elite-review-note">Payment details are reviewed manually. Access is sent after verification.</p>
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
