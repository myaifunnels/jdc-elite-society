import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "1-on-1 Coaching — Coming Soon",
  description: "Private coaching with Coach Jayson Dela Cruz, online or face to face. Coming soon.",
};

export default function OneOnOneCoachingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <div className="section-space">
          <div className="container-shell text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-dark)]">1-on-1 Coaching</p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[color:var(--surface-elevated)]/70 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand-dark)]">
              Coming Soon
            </span>
            <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Direct time with Coach JDC — online or face to face.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--muted)]">
              Private 1-on-1 coaching isn&apos;t open yet. Join the JDC Mastermind now, and we&apos;ll let you know the
              moment it launches.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/elite" className="button-primary pressable rounded-full px-6 py-3 font-semibold">
                Join JDC Mastermind
              </Link>
              <Link href="/programs" className="button-secondary pressable rounded-full px-6 py-3 font-semibold">
                See the other tracks
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
