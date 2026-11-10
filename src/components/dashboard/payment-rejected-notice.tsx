"use client";

import { useActionState, useRef, useState } from "react";
import { AlertTriangle, Upload } from "lucide-react";
import Link from "next/link";

import { reuploadReceiptAction, SupportActionState } from "@/app/dashboard/support/actions";
import { EliteCheckoutOrder } from "@/lib/elite-checkout-store";
import { formatPhp } from "@/lib/pay-cycle";

const initialState: SupportActionState = {};

export function PaymentRejectedNotice({ order }: { order: EliteCheckoutOrder }) {
  const [state, action, pending] = useActionState(reuploadReceiptAction, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");

  return (
    <section className="payment-rejected-notice">
      <div className="payment-rejected-icon" aria-hidden>
        <AlertTriangle size={32} />
      </div>
      <h2>We&apos;re unable to process your payment</h2>
      <p className="payment-rejected-lead">
        Your payment screenshot could not be verified, so University access is locked. Please re-upload a
        clear screenshot of your payment receipt so our team can review it again.
      </p>

      <dl className="payment-rejected-meta">
        <div>
          <dt>Order</dt>
          <dd>JDC Mastermind{order.coachingHours > 0 ? " + Private Coaching" : ""}</dd>
        </div>
        <div>
          <dt>Amount</dt>
          <dd>{formatPhp(order.price)}</dd>
        </div>
        <div>
          <dt>Payment method</dt>
          <dd>{order.paymentMethod}</dd>
        </div>
      </dl>

      {state.success ? (
        <p className="payment-rejected-success">{state.success}</p>
      ) : (
        <form action={action} className="payment-reupload-form">
          <input type="hidden" name="orderId" value={order.id} />
          <input
            ref={inputRef}
            type="file"
            name="receipt"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="sr-only"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
          />
          <button
            type="button"
            className="payment-reupload-drop pressable"
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={20} aria-hidden />
            <span>{fileName || "Tap to upload payment screenshot · JPG, PNG, PDF · Max 5MB"}</span>
          </button>
          <div className="macos-actions">
            <button type="submit" className="macos-btn macos-btn-primary" disabled={pending}>
              {pending ? "Uploading…" : "Re-upload receipt"}
            </button>
            <Link href="/dashboard/support?category=payment" className="macos-btn macos-btn-secondary">
              Contact Support
            </Link>
          </div>
          {state.error ? <p className="support-form-error">{state.error}</p> : null}
        </form>
      )}
    </section>
  );
}
