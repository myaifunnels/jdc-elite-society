"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { EliteTestimonialsCarousel } from "@/components/elite/elite-testimonials-carousel";
import { IncludeList } from "@/components/elite/elite-checkout-form";
import { formatPhp, mastermindOffer } from "@/data/mastermind-offer";

const CHECKOUT_HREF = "/elite/checkout?src=breakthrough";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}

function MastermindCtaLink({
  title,
  subtext,
  className = "",
}: {
  title: string;
  subtext: string;
  className?: string;
}) {
  return (
    <Link href={CHECKOUT_HREF} className={`elite-cta elite-cta-rich ${className}`.trim()}>
      <span className="elite-cta-copy">
        <strong>{title}</strong>
        <small>{subtext}</small>
      </span>
      <span className="elite-cta-icon">
        <ArrowIcon />
      </span>
    </Link>
  );
}

const execution = mastermindOffer.sessions[1];

export function MastermindBatch2Page() {
  const [sticky, setSticky] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener("scroll", onScroll, { passive: true });

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sections = document.querySelectorAll<HTMLElement>(".elite-reveal");
    rootRef.current?.setAttribute("data-motion-ready", "true");

    if (window.location.hash) {
      document.querySelector<HTMLElement>(window.location.hash)?.setAttribute("data-visible", "true");
    }

    if (reducedMotion || !("IntersectionObserver" in window)) {
      sections.forEach((section) => section.setAttribute("data-visible", "true"));
      return () => window.removeEventListener("scroll", onScroll);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).setAttribute("data-visible", "true");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12%", threshold: 0.12 },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className="elite-offer" data-motion-ready="false">
      <section className="elite-hero" id="top">
        <video className="elite-hero-video" autoPlay muted loop playsInline preload="auto">
          <source src={mastermindOffer.heroVideo} />
        </video>
        <div className="elite-hero-scrim" />
        <div className="elite-hero-orb" aria-hidden="true" />
        <div className="elite-shell elite-hero-copy">
          <p className="elite-kicker">COACH JAYSON DELA CRUZ</p>
          <h1 className="elite-display elite-identity-headline">
            <span className="elite-headline-line">JDC MASTERMIND</span>
            <span className="elite-headline-shift">
              Your Breakthrough Begins the Moment <em>You Decide to Rise.</em>
            </span>
          </h1>
          <p className="elite-sub elite-hero-positioning">
            The waiting ends here and real change begins. This is the stage where decisions turn into momentum, and
            momentum turns into results.
          </p>
          <div className="elite-hero-actions">
            <MastermindCtaLink
              title="Claim your seat for only ₱2,000"
              subtext="Early bird discount"
              className="elite-cta-lg"
            />
          </div>
          <p className="elite-warn">Regular ₱5,000 · Full Value ₱14,999</p>
        </div>
      </section>

      <section className="elite-section elite-reveal">
        <div className="elite-shell">
          <p className="elite-kicker elite-center">THE STANDARD YOU&apos;VE BEEN SEARCHING FOR</p>
          <h2>
            Talent is everywhere. <em>Standards aren&apos;t.</em>
          </h2>
          <p className="elite-center elite-sub" style={{ marginInline: "auto" }}>
            You didn&apos;t fight your way here just to stay in the middle. Every empire begins with one moment — the
            moment someone got tired of struggling and chose precision, discipline, and execution.
          </p>
          <p className="elite-center elite-quote">This is that moment.</p>
        </div>
      </section>

      <section className="elite-section elite-reveal" id="offer">
        <div className="elite-shell">
          <p className="elite-badge">SESSION 2</p>
          <h2>EXECUTION</h2>
          <p className="elite-quote">
            Foundation gave you clarity. Execution gives you strength. This is where standards turn into systems, and
            systems create progress you can finally trust.
          </p>
          <p className="elite-kicker">What you will get in this session:</p>
          <div className="elite-glass" style={{ padding: "1.5rem" }}>
            <IncludeList
              items={[
                "The Passive Growth Principles — build leaders, multiply impact, create income that doesn't depend on your hours",
                "The Complete 6-Step Partner Growth System — a clear, duplicable structure designed for real expansion",
                "Leadership and the 5 Aspects of Life — true leadership is built in every area, not just business",
                "Live Sessions with Coach JDC — direct, personal, precise, and real experience advice",
              ]}
            />
          </div>
          <p className="elite-center elite-sub" style={{ marginInline: "auto", marginTop: "1.5rem" }}>
            This isn&apos;t content. This is a transformation with clear results.
          </p>
          {execution ? (
            <div className="elite-grid-2" style={{ marginTop: "2rem" }}>
              <article className="elite-card elite-reveal-item">
                <img src={execution.image} alt={execution.title} />
                <p className="meta">{execution.kicker}</p>
                <h3>{execution.title}</h3>
                <p>{execution.body}</p>
                <IncludeList items={execution.bullets} />
              </article>
            </div>
          ) : null}
        </div>
      </section>

      <section className="elite-section elite-reveal">
        <div className="elite-shell">
          <p className="elite-kicker elite-center">A SMALL INVESTMENT IN A BIGGER STANDARD</p>
          <h2>This is a framework built for Filipinos who want to take action and immediate change.</h2>
          <div className="elite-grid-2">
            <div className="elite-glass" style={{ padding: "1.5rem" }}>
              <p className="elite-kicker">YOU WILL GET FULL ACCESS</p>
              <IncludeList
                items={[
                  "Foundation + Execution — two complete sessions that rebuild how you think, act, and lead",
                  "Lifetime replays — revisit every breakthrough anytime",
                  "Private JDC Elite Society — accountability, standards, and a community that refuses average",
                  "Mobile access — watch anywhere through Android and iPhone",
                  "A system you can apply the same night you learn it",
                ]}
              />
            </div>
            <div className="elite-glass" style={{ padding: "1.5rem" }}>
              <p className="elite-kicker">YOUR INVESTMENT</p>
              <p>
                Foundation. Execution. Lifetime replays. The private Elite Society. Access anywhere, anytime.
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
                <span>Full Package Value:</span>
                <span className="elite-strike">{formatPhp(mastermindOffer.listPrice)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Regular Price:</span>
                <span className="elite-strike">{formatPhp(mastermindOffer.regularPrice)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
                <span>Early Bird Rate (7 days only):</span>
                <span className="elite-price">{formatPhp(mastermindOffer.offerPrice)}</span>
              </div>
              <p style={{ textAlign: "right", fontStyle: "italic", fontSize: "0.8rem" }}>
                One payment. Lifetime access. No exceptions after the deadline.
              </p>
              <MastermindCtaLink
                title="Secure my ₱2,000 seat"
                subtext="One payment. No recurring fees."
                className="elite-cta-lg elite-cta-block"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="elite-section elite-reveal">
        <div className="elite-shell">
          <p className="elite-kicker elite-center">RESULTS WALL</p>
          <h2>Overwhelming proof. Real members. Playing now.</h2>
          <p className="elite-center elite-sub" style={{ marginInline: "auto" }}>
            This is the volume of results inside JDC Mastermind — story after story, already rolling. Hit play on the
            video in front to hear that member. Only that clip has audio.
          </p>
          <EliteTestimonialsCarousel items={mastermindOffer.testimonials} />
        </div>
      </section>

      <section className="elite-section elite-reveal elite-about" id="coach">
        <img className="elite-about-media" src={mastermindOffer.coachImage} alt="" aria-hidden="true" />
        <div className="elite-about-scrim" />
        <div className="elite-shell">
          <div className="elite-coach-copy">
            <p className="elite-kicker">MEET COACH JDC</p>
            <h2>He doesn&apos;t teach hype. He teaches standards.</h2>
            <p className="elite-coach-lead">
              Coach Jayson Dela Cruz helps ambitious Filipinos turn hard work into a clear, disciplined path forward.
            </p>
            <p>
              His work speaks to OFWs preparing for life after the contract, employees ready to build a new source of
              income, and entrepreneurs determined to lead with intention. His philosophy is simple: clarity sets the
              direction, discipline builds the path, and execution changes the result.
            </p>
            <blockquote>Your life changes the moment your standards become stronger than your excuses.</blockquote>
            <p className="elite-warn">{mastermindOffer.memberCount}+ members. Built on results, not noise.</p>
            <p className="elite-framework-label">Signature frameworks inside the Mastermind</p>
            <IncludeList items={mastermindOffer.frameworks} />
            <MastermindCtaLink
              title="Secure my lifetime access"
              subtext="Join the JDC Mastermind"
              className="elite-cta-lg"
            />
          </div>
          <div className="elite-coach-caption">
            <strong>Coach Jayson Dela Cruz</strong>
            <span>Founder, JDC Elite Society</span>
          </div>
        </div>
      </section>

      <section className="elite-section elite-reveal elite-faq" id="faq">
        <div className="elite-shell">
          <p className="elite-kicker elite-center">STRAIGHT ANSWERS</p>
          <h2>What people ask before they join JDC Mastermind</h2>
          <p className="elite-center elite-sub" style={{ marginInline: "auto" }}>
            Clear answers for people deciding whether this is the right one for them.
          </p>
          <div className="elite-faq-list">
            {mastermindOffer.faqs.map((item) => (
              <article className="elite-glass elite-reveal-item" key={item.question}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="elite-final elite-reveal">
        <div className="elite-shell">
          <p className="elite-kicker">THE MOMENT IS NOW</p>
          <h2 className="elite-display">
            <span>You already have the work ethic.</span>
            <span style={{ color: "var(--elite-blue-soft)" }}>What you need is the structure that matches it.</span>
          </h2>
          <p className="elite-sub" style={{ marginInline: "auto" }}>
            Rise isn&apos;t a feeling. Rise is a decision. Make it tonight.
          </p>
          <MastermindCtaLink
            title="Yes — I'm claiming my ₱2,000 seat"
            subtext="Continue to the secure payment page"
            className="elite-cta-lg"
          />
          <p className="elite-warn">Regular Price is ₱5,000 · Full Value ₱14,999</p>
        </div>
      </section>

      <div className="elite-sticky-mobile" hidden={!sticky} style={{ display: sticky ? undefined : "none" }}>
        <MastermindCtaLink title="Claim my ₱2,000 seat" subtext="Continue to checkout" />
      </div>
    </div>
  );
}
