import type { Metadata } from "next";
import { CalendarDays, Clock3, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";

import { PassiveIncomeCountdown, PassiveIncomeRegistrationForm } from "@/components/events/passive-income-registration-form";

import styles from "./passive-income.module.css";

export const metadata: Metadata = {
  title: "Build Passive Income in Network Marketing | Free Live Masterclass",
  description: "Register for Coach JDC's free live masterclass on building passive income in network marketing, September 18, 2026 at 7:30 PM Philippine Time.",
  alternates: { canonical: "/passive-income" },
  openGraph: {
    title: "How to Build Passive Income in Network Marketing",
    description: "A free live masterclass with Coach JDC on September 18, 2026 at 7:30 PM Philippine Time.",
    url: "/passive-income",
    type: "website",
  },
};

export default function PassiveIncomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.backdrop} aria-hidden />
      <div className={styles.glow} aria-hidden />
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link className={styles.brand} href="/" aria-label="Coach JDC home"><span>COACH JDC</span><strong>ELITE SOCIETY</strong></Link>
          <span className={styles.liveBadge}><i /> Live online masterclass</span>
        </header>

        <div className={styles.layout}>
          <section className={styles.content}>
            <div className={styles.kicker}>Free live training · Limited online seats</div>
            <h1>How to Build <em>Passive Income</em> in Network Marketing</h1>
            <p className={styles.lead}>Learn how to build a network marketing business that can grow beyond your personal effort—through a repeatable system, stronger leaders, and consistent action.</p>
            <div className={styles.meta}>
              <span><CalendarDays aria-hidden /> September 18, 2026</span>
              <span><Clock3 aria-hidden /> 7:30 PM · Philippine Time</span>
              <span><UsersRound aria-hidden /> Hosted by Coach JDC</span>
            </div>
            <div className={styles.countdownBlock}>
              <span>We go live in</span>
              <PassiveIncomeCountdown />
            </div>
            <div className={styles.promise}>
              <ShieldCheck aria-hidden />
              <p><strong>No hype. No overnight-income promises.</strong> A practical session on the systems and habits that create leverage over time.</p>
            </div>
          </section>
          <aside className={styles.formColumn} id="register"><PassiveIncomeRegistrationForm /></aside>
        </div>
      </div>
    </main>
  );
}
