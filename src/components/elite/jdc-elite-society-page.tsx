"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { EliteCheckoutEmbed } from "@/components/elite/elite-checkout-embed";
import { IncludeList } from "@/components/elite/elite-checkout-form";
import { EliteTestimonialsCarousel } from "@/components/elite/elite-testimonials-carousel";
import { formatPhp, mastermindOffer } from "@/data/mastermind-offer";

const CHECKOUT_HREF = "/building/checkout?src=elite-society";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}

function EliteSocietyCtaLink({
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

const heroIncludes = [
  "Full replay of the JDC Elite Society orientation session",
  "The private JDC Elite Society community",
  "Exclusive trainings inside the member portal",
  "Exclusive modules you can revisit anytime",
];

const pillars = [
  {
    kicker: "01 · CORE PROGRAM",
    title: "Life & Money Foundations",
    body: "This is your starting point. Life & Money Foundations gives you a clear framework for long-term growth in mindset, discipline, and financial direction.",
    items: [
      "The ESBI framework explained clearly and practically",
      "How to think long-term instead of short-term",
      "The discipline behind financial stability",
      "How structure shapes daily decisions",
      "Why environment influences your progress",
    ],
    footer: "This program builds foundations before results, because growth without structure doesn't last.",
  },
  {
    kicker: "02 · LIVE ACCESS",
    title: "Weekly Live Mastermind Sessions",
    body: "Learning becomes powerful when it's applied. Every week, members gather via Zoom for live mastermind sessions focused on clarity and execution.",
    items: [
      "Direct Q&A with Coach JDC",
      "Strategic discussions",
      "Real-life growth scenarios",
      "Decision-making guidance",
      "Alignment resets",
    ],
    footer: "These sessions keep you on track and moving forward with intention. It's guidance, not just teaching.",
  },
  {
    kicker: "03 · COMMUNITY",
    title: "Private Growth Community",
    body: "Environment shapes behavior. Inside the private community, you're surrounded by people who are serious about growth.",
    items: [
      "Focused discussions",
      "Shared wins and lessons",
      "Accountability-driven conversations",
      "A structured culture of discipline",
      "Accessible from your mobile device",
    ],
    footer: "When the room changes, your standards change.",
  },
  {
    kicker: "04 · GO DEEPER",
    title: "Exclusive Trainings & Modules",
    body: "Beyond the core foundation program, you'll unlock additional structured trainings that reinforce consistency.",
    items: [
      "The Non-Negotiables System",
      "The 5 Aspects of Life Framework",
      "Discipline and execution strategies",
      "Long-term planning tools",
    ],
    footer: "Growth becomes repeatable when structure is reinforced.",
  },
  {
    kicker: "05 · AT YOUR PACE",
    title: "Replay & Resource Access",
    body: "Structure should support your schedule, not compete with it.",
    items: [
      "Full session replays",
      "Centralized learning access",
      "Organized resource hub",
      "Ongoing updates",
    ],
    footer: "Consistency becomes easier when everything is structured.",
  },
];

export function JdcEliteSocietyPage() {
  const [sticky, setSticky] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener("scroll", onScroll, { passive: true });

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sections = document.querySelectorAll<HTMLElement>(".elite-reveal");
    rootRef.current?.setAttribute("data-motion-ready", "true");

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
      <section className="elite-hero elite-hero-compact" id="top">
        <video className="elite-hero-video" autoPlay muted loop playsInline preload="auto">
          <source src={mastermindOffer.heroVideo} />
        </video>
        <div className="elite-hero-scrim" />
        <div className="elite-hero-orb" aria-hidden="true" />
        <div className="elite-shell elite-hero-copy">
          <p className="elite-kicker">A COMMUNITY BUILT FOR FILIPINOS WHO WANT MORE IN LIFE</p>
          <h1 className="elite-display elite-identity-headline">
            <span className="elite-headline-kicker">WELCOME TO</span>
            <span className="elite-headline-shift">JDC Elite Society</span>
          </h1>
          <p className="elite-sub elite-hero-positioning">Structure. Discipline. Direction.</p>
          <p className="elite-sub" style={{ marginTop: "0.75rem" }}>
            If you&apos;re an OFW planning your way home, an employee tired of the cycle of debt and work, or a
            beginner entrepreneur who wants a clear direction, JDC Elite Society gives you structure, standards, and
            a community that pushes you forward.
          </p>
          <div className="elite-hero-actions">
            <EliteSocietyCtaLink title="Join JDC Elite Society" subtext="Limited slots only" className="elite-cta-lg" />
          </div>
          <div className="elite-stats">
            <span>
              <strong>{mastermindOffer.memberCount}+</strong> members inside
            </span>
            <span>
              <strong>Weekly</strong> live sessions
            </span>
            <span>
              <strong>Lifetime</strong> replay access
            </span>
          </div>
        </div>
      </section>

      <section className="elite-section elite-reveal" id="offer">
        <div className="elite-shell">
          <p className="elite-kicker elite-center">LIMITED SLOTS ONLY</p>
          <h2 style={{ textAlign: "center" }}>Get full access.</h2>

          <div className="elite-grid-2" style={{ marginTop: "clamp(2.5rem, 5vw, 3.5rem)" }}>
            <div className="elite-glass elite-reveal-item" style={{ padding: "1.75rem" }}>
              <p className="elite-kicker">HERE&apos;S WHAT YOU GET</p>
              <IncludeList items={heroIncludes} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem 1rem", justifyContent: "space-between", marginTop: "1.75rem" }}>
                <span>Total value</span>
                <span className="elite-strike">{formatPhp(mastermindOffer.listPrice)}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem 1rem", justifyContent: "space-between", alignItems: "end" }}>
                <span>Today, just</span>
                <span className="elite-price">{formatPhp(mastermindOffer.offerPrice)}</span>
              </div>
              <EliteSocietyCtaLink
                title="Join JDC Elite Society"
                subtext="One payment. Lifetime access."
                className="elite-cta-lg elite-cta-block"
              />
            </div>

            <div className="elite-glass elite-reveal-item" style={{ padding: "1.75rem" }}>
              <p className="elite-kicker">JDC ELITE SOCIETY LEARNING ACCESS</p>
              <h3 style={{ margin: "0.6rem 0 1.2rem", fontSize: "1.3rem" }}>
                Fill out the secure form and get instant access.
              </h3>
              <EliteCheckoutEmbed variant="building" />
            </div>
          </div>
        </div>
      </section>

      <section className="elite-section elite-reveal">
        <div className="elite-shell">
          <p className="elite-kicker elite-center">MEMBER ACCESS BREAKDOWN</p>
          <h2>
            What you get <em>inside</em>
          </h2>
          <p className="elite-center elite-sub" style={{ marginInline: "auto" }}>
            Everything inside JDC Elite Society is designed around one principle: build the foundation first, the
            results follow.
          </p>

          <div className="elite-agenda" style={{ marginTop: "clamp(2rem, 4vw, 3rem)" }}>
            {pillars.map((pillar) => (
              <article className="elite-glass elite-reveal-item" key={pillar.title}>
                <p className="elite-badge">{pillar.kicker}</p>
                <h3>{pillar.title}</h3>
                <p>{pillar.body}</p>
                <IncludeList items={pillar.items} />
                <p style={{ marginTop: "1.1rem", fontStyle: "italic", color: "var(--elite-muted)" }}>
                  {pillar.footer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="elite-section elite-reveal">
        <div className="elite-shell">
          <p className="elite-kicker elite-center">TESTIMONIALS</p>
          <h2>Real people. Real results.</h2>
          <EliteTestimonialsCarousel items={mastermindOffer.testimonials} />
        </div>
      </section>

      <section className="elite-final elite-reveal">
        <div className="elite-shell">
          <p className="elite-kicker">THIS IS YOUR NEXT MOVE</p>
          <h2 className="elite-display">
            <span>Ready to transform?</span>
            <span style={{ color: "var(--elite-blue-soft)" }}>Growth doesn&apos;t happen by chance.</span>
          </h2>
          <p className="elite-sub" style={{ marginInline: "auto" }}>
            It happens when you decide to operate at a higher standard. If you&apos;re serious about discipline,
            leadership, and long-term success, this is your entry point.
          </p>
          <EliteSocietyCtaLink title="Join JDC Elite Society" subtext="Limited slots only" className="elite-cta-lg" />
        </div>
      </section>

      <div className="elite-sticky-mobile" hidden={!sticky} style={{ display: sticky ? undefined : "none" }}>
        <EliteSocietyCtaLink title="Join JDC Elite Society" subtext="Continue to checkout" />
      </div>
    </div>
  );
}
