"use client";

import { ArrowRight, CheckCircle2, Mail, MessageSquareText } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import styles from "@/app/passive-income/passive-income.module.css";
import { PhoneField } from "@/components/forms/phone-field";
import { PASSIVE_INCOME_EVENT_START, passiveIncomeAudienceOptions } from "@/lib/passive-income-event";

type Countdown = { days: string; hours: string; minutes: string; seconds: string };

function getCountdown(): Countdown {
  const remaining = Math.max(0, new Date(PASSIVE_INCOME_EVENT_START).getTime() - Date.now());
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

export function PassiveIncomeCountdown() {
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  useEffect(() => {
    const update = () => setCountdown(getCountdown());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const values = countdown ?? { days: "--", hours: "--", minutes: "--", seconds: "--" };
  return (
    <div className={styles.countdown} aria-label="Countdown to the live masterclass">
      {Object.entries(values).map(([label, value]) => (
        <div className={styles.countdownUnit} key={label}>
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function PassiveIncomeRegistrationForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<"new" | "existing" | "">("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/events/passive-income/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phoneCountry: data.get("phoneCountry"),
          phoneDial: data.get("phoneDial"),
          phoneNational: data.get("phoneNational"),
          bestDescribesYou: data.get("bestDescribesYou"),
          consent: data.get("consent") === "on",
          website: data.get("website"),
        }),
      });
      const payload = (await response.json()) as { error?: string; alreadyRegistered?: boolean };
      if (!response.ok) throw new Error(payload.error || "Registration failed. Please try again.");
      setSuccess(payload.alreadyRegistered ? "existing" : "new");
      form.reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Registration failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className={styles.successCard} role="status">
        <CheckCircle2 aria-hidden />
        <p className={styles.formEyebrow}>{success === "existing" ? "Your seat is already saved" : "Your seat is confirmed"}</p>
        <h2>See you live on September 18.</h2>
        <p>Check your email for your private Zoom access. We also sent a link-free text confirmation and will remind you before the session.</p>
        <div className={styles.deliveryList}>
          <span><Mail aria-hidden /> Zoom access by email</span>
          <span><MessageSquareText aria-hidden /> Link-free text reminders</span>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.formCard} onSubmit={submit}>
      <div>
        <p className={styles.formEyebrow}>Free registration</p>
        <h2>Save your seat</h2>
        <p className={styles.formIntro}>Enter your details and we&apos;ll send your private access by email.</p>
      </div>
      <label className={styles.field}>
        <span>Full name</span>
        <input name="name" autoComplete="name" placeholder="Juan Dela Cruz" required />
      </label>
      <label className={styles.field}>
        <span>Email address</span>
        <input name="email" type="email" autoComplete="email" placeholder="juan@email.com" required />
      </label>
      <div className={styles.field}>
        <span>Phone number</span>
        <div className={styles.phoneWrap}><PhoneField /></div>
      </div>
      <label className={styles.field}>
        <span>What best describes you?</span>
        <select name="bestDescribesYou" required defaultValue="">
          <option value="" disabled>Choose one</option>
          {passiveIncomeAudienceOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
      <label className={styles.honeypot} aria-hidden>
        Website<input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className={styles.consent}>
        <input name="consent" type="checkbox" required />
        <span>I agree to receive registration and event reminder emails and texts from Coach JDC (up to 5 of each). Message and data rates may apply. Reply STOP to opt out.</span>
      </label>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? "Saving your seat…" : "Reserve my free seat"}
        {pending ? null : <ArrowRight aria-hidden />}
      </button>
      <p className={styles.privacy}>Your details are used only for this event and related Coach JDC updates.</p>
    </form>
  );
}
