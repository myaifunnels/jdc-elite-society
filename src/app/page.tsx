import Image from "next/image";
import Link from "next/link";

import { InquiryForm } from "@/components/forms/inquiry-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { HeroBillboard } from "@/components/sections/hero-billboard";
import { ProgramCard } from "@/components/sections/program-card";
import { programs } from "@/data/programs";
import { heroStats, siteContent } from "@/data/site-content";

export default async function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader overlay />

      <main>
        <HeroBillboard />

        <section className="section-space band-dark">
          <div className="container-shell">
            <div className="mb-10 max-w-3xl">
              <p className="eyebrow text-xs">{siteContent.pillarsEyebrow}</p>
              <h2 className="display-title mt-3 text-4xl md:text-5xl">{siteContent.pillarsHeading}</h2>
            </div>
            <div className="pillar-grid">
              {siteContent.pillars.map((item) => (
                <article key={item.title} className="pillar-card">
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-space">
          <div className="container-shell">
            <div className="mb-10 max-w-3xl">
              <p className="eyebrow text-xs">{siteContent.problemEyebrow}</p>
              <h2 className="display-title mt-2 text-4xl md:text-5xl">{siteContent.problemHeading}</h2>
              <p className="mt-4 text-lg leading-8 text-[var(--muted)]">{siteContent.problemIntro}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {siteContent.problemPoints.map((item, index) => (
                <article key={item.title} className="card-surface interactive-card fade-up overflow-hidden">
                  <div className="visual-mark" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="p-6 sm:p-8">
                    <h3 className="display-title text-2xl">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-space">
          <div className="container-shell">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow text-xs">{siteContent.programsEyebrow}</p>
                <h2 className="display-title mt-2 text-4xl md:text-5xl">{siteContent.programsHeading}</h2>
              </div>
              <Link
                href="/programs"
                className="pressable text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-dark)]"
              >
                {siteContent.programsLink}
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {programs.map((program) => (
                <ProgramCard key={program.slug} program={program} />
              ))}
            </div>
          </div>
        </section>

        <section className="section-space bg-[color:var(--surface)]">
          <div className="container-shell grid items-stretch gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="visual-portrait fade-up">
              <Image
                src="/media/coach-room.jpg"
                alt="A quiet coaching room with two chairs"
                fill
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="object-cover"
              />
            </div>

            <div className="fade-up fade-up-delay-1 self-center py-4">
              <p className="eyebrow text-xs">{siteContent.mentorEyebrow}</p>
              <h2 className="display-title mt-3 text-4xl md:text-5xl">{siteContent.mentorHeading}</h2>
              <p className="mt-4 text-lg leading-8 text-[var(--muted)]">{siteContent.mentorBody}</p>

              <ul className="mt-6 grid gap-3 text-sm text-[var(--muted)]">
                {siteContent.mentorPoints.map((item) => (
                  <li key={item} className="border-t border-[var(--line)] pt-4">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="section-space">
          <div className="container-shell">
            <p className="eyebrow text-xs">{siteContent.proofEyebrow}</p>
            <h2 className="display-title mt-3 max-w-3xl text-4xl md:text-5xl">{siteContent.proofHeading}</h2>
            <div className="proof-grid mt-10">
              {heroStats.map((item) => (
                <article key={item.value} className="proof-item">
                  <strong>{item.value}</strong>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.label}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-space band-dark">
          <div className="container-shell">
            <p className="eyebrow text-xs">The standard</p>
            <h2 className="display-title mt-3 text-4xl md:text-5xl">{siteContent.frameworkHeading}</h2>
            <p className="mt-4 max-w-3xl text-lg leading-8">{siteContent.frameworkBody}</p>
            <ol className="mt-10 grid gap-4 md:grid-cols-2">
              {siteContent.frameworkItems.map((item, index) => (
                <li key={item} className="flex gap-4 border-t border-white/10 pt-5">
                  <span className="font-semibold text-[var(--brand)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-base leading-7">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="faq" className="section-space scroll-mt-24">
          <div className="container-shell">
            <div className="mb-10 max-w-3xl">
              <p className="eyebrow text-xs">{siteContent.faqEyebrow}</p>
              <h2 className="display-title mt-2 text-4xl md:text-5xl">{siteContent.faqHeading}</h2>
            </div>

            <div className="grid gap-0">
              {siteContent.faq.map((item) => (
                <div key={item.question} className="fade-up border-t border-[var(--line)] py-6">
                  <h3 className="text-xl font-semibold">{item.question}</h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-band section-space">
          <div className="container-shell">
            <p className="eyebrow text-xs text-[var(--brand)]">{siteContent.closingEyebrow}</p>
            <h2 className="display-title mx-auto mt-3 max-w-3xl text-4xl md:text-6xl">
              {siteContent.closingHeading}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/75">{siteContent.closingBody}</p>
            <Link
              href="/contact"
              className="button-primary pressable mt-8 inline-flex rounded-sm px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em]"
            >
              {siteContent.primaryCta.label}
            </Link>
          </div>
        </section>

        <section className="section-space">
          <div className="container-shell">
            <InquiryForm />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
