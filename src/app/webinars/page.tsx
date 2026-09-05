import type { Metadata } from "next";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Video } from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import {
  PASSIVE_INCOME_EVENT_TIME_LABEL,
  PASSIVE_INCOME_EVENT_TIME_ZONE,
  PASSIVE_INCOME_EVENT_TITLE,
} from "@/lib/passive-income-event";

import styles from "./webinars.module.css";

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

export default function WebinarsPage() {
  return (
    <div className={styles.page}>
      <SiteHeader />
      <main>
        <section className={styles.hero}>
          <div className="container-shell">
            <p className={styles.eyebrow}>Coach JDC live training</p>
            <h1>Webinars built for people ready to do the work.</h1>
            <p className={styles.intro}>
              Practical live sessions on business, leadership, and building income with a system you can repeat.
            </p>
          </div>
        </section>

        <section className={styles.listing} aria-labelledby="upcoming-webinars">
          <div className="container-shell">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Next live session</p>
                <h2 id="upcoming-webinars">Upcoming webinar</h2>
              </div>
              <span className={styles.livePill}><i /> Live online</span>
            </div>

            <article className={styles.card}>
              <div className={styles.visual}>
                <div className={styles.visualShade} aria-hidden />
                <div className={styles.visualContent}>
                  <span className={styles.freeBadge}>Free masterclass</span>
                  <div>
                    <Video aria-hidden />
                    <p>Hosted live by Coach JDC</p>
                  </div>
                </div>
              </div>

              <div className={styles.cardBody}>
                <p className={styles.cardKicker}>Network marketing &middot; Live masterclass</p>
                <h3>{PASSIVE_INCOME_EVENT_TITLE}</h3>
                <p className={styles.cardCopy}>
                  Learn the practical systems and habits that help a network marketing business grow beyond your personal effort.
                </p>

                <div className={styles.meta}>
                  <span><CalendarDays aria-hidden /> {PASSIVE_INCOME_EVENT_TIME_LABEL.split(" at ")[0]}</span>
                  <span><Clock3 aria-hidden /> 7:30 PM &middot; {PASSIVE_INCOME_EVENT_TIME_ZONE}</span>
                </div>

                <ul className={styles.takeaways}>
                  {takeaways.map((item) => (
                    <li key={item}><CheckCircle2 aria-hidden /> {item}</li>
                  ))}
                </ul>

                <Link className={styles.cta} href="/passive-income">
                  Reserve your free seat <ArrowRight aria-hidden />
                </Link>
                <p className={styles.accessNote}>Your private Zoom access is delivered by email after registration.</p>
              </div>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
