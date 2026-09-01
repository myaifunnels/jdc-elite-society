import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { formatPhp, mastermindOffer } from "@/data/mastermind-offer";

export const metadata: Metadata = {
  title: "1-on-1 Coaching",
  description:
    "Online and face-to-face private coaching with Coach Jayson Dela Cruz, unlocked after you join the JDC Mastermind.",
};

export default function OneOnOneCoachingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <div className="section-space">
          <div className="container-shell">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-dark)]">1-on-1 Coaching</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Direct time with Coach JDC. Online or face to face.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
              This isn&apos;t a standalone checkout. Private coaching is the exclusive offer unlocked right after you
              join the JDC Mastermind — pick the format that fits your season below.
            </p>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <section id="online" className="card-surface scroll-mt-24 rounded-[2rem] p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-dark)]">Online Coaching</p>
                <h2 className="mt-3 text-2xl font-semibold">Work with me from anywhere.</h2>
                <p className="mt-4 text-[var(--muted)]">
                  Focused video sessions for strategy, clarity, and direct feedback on your next move — built for OFWs
                  and anyone who can&apos;t sit across a table from me every week.
                </p>
                <p className="mt-6 text-2xl font-semibold text-[var(--brand-dark)]">
                  {formatPhp(mastermindOffer.coachingPricePerHour)} <span className="text-sm font-medium text-[var(--muted)]">/ hour</span>
                </p>
              </section>

              <section id="face-to-face" className="card-surface scroll-mt-24 rounded-[2rem] p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-dark)]">Face to Face Coaching</p>
                <h2 className="mt-3 text-2xl font-semibold">Sit down with me in person.</h2>
                <p className="mt-4 text-[var(--muted)]">
                  In-person sessions for the people who want the room, the whiteboard, and the full weight of direct
                  accountability with nowhere to hide behind a screen.
                </p>
                <p className="mt-6 text-2xl font-semibold text-[var(--brand-dark)]">
                  {formatPhp(mastermindOffer.inPersonCoachingPricePerHour)} <span className="text-sm font-medium text-[var(--muted)]">/ hour</span>
                </p>
              </section>
            </div>

            <section className="mt-8 card-surface rounded-[2rem] p-8 text-center">
              <h2 className="text-2xl font-semibold">How to unlock it</h2>
              <p className="mx-auto mt-3 max-w-xl text-[var(--muted)]">
                Join the JDC Mastermind first. Right after you check out, you&apos;ll get an exclusive one-time offer to
                add Online or Face-to-Face coaching — or skip it and keep just the Mastermind. Either way, you&apos;re in.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Link href="/elite" className="button-primary pressable rounded-full px-6 py-3 font-semibold">
                  Join JDC Mastermind
                </Link>
                <Link href="/programs" className="button-secondary pressable rounded-full px-6 py-3 font-semibold">
                  See the other tracks
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
