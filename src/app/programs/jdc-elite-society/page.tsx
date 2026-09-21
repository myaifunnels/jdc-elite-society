import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { mastermindOffer } from "@/data/mastermind-offer";

export const metadata: Metadata = {
  title: "JDC Elite Society",
  description:
    "The private JDC Elite Society: accountability, standards, and a community that refuses average — with the sessions, replays and courses inside the member portal.",
};

const inside = [
  "A private community for serious builders — accountability, standards, and people who refuse average",
  "Foundation and Execution Mastermind sessions with lifetime replays",
  "Courses and training inside the member portal, such as Life & Money Foundations and the Exclusive Mentoring Session",
  "Mobile access — watch anywhere through the Android and iPhone apps",
];

export default function JdcEliteSocietyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <div className="section-space">
          <div className="container-shell text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-dark)]">JDC Elite Society</p>
            <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              A private community and portal for people who take action.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--muted)]">
              Membership opens when you join the JDC Mastermind. Everything below is included.
            </p>

            <ul className="mx-auto mt-8 grid max-w-2xl gap-3 text-left text-[var(--muted)]">
              {inside.map((item) => (
                <li
                  key={item}
                  className="rounded-[1.25rem] border border-[var(--line)] bg-[color:var(--surface-elevated)]/70 px-5 py-4"
                >
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/duplication" className="button-primary pressable rounded-full px-6 py-3 font-semibold">
                Join JDC Mastermind
              </Link>
              <a
                href={mastermindOffer.communityUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button-secondary pressable rounded-full px-6 py-3 font-semibold"
              >
                Member sign in
              </a>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
