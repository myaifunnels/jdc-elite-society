import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProgramsBoard } from "@/components/sections/programs-board";

export const metadata: Metadata = {
  title: "Programs",
  description: "Mindset, business, leadership, OFW transition, and JDC Mastermind programs from Coach Jayson Dela Cruz.",
};

type ProgramsPageProps = {
  searchParams: Promise<{ program?: string }>;
};

export default async function ProgramsPage({ searchParams }: ProgramsPageProps) {
  const { program } = await searchParams;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="section-space">
        <div className="container-shell">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-dark)]">Programs</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Five tracks. One standard: you do the work.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
            Pick the season you&apos;re in. I&apos;ll coach you from there. Don&apos;t pick the program that sounds impressive. Pick the one that names your actual problem.
          </p>

          <div className="mt-8">
            <ProgramsBoard initialSlug={program} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
