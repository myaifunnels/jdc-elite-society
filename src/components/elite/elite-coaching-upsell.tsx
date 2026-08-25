"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PaymentInstructions } from "@/components/elite/elite-checkout-form";
import { formatPhp, mastermindOffer } from "@/data/mastermind-offer";
import { elitePaymentMethods } from "@/lib/validations";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}

export function EliteCoachingUpsell({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [claiming, setClaiming] = useState(false);
  const [coachingMode, setCoachingMode] = useState<"online" | "in-person">("online");
  const [coachingHours, setCoachingHours] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const pricePerHour =
    coachingMode === "in-person" ? mastermindOffer.inPersonCoachingPricePerHour : mastermindOffer.coachingPricePerHour;
  const total = coachingHours * pricePerHour;

  const receiptLabel = useMemo(() => {
    if (!receipt) return "Upload your receipt · JPG, PNG, PDF · Max 5MB";
    return receipt.name;
  }, [receipt]);

  function skip() {
    router.push("/elite/thank-you");
  }

  async function submitOffer() {
    setError("");
    if (!paymentMethod) {
      setError("Pumili ng payment method");
      return;
    }
    if (!receipt) {
      setError("I-upload ang iyong resibo");
      return;
    }

    setPending(true);
    const form = new FormData();
    form.set("coachingMode", coachingMode);
    form.set("coachingHours", String(coachingHours));
    form.set("paymentMethod", paymentMethod);
    form.set("receipt", receipt);

    try {
      const response = await fetch("/api/elite/coaching-offer", { method: "POST", body: form });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(payload?.error || "Hindi na-submit ang payment. Subukan ulit.");
        setPending(false);
        return;
      }
      router.push("/elite/thank-you");
    } catch {
      setError("Hindi na-submit ang payment. Subukan ulit.");
      setPending(false);
    }
  }

  return (
    <main className="elite-offer elite-checkout-page">
      <div className="elite-checkout-glow" aria-hidden="true" />
      <section className="elite-checkout-hero">
        <div className="elite-shell">
          <p className="elite-kicker elite-center">WAIT, {firstName.toUpperCase()} — ONE-TIME OFFER</p>
          <h1 className="elite-display">Add direct 1-on-1 time with Coach JDC.</h1>
          <p className="elite-sub elite-center">
            You&apos;re already in the Mastermind. This exclusive offer is only shown once, right now — grab it or skip
            it and keep your Mastermind access exactly as is.
          </p>

          <div className="elite-checkout-layout">
            <aside className="elite-checkout-summary">
              <div className="elite-glass elite-order-card">
                <p className="elite-kicker">CHOOSE YOUR FORMAT</p>
                <div className="elite-coaching-modes" aria-label="Coaching format">
                  <button
                    type="button"
                    className={coachingMode === "online" ? "is-selected" : ""}
                    onClick={() => setCoachingMode("online")}
                  >
                    <span>Online Coaching</span>
                    <strong>{formatPhp(mastermindOffer.coachingPricePerHour)} / hour</strong>
                  </button>
                  <button
                    type="button"
                    className={coachingMode === "in-person" ? "is-selected" : ""}
                    onClick={() => setCoachingMode("in-person")}
                  >
                    <span>Face to Face Coaching</span>
                    <strong>{formatPhp(mastermindOffer.inPersonCoachingPricePerHour)} / hour</strong>
                  </button>
                </div>
                <div className="elite-order-bump-hours">
                  <label htmlFor="coaching-hours">How many hours?</label>
                  <select
                    id="coaching-hours"
                    value={coachingHours}
                    onChange={(event) => setCoachingHours(Number(event.target.value))}
                  >
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((hours) => (
                      <option key={hours} value={hours}>
                        {hours} hour{hours === 1 ? "" : "s"} · {formatPhp(hours * pricePerHour)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="elite-order-total is-final">
                  <span>Coaching total</span>
                  <strong>{formatPhp(total)}</strong>
                </div>
              </div>

              {claiming ? (
                <div className="elite-glass elite-payment-card">
                  <p className="elite-kicker">HOW PAYMENT WORKS</p>
                  <PaymentInstructions />
                </div>
              ) : null}
            </aside>

            <div className="elite-form elite-form-premium">
              <div className="elite-form-brandbar">
                <span className="elite-form-traffic" aria-hidden="true">
                  <i /><i /><i />
                </span>
                <span className="elite-form-monogram">JDC</span>
                <span className="elite-form-brandcopy">
                  <strong>1-on-1 Coaching</strong>
                  <small>Exclusive offer · Shown once</small>
                </span>
              </div>

              {!claiming ? (
                <>
                  <p style={{ marginBottom: "1.25rem" }}>
                    Work directly with Coach Jayson Dela Cruz — strategy, accountability, and honest feedback on your
                    next move. This offer disappears once you leave this page.
                  </p>
                  <div className="elite-form-actions">
                    <button className="elite-cta elite-cta-lg elite-cta-rich" type="button" onClick={() => setClaiming(true)}>
                      <span className="elite-cta-copy">
                        <strong>Grab this exclusive offer</strong>
                        <small>Add {formatPhp(total)} of private coaching</small>
                      </span>
                      <span className="elite-cta-icon">
                        <ArrowIcon />
                      </span>
                    </button>
                  </div>
                  <button type="button" className="elite-ghost" onClick={skip} disabled={pending}>
                    Skip for now — just get my JDC Mastermind access
                  </button>
                </>
              ) : (
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
                  </div>
                  {error ? <p className="error">{error}</p> : null}
                  <div className="elite-form-actions">
                    <button className="elite-form-back" type="button" onClick={() => setClaiming(false)} disabled={pending}>
                      Back
                    </button>
                    <button className="elite-cta elite-cta-lg elite-cta-rich" type="button" onClick={submitOffer} disabled={pending}>
                      <span className="elite-cta-copy">
                        <strong>{pending ? "Submitting securely..." : "Confirm coaching payment"}</strong>
                        <small>{formatPhp(total)} · {coachingHours} hour{coachingHours === 1 ? "" : "s"}</small>
                      </span>
                      <span className="elite-cta-icon">
                        <ArrowIcon />
                      </span>
                    </button>
                  </div>
                  <button type="button" className="elite-ghost" onClick={skip} disabled={pending}>
                    Never mind — skip and continue
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
