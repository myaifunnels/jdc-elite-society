import type { Metadata } from "next";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Video } from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import {
  PASSIVE_INCOME_EVENT_START,
  PASSIVE_INCOME_EVENT_TIME_ZONE,
  PASSIVE_INCOME_EVENT_TITLE,
} from "@/lib/passive-income-event";

export const metadata: Metadata = {
  title: "Webinars | Coach JDC",
  description:
    "Join Coach JDC's upcoming live webinars on network marketing, business systems, leadership, and building income with discipline.",
  alternates: { canonical: "/webinars" },
};

const takeaways = [
  "Build a repeatable system that does not rely on constant personal effort",
  "Develop leaders who can duplicate the process with confidence",
  "Use consistent action to create long-term income leverage",
];

const eventDate = new Date(PASSIVE_INCOME_EVENT_START);
const eventDateLabel = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  month: "long",
  day: "numeric",
  year: "numeric",
}).format(eventDate);
const eventTimeLabel = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  hour: "numeric",
  minute: "2-digit",
}).format(eventDate);

export default function WebinarsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="section-space border-b border-[var(--line)]">
          <div className="container-shell fade-up">
            <p className="eyebrow">Coach JDC live training</p>
            <h1 className="mt-4 max-w-3xl text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.98] tracking-[-0.045em]">
              Webinars built for people ready to do the work.
            </h1>
            <p className="mt-5 max-w-xl text-[var(--muted)] text-[clamp(1rem,1.6vw,1.15rem)] leading-relaxed">
              Practical live sessions on business, leadership, and building income with a system you can repeat.
            </p>
          </div>
        </section>

        <section className="section-space" aria-labelledby="upcoming-webinars">
          <div className="container-shell">
            <div className="fade-up mb-8 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow">Next live session</p>
                <h2 id="upcoming-webinars" className="mt-2 text-[clamp(1.8rem,3.6vw,2.6rem)] tracking-[-0.03em]">
                  Upcoming webinar
                </h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--brand-soft)] px-4 py-2.5 text-sm font-bold text-[var(--foreground)]">
                <i
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-full bg-[var(--brand)] shadow-[0_0_0_0.3rem_var(--brand-soft)]"
                />
                Live online
              </span>
            </div>

            <article className="fade-up-delay-1 card-surface grid overflow-hidden md:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
              <div className="relative min-h-[320px] bg-[url('/media/coach-room.jpg')] bg-cover bg-center md:min-h-[560px]">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,17,0.08),rgba(3,8,17,0.86)),linear-gradient(90deg,rgba(3,8,17,0.08),rgba(3,8,17,0.45))]" />
                <div className="absolute inset-0 flex flex-col items-start justify-between p-6 text-white md:p-10">
                  <span className="rounded-full border border-white/30 bg-black/40 px-4 py-2.5 text-xs font-extrabold tracking-[0.08em] uppercase backdrop-blur-md">
                    Free masterclass
                  </span>
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <Video aria-hidden className="w-5 text-[var(--brand-soft,#67a9ff)]" />
                    <p className="m-0">Hosted live by Coach JDC</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center p-8 md:p-14">
                <p className="eyebrow m-0 !tracking-[0.14em] text-sm">Network marketing &middot; Live masterclass</p>
                <h3 className="mt-3 mb-4 text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.05] tracking-[-0.04em]">
                  {PASSIVE_INCOME_EVENT_TITLE}
                </h3>
                <p className="m-0 text-[var(--muted)] leading-relaxed">
                  Learn the practical systems and habits that help a network marketing business grow beyond your
                  personal effort.
                </p>

                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold text-[var(--foreground)]">
                  <span className="flex items-center gap-2">
                    <CalendarDays aria-hidden className="w-4 text-[var(--brand)]" />
                    {eventDateLabel}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock3 aria-hidden className="w-4 text-[var(--brand)]" />
                    {eventTimeLabel} &middot; {PASSIVE_INCOME_EVENT_TIME_ZONE}
                  </span>
                </div>

                <ul className="mt-7 grid gap-3 p-0 text-sm leading-relaxed text-[var(--muted)]">
                  {takeaways.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 aria-hidden className="mt-0.5 w-4 flex-none text-[var(--brand)]" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link href="/passive-income" className="button-primary pressable mt-8 inline-flex min-h-[3.25rem] items-center justify-center gap-2 self-start px-6 text-sm font-extrabold">
                  Reserve your free seat <ArrowRight aria-hidden className="w-4" />
                </Link>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  Your private Zoom access is delivered by email after registration.
                </p>
              </div>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
