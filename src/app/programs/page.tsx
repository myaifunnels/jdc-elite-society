import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "JDC Elite Society, JDC Partnership Program, JDC Mastermind, Group Coaching, and 1-on-1 Coaching from Coach Jayson Dela Cruz.",
};

type ProgramEntry = {
  id: string;
  title: string;
  summary: string;
  href: string;
  cta: string;
  comingSoon?: boolean;
  tracks?: { href: string; label: string }[];
};

const programList: ProgramEntry[] = [
  {
    id: "jdc-elite-society",
    title: "JDC Elite Society",
    summary:
      "Structure. Discipline. Direction. The private community and member portal for OFWs, employees, and beginner entrepreneurs who want more in life.",
    href: "/programs/jdc-elite-society",
    cta: "View JDC Elite Society",
  },
  {
    id: "jdc-partnership",
    title: "JDC Partnership Program",
    summary: "Become an official partner of Coach Jayson Dela Cruz. Watch the video and sign up.",
    href: "/programs/jdc-partnership",
    cta: "View the Partnership Program",
  },
  {
    id: "jdc-mastermind",
    title: "JDC Mastermind",
    summary:
      "A room of people already in motion. Live working sessions, direct coaching, and accountability that follows you after the session.",
    href: "/building",
    cta: "Open the Mastermind",
    tracks: [
      { href: "/building", label: "Building Season" },
      { href: "/duplication", label: "Duplication Season" },
    ],
  },
  {
    id: "group-coaching",
    title: "Group Coaching",
    summary: "Grow alongside builders who take action, online or face to face.",
    href: "/programs/group-coaching",
    cta: "Get notified",
    comingSoon: true,
    tracks: [
      { href: "/programs/group-coaching/online", label: "Online Coaching" },
      { href: "/programs/group-coaching/face-to-face", label: "Face-to-Face Coaching" },
    ],
  },
  {
    id: "1-on-1-coaching",
    title: "1-on-1 Coaching",
    summary: "Private coaching with Coach JDC, online or face to face.",
    href: "/programs/1-on-1-coaching",
    cta: "Get notified",
    comingSoon: true,
    tracks: [
      { href: "/programs/1-on-1-coaching/online", label: "Online Coaching" },
      { href: "/programs/1-on-1-coaching/face-to-face", label: "Face-to-Face Coaching" },
    ],
  },
];

export default function ProgramsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-space">
        <div className="container-shell">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-dark)]">Programs</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Pick the program that fits your season.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
            Every program has one standard: you do the work. Start with the one that names your actual problem.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {programList.map((program) => (
              <article key={program.id} id={program.id} className="card-surface interactive-card fade-up rounded-[2rem] p-5 sm:p-8">
                <p className="eyebrow text-xs">{program.comingSoon ? "Coming soon" : "Program"}</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em]">{program.title}</h2>
                <p className="mt-3 text-sm text-[var(--muted)]">{program.summary}</p>
                {program.tracks ? (
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {program.tracks.map((track) => (
                      <li key={track.href}>
                        <Link href={track.href} className="button-secondary pressable rounded-full px-4 py-2 text-sm font-medium">
                          {track.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-6">
                  <Link
                    href={program.href}
                    className={`${program.comingSoon ? "button-secondary" : "button-primary"} pressable inline-flex rounded-full px-5 py-3 font-semibold`}
                  >
                    {program.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
