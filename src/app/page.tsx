import Image from "next/image";
import Link from "next/link";

import { InquiryForm } from "@/components/forms/inquiry-form";
import { RegisterForm } from "@/components/auth/register-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { HeroBillboard } from "@/components/sections/hero-billboard";
import { ProgramCard } from "@/components/sections/program-card";
import { programs } from "@/data/programs";
import { siteContent } from "@/data/site-content";
import { getSessionUser } from "@/lib/session";

export default async function Home() {
  const user = await getSessionUser();
  return (
    <div className="min-h-screen">
      <SiteHeader overlay />

      <main>
        <HeroBillboard />

        <section className="section-space">
          <div className="container-shell">
            <div className="mb-10 max-w-3xl">
              <p className="eyebrow text-xs">{siteContent.problemEyebrow}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                {siteContent.problemHeading}
              </h2>
              <p className="mt-4 text-[var(--muted)]">{siteContent.problemIntro}</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {siteContent.problemPoints.map((item, index) => (
                <article
                  key={item.title}
                  className="glass-panel interactive-card fade-up overflow-hidden rounded-[2rem]"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div className="visual-mark" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="p-6 sm:p-8">
                    <h3 className="text-xl font-semibold tracking-[-0.02em]">{item.title}</h3>
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
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
                  {siteContent.programsHeading}
                </h2>
              </div>
              <Link href="/programs" className="pressable text-sm font-semibold text-[var(--brand-dark)]">
                {siteContent.programsLink}
              </Link>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {programs.map((program, index) => (
                <ProgramCard key={program.slug} program={program} delayMs={index * 60} />
              ))}
            </div>
          </div>
        </section>

        <section className="section-space bg-[color:var(--surface)]/60">
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

            <div className="glass-panel interactive-card fade-up fade-up-delay-1 rounded-[2rem] p-6 sm:p-8">
              <p className="eyebrow text-xs">{siteContent.mentorEyebrow}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">{siteContent.mentorHeading}</h2>
              <p className="mt-4 text-[var(--muted)]">{siteContent.mentorBody}</p>

              <ul className="mt-6 grid gap-3 text-sm text-[var(--muted)]">
                {siteContent.mentorPoints.map((item) => (
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

          <div className="container-shell mt-8">
            <div className="glass-panel interactive-card fade-up rounded-[2rem] p-8">
              <p className="eyebrow text-xs">{siteContent.deliveryEyebrow}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">{siteContent.deliveryHeading}</h2>
              <ul className="mt-6 grid gap-4 text-sm text-[var(--muted)] md:grid-cols-2">
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
            <div className="glass-panel fade-up rounded-[2rem] p-6 sm:p-10">
              <p className="eyebrow text-xs">The standard</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
                {siteContent.frameworkHeading}
              </h2>
              <p className="mt-4 max-w-3xl text-[var(--muted)]">{siteContent.frameworkBody}</p>
              <ol className="mt-8 grid gap-4 md:grid-cols-2">
                {siteContent.frameworkItems.map((item, index) => (
                  <li
                    key={item}
                    className="flex gap-4 rounded-[1.5rem] border border-[var(--line)] bg-[color:var(--surface-elevated)]/70 px-5 py-4"
                  >
                    <span className="font-semibold text-[var(--brand-dark)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm leading-6">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="faq" className="section-space scroll-mt-24">
          <div className="container-shell">
            <div className="mb-10">
              <p className="eyebrow text-xs">{siteContent.faqEyebrow}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">{siteContent.faqHeading}</h2>
            </div>

            <div className="grid gap-5">
              {siteContent.faq.map((item) => (
                <div key={item.question} className="glass-panel interactive-card fade-up rounded-[1.75rem] p-6">
                  <h3 className="text-lg font-semibold">{item.question}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {!user ? (
          <section id="register" className="section-space scroll-mt-24">
            <div className="container-shell grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <p className="eyebrow text-xs">Register</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                  Create your account
                </h2>
                <p className="mt-4 text-[var(--muted)]">
                  Register to open the dashboard. Your account stays pending until we verify you.
                </p>
              </div>
              <RegisterForm />
            </div>
          </section>
        ) : null}

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
