import Link from "next/link";

import { InquiryForm } from "@/components/forms/inquiry-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProgramCard } from "@/components/sections/program-card";
import { programs } from "@/data/programs";
import { heroStats, siteContent } from "@/data/site-content";

export default async function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="hero-netflix section-space overflow-hidden pb-20 pt-8 sm:pt-12">
          <div className="absolute inset-0">
            <video
              className="hero-video"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
            >
              <source
                src="https://assets.cdn.filesafe.space/Col3j2B7jRDX5y8J5bgN/media/6a7741165a64f2b56797f059.mov"
                type='video/quicktime; codecs="hvc1"'
              />
              <source
                src="https://assets.cdn.filesafe.space/Col3j2B7jRDX5y8J5bgN/media/6a7741165a64f2b56797f059.mov"
                type="video/quicktime"
              />
            </video>
          </div>

          <div className="container-shell relative grid min-h-[78svh] items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="hero-orb hero-orb-a float-slow" />
            <div className="hero-orb hero-orb-b float-slower" />

            <div className="relative z-10 max-w-4xl space-y-6 py-8">
              <p className="fade-up inline-flex w-fit rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.34em] text-white/78 backdrop-blur-xl">
                {siteContent.eyebrow}
              </p>
              <div className="fade-up fade-up-delay-1 flex flex-wrap items-center gap-3 text-sm text-white/72">
                <span className="rounded-full bg-emerald-500/18 px-3 py-1 font-semibold text-emerald-200">
                  Featured
                </span>
                <span>Coach JDC Original</span>
                <span className="text-white/36">•</span>
                <span>Mindset</span>
                <span className="text-white/36">•</span>
                <span>Business</span>
                <span className="text-white/36">•</span>
                <span>Mentorship</span>
              </div>
              <h1 className="fade-up fade-up-delay-1 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl lg:text-7xl">
                {siteContent.headline}
              </h1>
              <p className="fade-up fade-up-delay-2 max-w-2xl text-lg leading-8 text-white/72">
                {siteContent.subheadline}
              </p>

              <div className="fade-up fade-up-delay-3 flex flex-wrap gap-4 pt-2">
                <Link
                  href={siteContent.primaryCta.href}
                  className="button-primary pressable rounded-full px-7 py-3.5 font-semibold"
                >
                  Start Your Breakthrough
                </Link>
                <Link
                  href={siteContent.secondaryCta.href}
                  className="button-secondary pressable rounded-full px-7 py-3.5 font-semibold text-white"
                >
                  Explore the Programs
                </Link>
              </div>

              <div className="grid gap-4 pt-4 sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="hero-pill interactive-card fade-up rounded-[1.5rem] p-5"
                  >
                    <p className="text-2xl font-semibold">{stat.value}</p>
                    <p className="mt-2 text-sm text-white/62">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10">
              <div className="hero-surface interactive-card fade-up fade-up-delay-2 relative overflow-hidden rounded-[2rem] p-8 text-white">
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/10 to-transparent" />
                <div className="relative">
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/56">Now streaming</p>
                  <h2 className="mt-3 max-w-sm text-3xl font-semibold tracking-[-0.04em]">
                    A breakthrough experience framed like a premium streaming release.
                  </h2>
                  <p className="mt-4 max-w-md text-sm leading-7 text-white/68">
                    Motion-led storytelling in the background, focused messaging in the foreground, and CTAs that stay visible without losing the cinematic feel.
                  </p>
                </div>

                <div className="relative mt-8 space-y-4">
                  {[
                    {
                      label: "Featured program",
                      title: "JDC Elite Society",
                      body: "Membership-led learning, live mentorship, and structured accountability.",
                    },
                    {
                      label: "High-converting path",
                      title: "Lead capture and partner routing",
                      body: "Program pages designed to move visitors from discovery to inquiry with less friction.",
                    },
                    {
                      label: "Operational support",
                      title: "Dashboard visibility",
                      body: "Admin and partner views keep follow-up, ownership, and reporting aligned.",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[1.5rem] border border-white/10 bg-black/24 px-5 py-4 backdrop-blur-sm"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/42">
                        {item.label}
                      </p>
                      <p className="mt-2 text-lg font-semibold tracking-[-0.02em]">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-white/62">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="container-shell relative z-10 mt-8">
            <div className="fade-up fade-up-delay-3 hero-shelf rounded-[1.75rem] p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/42">
                    Featured collection
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">
                    Continue exploring the Coach JDC universe
                  </h3>
                </div>
                <Link href="/programs" className="hidden text-sm font-semibold text-white/72 md:inline-flex">
                  Browse all
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  "JDC Elite Society",
                  "1-on-1 Coaching",
                  "Partnership Program",
                ].map((title, index) => (
                  <div key={title} className="hero-title-card rounded-[1.5rem] p-5 text-white">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/42">
                      Volume 0{index + 1}
                    </p>
                    <p className="mt-8 text-2xl font-semibold tracking-[-0.03em]">{title}</p>
                    <p className="mt-2 text-sm text-white/62">
                      Designed to move from inspiration into structure, momentum, and real-world action.
                    </p>
                  </div>
                ))}
              </div>
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
