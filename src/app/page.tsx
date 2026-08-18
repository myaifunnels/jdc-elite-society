import Link from "next/link";

import { InquiryForm } from "@/components/forms/inquiry-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { HeroVideo } from "@/components/sections/hero-video";
import { ProgramCard } from "@/components/sections/program-card";
import { programs } from "@/data/programs";
import { siteContent } from "@/data/site-content";

export default async function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="hero-netflix">
          <div className="hero-video-wrap">
            <HeroVideo />
          </div>

          <div className="hero-copy container-shell">
            <p className="fade-up hero-kicker">JDC Original</p>
            <h1 className="fade-up fade-up-delay-1 hero-title">
              {siteContent.headline}
            </h1>
            <p className="fade-up fade-up-delay-1 hero-meta">
              <span>Featured</span>
              <span>Mindset</span>
              <span>Business</span>
              <span>Mentorship</span>
            </p>
            <p className="fade-up fade-up-delay-2 hero-synopsis">
              {siteContent.subheadline}
            </p>

            <div className="fade-up fade-up-delay-3 hero-actions">
              <Link href={siteContent.primaryCta.href} className="button-primary pressable hero-cta">
                {siteContent.primaryCta.label}
              </Link>
              <Link href={siteContent.secondaryCta.href} className="button-secondary pressable hero-cta hero-cta-more">
                More Info
              </Link>
            </div>
          </div>

          <div className="hero-row container-shell">
            <div className="hero-row-head">
              <h2>Featured programs</h2>
              <Link href="/programs">Browse all</Link>
            </div>
            <div className="hero-row-track">
              {programs.slice(0, 4).map((program) => (
                <Link key={program.slug} href={`/programs/${program.slug}`} className="hero-title-card">
                  <p>Now streaming</p>
                  <strong>{program.title}</strong>
                  <span>{program.shortDescription}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section-space pt-0">
          <div className="container-shell">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow text-xs">
                  Featured programs
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
                  Growth tracks designed for clarity, discipline, and action.
                </h2>
              </div>
              <Link href="/programs" className="pressable text-sm font-semibold text-[var(--brand-dark)]">
                View all programs
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {programs.map((program) => (
                <ProgramCard key={program.slug} program={program} />
              ))}
            </div>
          </div>
        </section>

        <section className="section-space bg-[color:var(--surface)]/60">
          <div className="container-shell grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="glass-panel interactive-card fade-up rounded-[2rem] p-8">
              <p className="eyebrow text-xs">
                About Coach JDC
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">{siteContent.mentorHeading}</h2>
              <p className="mt-4 text-[var(--muted)]">{siteContent.mentorBody}</p>

              <div className="mt-6 rounded-[1.5rem] bg-[var(--brand-soft)] p-5">
                <p className="font-semibold">{siteContent.frameworkHeading}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{siteContent.frameworkBody}</p>
              </div>
            </div>

            <div className="glass-panel interactive-card fade-up fade-up-delay-1 rounded-[2rem] p-8">
              <p className="eyebrow text-xs">
                Community and delivery
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">A single system from content to follow-up.</h2>
              <ul className="mt-6 grid gap-4 text-sm text-[var(--muted)]">
                {siteContent.communityBullets.map((item) => (
                  <li
                    key={item}
                    className="rounded-[1.5rem] border border-[var(--line)] bg-[color:var(--surface-elevated)]/70 px-5 py-4"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="section-space">
          <div className="container-shell">
            <div className="mb-8">
              <p className="eyebrow text-xs">FAQ</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
                Questions from future students, clients, and partners.
              </h2>
            </div>

            <div className="grid gap-4">
              {siteContent.faq.map((item) => (
                <div key={item.question} className="glass-panel interactive-card fade-up rounded-[1.75rem] p-6">
                  <h3 className="text-lg font-semibold">{item.question}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-space bg-[color:var(--surface)]/60">
          <div className="container-shell">
            <InquiryForm />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
