"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useRef, useState } from "react";

import { mastermindOffer } from "@/data/mastermind-offer";
import { ZoomLogo } from "@/components/dashboard/integration-logos";
import { WebinarRegisterModal } from "@/components/webinars/webinar-register-modal";
import { WEBINAR_ZOOM_MEETING_ID, WEBINAR_ZOOM_PASSCODE } from "@/lib/webinars";

const PHOTO_TYPES = "image/jpeg,image/png,image/webp,image/gif";
const RECEIPT_TYPES = "image/jpeg,image/png,image/webp,application/pdf";
const DRAFT_STORAGE_KEY = "webinar-register-draft";

type RegisterDraft = { name: string; phone: string };

function readDraft(): RegisterDraft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RegisterDraft) : null;
  } catch {
    return null;
  }
}

function writeDraft(draft: RegisterDraft) {
  try {
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Private/restricted browser contexts can throw on storage access; the visitor just
    // retypes their details after the Google redirect instead of losing the form.
  }
}

function ZoomMeetingDetails() {
  return (
    <p className="m-0 text-center text-xs text-white/50">
      Meeting ID: <span className="font-bold text-white/70">{WEBINAR_ZOOM_MEETING_ID}</span> &middot; Passcode:{" "}
      <span className="font-bold text-white/70">{WEBINAR_ZOOM_PASSCODE}</span>
    </p>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.02l7.73 6c4.51-4.18 7.09-10.36 7.09-17.49z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59a14.5 14.5 0 0 1-.76-4.59c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.86.92 7.51 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.92-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}

type RegisterResult =
  | { ok: true; tier: "free" | "paid_overflow"; status?: string; needsPasswordSetup?: boolean }
  | { ok: false; error: string; accountExists?: boolean; email?: string };
type SignInResult =
  | { ok: true; status: "registered"; tier: "free" | "paid_overflow"; needsPasswordSetup?: boolean }
  | {
      ok: true;
      status: "already_registered";
      tier: "free" | "paid_overflow";
      registrantStatus: string;
      needsPasswordSetup?: boolean;
    }
  | { ok: true; status: "needs_overflow_payment"; name: string; email: string; phone: string }
  | { ok: false; error: string };

type Outcome = "free_confirmed" | "overflow_pending" | "overflow_confirmed" | "rejected";

function outcomeFor(tier: "free" | "paid_overflow", status?: string): Outcome {
  if (status === "rejected") return "rejected";
  if (tier === "free") return "free_confirmed";
  return status === "confirmed" ? "overflow_confirmed" : "overflow_pending";
}

export function WebinarRegisterPanel({
  webinarId,
  freeSeatsLeft,
  overflowPrice,
  joinUrl,
  existingRegistration,
  signedInUser,
}: {
  webinarId: string;
  freeSeatsLeft: number;
  overflowPrice: number;
  /** Where "Join via Zoom" should link once someone's seat is confirmed — the webinar's own
   * zoomLink field. */
  joinUrl?: string;
  /** The signed-in visitor's existing registration for this webinar, if any — looked up
   * server-side by session/email so a returning registrant never sees "Register" again. */
  existingRegistration?: { tier: "free" | "paid_overflow"; status: string } | null;
  /** The signed-in visitor's account details, if any — from the server session, e.g. right after
   * "Continue with Google" resumes here. Skips the Register/Sign in tabs and shows a single
   * pre-filled register form instead, since sign-in is already done. */
  signedInUser?: { name: string; email: string; phone: string } | null;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const isOverflow = freeSeatsLeft <= 0;

  // A signed-in session is authoritative; otherwise fall back to whatever draft was saved just
  // before redirecting to Google (see "Continue with Google" below), read once via a lazy
  // initializer rather than an effect + setState pair.
  const initialDraft = useMemo(
    () => (signedInUser || typeof window === "undefined" ? null : readDraft()),
    [signedInUser],
  );
  // `?register=1` marks a return trip from the Google OAuth redirect (or a direct link) — open
  // the modal immediately instead of making the visitor click "Reserve My Seat Now" again.
  const [open, setOpen] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("register") === "1",
  );
  const [tab, setTab] = useState<"register" | "signin">("register");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [receiptName, setReceiptName] = useState("");

  // Prefilled once a "sign in" attempt lands on a sold-out webinar — we already authenticated
  // the visitor, we just can't finish registering them without a payment receipt, so we drop
  // them into the normal overflow form with their account details pre-filled.
  const [prefill, setPrefill] = useState<{ name: string; email: string; phone: string } | null>(null);

  const [signinPending, setSigninPending] = useState(false);
  const [signinError, setSigninError] = useState("");

  // Set when the register form matches an email that already has an account — the API resets
  // that account's password to the well-known temporary one (src/lib/auth-constants.ts) rather
  // than silently attaching the registration, so this switches to the sign-in tab and tells the
  // visitor how to get back in.
  const [existingAccountEmail, setExistingAccountEmail] = useState("");

  function closeModal() {
    setOpen(false);
  }

  function resetAndClose() {
    setOutcome(null);
    setError("");
    setSigninError("");
    setPrefill(null);
    setExistingAccountEmail("");
    setTab("register");
    closeModal();
  }

  function goToDashboard() {
    setOpen(false);
    router.push("/dashboard/my-webinars");
  }

  function continueWithGoogle() {
    const name = (formRef.current?.elements.namedItem("name") as HTMLInputElement | null)?.value ?? "";
    const phone = (formRef.current?.elements.namedItem("phone") as HTMLInputElement | null)?.value ?? "";
    writeDraft({ name, phone });
    // Deliberately a hard navigation, not router.push: this hands off to an API route (Google's
    // OAuth authorize URL), not a Next.js page.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/api/auth/google?next=${encodeURIComponent("/webinars?register=1")}`);
  }

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
    // A disabled input (the email field once signedInUser is set) is never included in
    // FormData, so set it explicitly rather than trusting the form to carry it.
    if (signedInUser) {
      body.set("email", signedInUser.email);
    }

    try {
      const response = await fetch(`/api/webinars/${webinarId}/register`, { method: "POST", body });
      const payload = (await response.json().catch(() => null)) as RegisterResult | null;
      if (!response.ok || !payload || !("ok" in payload) || !payload.ok) {
        if (payload && "accountExists" in payload && payload.accountExists) {
          setExistingAccountEmail(payload.email ?? "");
          setTab("signin");
          setPending(false);
          return;
        }
        setError((payload && "error" in payload && payload.error) || "We couldn't submit your registration. Try again.");
        setPending(false);
        return;
      }
      if (payload.needsPasswordSetup) {
        setOpen(false);
        router.push("/account/password");
        return;
      }
      setOutcome(outcomeFor(payload.tier, payload.status));
      router.refresh();
    } catch {
      setError("We couldn't submit your registration. Try again.");
      setPending(false);
    }
  }

  async function onSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSigninError("");
    setSigninPending(true);

    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "");
    const password = String(new FormData(form).get("password") ?? "");

    try {
      const response = await fetch(`/api/webinars/${webinarId}/signin-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json().catch(() => null)) as SignInResult | null;
      if (!payload || !payload.ok) {
        setSigninError((payload && "error" in payload && payload.error) || "We couldn't sign you in. Try again.");
        setSigninPending(false);
        return;
      }

      if (payload.status === "needs_overflow_payment") {
        setPrefill({ name: payload.name, email: payload.email, phone: payload.phone });
        setTab("register");
        setSigninPending(false);
        router.refresh();
        return;
      }

      if (payload.needsPasswordSetup) {
        setOpen(false);
        router.push("/account/password");
        return;
      }

      if (payload.status === "already_registered") {
        setOutcome(outcomeFor(payload.tier, payload.registrantStatus));
      } else {
        setOutcome(outcomeFor(payload.tier));
      }
      router.refresh();
    } catch {
      setSigninError("We couldn't sign you in. Try again.");
      setSigninPending(false);
    }
  }

  if (existingRegistration?.status === "confirmed") {
    return joinUrl ? (
      <div className="inline-flex flex-col items-center gap-2">
        <Link
          href={joinUrl}
          target="_blank"
          rel="noreferrer"
          className="button-primary pressable inline-flex min-h-[3rem] items-center justify-center gap-2 px-6 text-sm font-extrabold sm:w-auto"
        >
          <ZoomLogo size={20} />
          Join via Zoom
        </Link>
        <ZoomMeetingDetails />
      </div>
    ) : (
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2.5 text-sm font-extrabold text-emerald-200">
        <ZoomLogo size={20} />
        You&rsquo;re registered — the Zoom link is on its way to your email.
      </div>
    );
  }

  if (existingRegistration?.status === "pending") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-4 py-2.5 text-sm font-extrabold text-amber-200">
        Payment received — pending verification.
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className="button-primary pressable inline-flex min-h-[3rem] items-center justify-center gap-2 px-6 text-sm font-extrabold sm:w-auto"
        onClick={() => setOpen(true)}
      >
        {isOverflow ? `Reserve overflow seat · ₱${overflowPrice}` : "Reserve My Seat Now"}
      </button>

      <WebinarRegisterModal open={open} onClose={resetAndClose} title="Reserve your seat">
        {outcome ? (
          <div className="webinar-register-confirm">
            <p className="m-0 text-lg font-extrabold text-white">
              {outcome === "rejected" ? "About your registration" : "Thank you!"}
            </p>
            {outcome === "free_confirmed" ? (
              <p className="mt-1.5 text-sm text-white/70">
                Your free seat is confirmed. Keep an eye on your email and phone for the join link.
              </p>
            ) : outcome === "overflow_confirmed" ? (
              <p className="mt-1.5 text-sm text-white/70">
                Your overflow seat is confirmed. Keep an eye on your email and phone for the join link.
              </p>
            ) : outcome === "overflow_pending" ? (
              <p className="mt-1.5 text-sm text-white/70">
                Payment received — pending verification. We&rsquo;ll confirm your overflow seat shortly after our
                team reviews your receipt.
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-white/70">
                Your overflow seat request wasn&rsquo;t approved. Contact support if you believe this is a mistake.
              </p>
            )}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              {(outcome === "free_confirmed" || outcome === "overflow_confirmed") && joinUrl ? (
                <Link
                  href={joinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button-primary pressable inline-flex items-center justify-center gap-2"
                >
                  <ZoomLogo size={18} />
                  Join via Zoom
                </Link>
              ) : (
                <button type="button" className="button-primary pressable" onClick={goToDashboard}>
                  Go to my dashboard
                </button>
              )}
              <button type="button" className="button-secondary pressable" onClick={resetAndClose}>
                Stay on this page
              </button>
            </div>
            {(outcome === "free_confirmed" || outcome === "overflow_confirmed") && joinUrl ? (
              <div className="mt-3">
                <ZoomMeetingDetails />
              </div>
            ) : null}
          </div>
        ) : (
          <>
            {signedInUser ? (
              <p className="mb-4 m-0 rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-200">
                Signed in as {signedInUser.email}
              </p>
            ) : (
              <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-full border border-white/12 bg-black/25 p-1">
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className={`rounded-full py-2 text-xs font-extrabold uppercase tracking-[0.06em] transition ${
                    tab === "register" ? "bg-white/15 text-white" : "text-white/50"
                  }`}
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => setTab("signin")}
                  className={`rounded-full py-2 text-xs font-extrabold uppercase tracking-[0.06em] transition ${
                    tab === "signin" ? "bg-white/15 text-white" : "text-white/50"
                  }`}
                >
                  Sign in
                </button>
              </div>
            )}

            {tab === "signin" && !signedInUser ? (
              <form onSubmit={onSignIn} className="grid gap-3">
                <p className="m-0 text-sm text-white/70">
                  {existingAccountEmail
                    ? "That email already has an account. Sign in with your email — first-time access uses the temporary password JDCELITESOCIETY, then you'll set a new password."
                    : "Sign in and we’ll reserve your seat for this webinar automatically."}
                </p>

                <button type="button" className="webinar-google-btn" onClick={continueWithGoogle}>
                  <GoogleIcon />
                  Continue with Google
                </button>

                <div className="webinar-signin-divider">or sign in with your password</div>

                <div className="grid gap-1.5">
                  <label htmlFor="webinar-signin-email" className="text-xs font-bold uppercase tracking-[0.06em] text-white/60">
                    Email
                  </label>
                  <input
                    id="webinar-signin-email"
                    name="email"
                    type="email"
                    required
                    defaultValue={existingAccountEmail}
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/40"
                    placeholder="you@email.com"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="webinar-signin-password" className="text-xs font-bold uppercase tracking-[0.06em] text-white/60">
                    Password
                  </label>
                  <input
                    id="webinar-signin-password"
                    name="password"
                    type="password"
                    required
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/40"
                    placeholder="••••••••"
                  />
                </div>

                <Link href="/forgot-password" className="justify-self-start text-xs font-bold text-[var(--brand)]">
                  Forgot password?
                </Link>

                {signinError ? <p className="m-0 text-sm font-semibold text-red-300">{signinError}</p> : null}

                <button
                  type="submit"
                  disabled={signinPending}
                  className="button-primary pressable mt-1 inline-flex min-h-[3rem] items-center justify-center gap-2 text-sm font-extrabold disabled:opacity-60"
                >
                  {signinPending ? "Signing in..." : "Sign in & reserve my seat"}
                </button>
              </form>
            ) : (
              <form ref={formRef} onSubmit={onSubmit} className="grid gap-3">
                {prefill ? (
                  <p className="m-0 rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-200">
                    You&rsquo;re signed in. Finish reserving your overflow seat below.
                  </p>
                ) : null}

                {isOverflow ? (
                  <p className="m-0 rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-200">
                    Fully booked — reserve an overflow seat for ₱{overflowPrice}, pending verification.
                  </p>
                ) : null}

                {!signedInUser && !prefill ? (
                  <>
                    <button type="button" className="webinar-google-btn" onClick={continueWithGoogle}>
                      <GoogleIcon />
                      Continue with Google
                    </button>
                    <div className="webinar-signin-divider">or register with your details</div>
                  </>
                ) : null}

                <div className="grid gap-1.5">
                  <label htmlFor="webinar-reg-name" className="text-xs font-bold uppercase tracking-[0.06em] text-white/60">
                    Full name
                  </label>
                  <input
                    id="webinar-reg-name"
                    name="name"
                    required
                    defaultValue={signedInUser?.name ?? prefill?.name ?? initialDraft?.name ?? ""}
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
                    defaultValue={signedInUser?.email ?? prefill?.email ?? ""}
                    disabled={Boolean(signedInUser)}
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/40 disabled:opacity-60"
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
                    defaultValue={signedInUser?.phone || prefill?.phone || initialDraft?.phone || ""}
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
                      : "Reserve My Seat Now"}
                </button>
              </form>
            )}
          </>
        )}
      </WebinarRegisterModal>
    </>
  );
}
