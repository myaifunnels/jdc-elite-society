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

export function EliteCheckoutForm() {
  const router = useRouter();
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

  function validate() {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = "Kailangan ang iyong buong pangalan";
    if (!email.trim()) next.email = "Kailangan ang iyong email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Hindi wastong email format";
    if (!mobile.trim()) next.mobile = "Kailangan ang iyong mobile number";
    else if (!/^09\d{2}\s?\d{3}\s?\d{4}$/.test(mobile.replace(/-/g, ""))) next.mobile = "Format: 09XX XXX XXXX";
    if (!paymentMethod) next.paymentMethod = "Pumili ng payment method";
    if (!receipt) next.receipt = "I-upload ang iyong resibo";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError("");
    if (!validate() || !receipt) return;

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
        <div className="elite-display" style={{ fontSize: "1.4rem", color: "var(--elite-electric)" }}>
          {formatPhp(price)}
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label>
          Full Name <span>*</span>
        </label>
        <input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
        {errors.fullName ? <p className="error">{errors.fullName}</p> : null}
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label>
          Email Address <span>*</span>
        </label>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        {errors.email ? <p className="error">{errors.email}</p> : null}
      </div>
      <div style={{ marginBottom: "1rem" }}>
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
      <div style={{ marginBottom: "1rem" }}>
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
      <div style={{ marginBottom: "1rem" }}>
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
      <div style={{ marginBottom: "1.25rem" }}>
        <label>
          Coupon Code <em style={{ fontWeight: 400, color: "var(--elite-muted)" }}>(optional)</em>
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
          <p style={{ color: "var(--elite-teal)", fontSize: "0.85rem", marginTop: "0.4rem" }}>
            SPARTANS coupon applied! −PHP {mastermindOffer.couponDiscount}
          </p>
        ) : null}
        {couponError ? <p className="error">{couponError}</p> : null}
      </div>

      {serverError ? <p className="error">{serverError}</p> : null}

      <button className="elite-cta elite-cta-lg" type="submit" disabled={pending} style={{ width: "100%" }}>
        {pending ? "Verifying details..." : "Submit payment for verification"}
      </button>
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
