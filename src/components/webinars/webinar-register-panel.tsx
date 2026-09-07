"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

import { mastermindOffer } from "@/data/mastermind-offer";

const PHOTO_TYPES = "image/jpeg,image/png,image/webp,image/gif";
const RECEIPT_TYPES = "image/jpeg,image/png,image/webp,application/pdf";

type SubmitResult = { ok: true; tier: "free" | "paid_overflow" } | { ok: false; error: string };

export function WebinarRegisterPanel({
  webinarId,
  freeSeatsLeft,
  overflowPrice,
}: {
  webinarId: string;
  freeSeatsLeft: number;
  overflowPrice: number;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const isOverflow = freeSeatsLeft <= 0;

  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [confirmedTier, setConfirmedTier] = useState<"free" | "paid_overflow" | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [receiptName, setReceiptName] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;
    setError("");

    if (isOverflow) {
      const receipt = formRef.current.elements.namedItem("receipt") as HTMLInputElement | null;
      if (!receipt?.files?.[0]) {
        setError("Upload your payment receipt to reserve an overflow seat.");
        return;
      }
    }

    setPending(true);
    const body = new FormData(formRef.current);

    try {
      const response = await fetch(`/api/webinars/${webinarId}/register`, { method: "POST", body });
      const payload = (await response.json().catch(() => null)) as SubmitResult | null;
      if (!response.ok || !payload || !("ok" in payload) || !payload.ok) {
        setError((payload && "error" in payload && payload.error) || "We couldn't submit your registration. Try again.");
        setPending(false);
        return;
      }
      setConfirmedTier(payload.tier);
      router.refresh();
    } catch {
      setError("We couldn't submit your registration. Try again.");
      setPending(false);
    }
  }

  if (confirmedTier === "free") {
    return (
      <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-5 backdrop-blur-xl">
        <p className="m-0 text-lg font-extrabold text-white">You&rsquo;re in!</p>
        <p className="mt-1.5 text-sm text-white/70">
          Your free seat is confirmed. Keep an eye on your email and phone for the join link.
        </p>
      </div>
    );
  }

  if (confirmedTier === "paid_overflow") {
    return (
      <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-5 backdrop-blur-xl">
        <p className="m-0 text-lg font-extrabold text-white">Payment received — pending verification.</p>
        <p className="mt-1.5 text-sm text-white/70">
          We&rsquo;ll confirm your overflow seat shortly after our team reviews your receipt.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="grid gap-3 rounded-2xl border border-white/15 bg-white/[0.07] p-5 backdrop-blur-xl sm:max-w-[420px]"
    >
      {isOverflow ? (
        <p className="m-0 rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-200">
          Fully booked — reserve an overflow seat for ₱{overflowPrice}, pending verification.
        </p>
      ) : null}

      <div className="grid gap-1.5">
        <label htmlFor="webinar-reg-name" className="text-xs font-bold uppercase tracking-[0.06em] text-white/60">
          Full name
        </label>
        <input
          id="webinar-reg-name"
          name="name"
          required
          className="rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/40"
          placeholder="Juan Dela Cruz"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="webinar-reg-email" className="text-xs font-bold uppercase tracking-[0.06em] text-white/60">
          Email
        </label>
        <input
          id="webinar-reg-email"
          name="email"
          type="email"
          required
          className="rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/40"
          placeholder="you@email.com"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="webinar-reg-phone" className="text-xs font-bold uppercase tracking-[0.06em] text-white/60">
          Phone
        </label>
        <input
          id="webinar-reg-phone"
          name="phone"
          type="tel"
          required
          className="rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/40"
          placeholder="09XXXXXXXXX"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="webinar-reg-photo" className="text-xs font-bold uppercase tracking-[0.06em] text-white/60">
          Photo (optional)
        </label>
        <label
          htmlFor="webinar-reg-photo"
          className="cursor-pointer truncate rounded-lg border border-dashed border-white/25 bg-black/20 px-3 py-2.5 text-sm text-white/60 hover:border-white/40"
        >
          {photoName || "Add a profile photo"}
        </label>
        <input
          id="webinar-reg-photo"
          name="photo"
          type="file"
          accept={PHOTO_TYPES}
          className="hidden"
          onChange={(event) => setPhotoName(event.target.files?.[0]?.name ?? "")}
        />
        <p className="m-0 text-[0.7rem] text-white/40">
          If you add a name and photo, they may appear publicly on this page as a registered attendee.
        </p>
      </div>

      {isOverflow ? (
        <div className="grid gap-1 rounded-lg border border-white/12 bg-black/25 p-3 text-xs text-white/70">
          <p className="m-0 font-bold uppercase tracking-[0.06em] text-white/50">Send &#8369;{overflowPrice} to</p>
          <p className="m-0">
            {mastermindOffer.payments.gcash.label} &middot; {mastermindOffer.payments.gcash.name} &middot;{" "}
            <strong className="text-white">{mastermindOffer.payments.gcash.number}</strong>
          </p>
          <p className="m-0">
            {mastermindOffer.payments.bpi.label} &middot; {mastermindOffer.payments.bpi.name} &middot;{" "}
            <strong className="text-white">{mastermindOffer.payments.bpi.number}</strong>
          </p>
        </div>
      ) : null}

      {isOverflow ? (
        <div className="grid gap-1.5">
          <label htmlFor="webinar-reg-receipt" className="text-xs font-bold uppercase tracking-[0.06em] text-white/60">
            Payment receipt <span className="text-amber-300">*</span>
          </label>
          <label
            htmlFor="webinar-reg-receipt"
            className="cursor-pointer truncate rounded-lg border border-dashed border-amber-300/40 bg-amber-400/5 px-3 py-2.5 text-sm text-amber-100/80 hover:border-amber-300/70"
          >
            {receiptName || "Upload your ₱" + overflowPrice + " payment receipt"}
          </label>
          <input
            id="webinar-reg-receipt"
            name="receipt"
            type="file"
            accept={RECEIPT_TYPES}
            required
            className="hidden"
            onChange={(event) => setReceiptName(event.target.files?.[0]?.name ?? "")}
          />
        </div>
      ) : null}

      {error ? <p className="m-0 text-sm font-semibold text-red-300">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="button-primary pressable mt-1 inline-flex min-h-[3rem] items-center justify-center gap-2 text-sm font-extrabold disabled:opacity-60"
      >
        {pending
          ? "Submitting..."
          : isOverflow
            ? `Reserve overflow seat · ₱${overflowPrice}`
            : "Reserve your free seat"}
      </button>
    </form>
  );
}
