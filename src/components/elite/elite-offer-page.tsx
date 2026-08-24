"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";

import { EliteCheckoutForm, IncludeList, PaymentInstructions } from "@/components/elite/elite-checkout-form";
import { formatPhp, mastermindOffer } from "@/data/mastermind-offer";

function scrollToPayment(event?: React.MouseEvent) {
  event?.preventDefault();
  document.getElementById("payment")?.scrollIntoView({ behavior: "smooth" });
}

export function EliteOfferPage() {
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
          <source src={mastermindOffer.heroVideo} type="video/mp4" />
        </video>
        <div className="elite-hero-scrim" />
        <div className="elite-hero-orb" aria-hidden="true" />
        <div className="elite-shell elite-hero-copy">
          <p className="elite-kicker">JDC MASTERMIND · LIFETIME ACCESS</p>
          <h1 className="elite-display">
            <span>Stop collecting advice.</span>
            <span className="elite-hero-title">Start building your next chapter.</span>
          </h1>
          <p className="elite-sub">
            Hindi ka kulang sa sipag. Kulang ka sa sistemang magbibigay ng direksyon sa sipag mo. Build the mindset,
            discipline, and leadership system that turns your next move into measurable progress with Coach JDC and a
            community that expects you to follow through.
          </p>
          <a href="#payment" className="elite-cta elite-cta-lg" onClick={scrollToPayment}>
            Start the Mastermind
          </a>
          <p className="elite-warn">One payment · Lifetime replay access · Watch on any device</p>
          <div className="elite-stats">
            <span><strong>{mastermindOffer.memberCount}+</strong> members inside</span>
            <span><strong>2</strong> focused sessions</span>
            <span><strong>Lifetime</strong> access</span>
          </div>
        </div>
      </section>

      <section className="elite-section elite-reveal elite-proof" id="payment">
        <div className="elite-shell">
          <p className="elite-kicker elite-center">A SMALL INVESTMENT IN A BIGGER STANDARD</p>
          <h2>
            Everything you need to move <em>from stuck to structured.</em>
          </h2>
          <div className="elite-grid-2">
            <div className="elite-glass" style={{ padding: "1.5rem" }}>
              <p className="elite-kicker">PAYMENT INSTRUCTIONS</p>
              <PaymentInstructions />
            </div>
            <div className="elite-glass" style={{ padding: "1.5rem" }}>
              <p className="elite-kicker">YOUR COMPLETE ACCESS</p>
              <p>Not another course to collect. A practical operating system you can use immediately.</p>
              <IncludeList items={mastermindOffer.includes} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
                <span>Total Value:</span>
                <span className="elite-strike">{formatPhp(mastermindOffer.listPrice)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
                <span>Your investment:</span>
                <span className="elite-price">{formatPhp(mastermindOffer.offerPrice)}</span>
              </div>
              <p style={{ textAlign: "right", fontStyle: "italic", fontSize: "0.8rem" }}>
                One-time payment · no recurring fee
              </p>
              <a href="#checkout" className="elite-cta elite-cta-lg" style={{ width: "100%", marginTop: "1rem" }}>
                Secure my access
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="elite-section elite-reveal">
        <div className="elite-shell">
          <p className="elite-kicker elite-center">THE EXPERIENCE</p>
          <h2>Built for action. Made for follow-through.</h2>
          <p className="elite-quote">Two sessions. One committed community. A standard you can carry for life.</p>
          <div className="elite-grid-2">
            {mastermindOffer.sessions.map((session) => (
              <article className="elite-card elite-reveal-item" key={session.title}>
                <img src={session.image} alt={session.title} />
                <p className="meta">{session.kicker}</p>
                <h3>{session.title}</h3>
                <p>{session.body}</p>
                <IncludeList items={session.bullets} />
                <p style={{ marginTop: "0.9rem", fontStyle: "italic", color: "var(--elite-muted)" }}>
                  {"footer" in session && session.footer ? session.footer : "Full Session · Available Now"}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="elite-section elite-reveal">
        <div className="elite-shell">
          <p className="elite-kicker elite-center">THE ROADMAP</p>
          <h2>First, build the foundation. Then, execute.</h2>
          <p className="elite-center elite-sub" style={{ marginInline: "auto" }}>
            Clarity without execution changes nothing. This two-part path helps you decide what matters, build the
            discipline to follow through, and lead yourself before you lead anyone else.
          </p>
          <div className="elite-agenda">
            {mastermindOffer.agenda.map((item) => (
              <article className="elite-glass elite-reveal-item" key={item.session}>
                <p className="elite-badge">{item.session}</p>
                <h3>{item.title}</h3>
                <p>Full Mastermind Session</p>
                <IncludeList items={item.bullets} />
                <p className="elite-badge" style={{ marginTop: "1rem" }}>
                  INCLUDED
                </p>
              </article>
            ))}
          </div>
          <p className="elite-center" style={{ marginTop: "1.5rem" }}>
            Lahat ng sessions ay available na sa portal para mapanood mo anytime.
          </p>
          <p className="elite-center">
            <a href="#payment" className="elite-cta elite-cta-lg" onClick={scrollToPayment}>
              Get lifetime access
            </a>
          </p>
        </div>
      </section>

      <section className="elite-section elite-reveal">
        <div className="elite-shell">
          <p className="elite-kicker elite-center">TESTIMONIALS</p>
          <h2>Real people. Higher standards.</h2>
          <p className="elite-center elite-sub" style={{ marginInline: "auto" }}>
            Walang overnight-success promise dito. Real stories from people who chose structure, accountability, and
            consistent action.
          </p>
          <div className="elite-testimonials">
            {mastermindOffer.testimonials.map((item) => (
              <figure className="elite-glass elite-reveal-item" key={item.name}>
                <video controls playsInline preload="metadata">
                  <source src={item.video} />
                </video>
                <figcaption>
                  <strong>{item.name}</strong>
                  <span>{item.title}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="elite-center" style={{ marginTop: "1.5rem" }}>
            {mastermindOffer.memberCount}+ members are already inside. OFWs, employees, and entrepreneurs who decided
            that “someday” was no longer a strategy.
          </p>
          <p className="elite-center">
            <a href="#payment" className="elite-cta elite-cta-lg" onClick={scrollToPayment}>
              Join the community
            </a>
          </p>
        </div>
      </section>

      <section className="elite-section elite-reveal" id="coach">
        <div className="elite-shell elite-about">
          <div className="elite-coach-portrait">
            <img src={mastermindOffer.coachImage} alt="Coach Jayson Dela Cruz" />
            <div className="elite-coach-caption">
              <strong>Coach Jayson Dela Cruz</strong>
              <span>Founder, JDC Elite Society</span>
            </div>
          </div>
          <div className="elite-coach-copy">
            <p className="elite-kicker">MEET COACH JDC</p>
            <h2>Standards before motivation.</h2>
            <p className="elite-coach-lead">
              Coach Jayson Dela Cruz helps ambitious Filipinos turn hard work into a clear, disciplined path forward.
            </p>
            <p>
              His work speaks to OFWs preparing for life after the contract, employees ready to build a new source of
              income, and entrepreneurs determined to lead with more intention. The philosophy is simple: clarity sets
              the direction, discipline creates momentum, and execution changes the result.
            </p>
            <blockquote>
              Your life changes when your standards become stronger than your excuses.
            </blockquote>
            <div className="elite-coach-principles" aria-label="Coach JDC principles">
              <span>Clarity</span>
              <span>Discipline</span>
              <span>Execution</span>
            </div>
            <p className="elite-framework-label">Signature frameworks inside the Mastermind</p>
            <IncludeList items={mastermindOffer.frameworks} />
            <a href="#payment" className="elite-cta elite-cta-lg" onClick={scrollToPayment}>
              Learn with Coach JDC
            </a>
          </div>
        </div>
      </section>

      <section className="elite-section elite-reveal" id="checkout">
        <div className="elite-shell">
          <p className="elite-kicker elite-center">YOUR NEXT MOVE</p>
          <h2>Give your next chapter a real starting point.</h2>
          <p className="elite-center">
            {formatPhp(mastermindOffer.offerPrice)} · JDC Mastermind · Lifetime Access
          </p>
          <div className="elite-checkout" style={{ marginTop: "2rem" }}>
            <div className="elite-glass" style={{ padding: "1.5rem" }}>
              <p className="elite-kicker">PAYMENT INSTRUCTIONS</p>
              <PaymentInstructions />
              <p className="elite-kicker" style={{ marginTop: "1.5rem" }}>
                OFFER SUMMARY
              </p>
              <p>
                {formatPhp(mastermindOffer.listPrice)} → {formatPhp(mastermindOffer.offerPrice)}
              </p>
              <IncludeList items={mastermindOffer.offerSummary} />
              <p className="elite-kicker" style={{ marginTop: "1.25rem" }}>
                PAYMENT OPTIONS:
              </p>
              <div className="elite-account">
                BPI Bank
                <div>{mastermindOffer.payments.bpi.name}</div>
                <strong>{mastermindOffer.payments.bpi.number}</strong>
              </div>
              <div className="elite-account" style={{ marginTop: "0.8rem" }}>
                GCash
                <div>{mastermindOffer.payments.gcash.name}</div>
                <strong>{mastermindOffer.payments.gcash.number}</strong>
              </div>
            </div>
            <EliteCheckoutForm />
          </div>
        </div>
      </section>

      <section className="elite-final elite-reveal">
        <div className="elite-shell">
          <p className="elite-kicker">THE DECISION IS SMALL. THE STANDARD ISN&apos;T.</p>
          <h2 className="elite-display">
            <span>Your future does not need</span>
            <span style={{ color: "var(--elite-blue-soft)" }}>another “someday.”</span>
          </h2>
          <p className="elite-sub" style={{ marginInline: "auto" }}>
            You already know how to work hard. Now give that effort direction. Build the discipline, leadership, and
            execution system that can keep working long after motivation fades.
          </p>
          <a href="#payment" className="elite-cta elite-cta-lg" onClick={scrollToPayment}>
            Start now
          </a>
          <p className="elite-warn">JDC Mastermind · Full sessions · Lifetime access</p>
          <p style={{ fontStyle: "italic", color: "var(--elite-muted)" }}>
            The best time to build the system was earlier. The next best time is the moment you stop postponing it.
          </p>
        </div>
      </section>

      <div className="elite-sticky-mobile" hidden={!sticky} style={{ display: sticky ? undefined : "none" }}>
        <a href="#payment" className="elite-cta" onClick={scrollToPayment}>
          Get full access
        </a>
      </div>

    </div>
  );
}
