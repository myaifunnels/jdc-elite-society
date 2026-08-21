"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

import { EliteCheckoutForm, IncludeList, PaymentInstructions } from "@/components/elite/elite-checkout-form";
import { formatPhp, mastermindOffer } from "@/data/mastermind-offer";

function scrollToPayment(event?: React.MouseEvent) {
  event?.preventDefault();
  document.getElementById("payment")?.scrollIntoView({ behavior: "smooth" });
}

export function EliteOfferPage() {
  const [sticky, setSticky] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [exitSeen, setExitSeen] = useState(false);
  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > window.innerHeight * 0.8);
    const onLeave = (event: MouseEvent) => {
      if (event.clientY <= 0 && !exitSeen) {
        setExitOpen(true);
        setExitSeen(true);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [exitSeen]);

  return (
    <div className="elite-offer">
      <div className="elite-shell elite-nav">
        <a href="#top">
          <img src={mastermindOffer.logo} alt="JDC Elite Society" className="elite-logo" />
        </a>
        <a href="#payment" className="elite-cta" onClick={scrollToPayment}>
          JOIN NOW
        </a>
      </div>

      <section className="elite-hero" id="top">
        <video className="elite-hero-video" autoPlay muted loop playsInline preload="auto">
          <source src={mastermindOffer.heroVideo} type="video/mp4" />
        </video>
        <div className="elite-hero-scrim" />
        <div className="elite-shell elite-hero-copy">
          <p className="elite-kicker">JDC MASTERMIND — NOW OPEN</p>
          <h1 className="elite-display">
            <span>Get full access to</span>
            <span className="elite-hero-title">JDC MASTERMIND</span>
          </h1>
          <p className="elite-kicker" style={{ marginTop: 10 }}>
            Structure. Discipline. Direction.
          </p>
          <p className="elite-sub">
            Kung ikaw ay OFW na nagpaplano ng uwi, empleyado na pagod na sa cycle ng utang at trabaho, o baguhan na
            entrepreneur na naghahanap ng direksyon — ang JDC Mastermind ang bibigay sa iyo ng structure, standards, at
            komunidad na itutulak ka pasulong.
          </p>
          <a href="#payment" className="elite-cta elite-cta-lg" onClick={scrollToPayment}>
            JOIN NOW
          </a>
          <p className="elite-warn">⚠ JDC Mastermind · Unlimited Lifetime Access</p>
          <div className="elite-stats">
            <span>{mastermindOffer.memberCount} Members</span>
            <span>{formatPhp(mastermindOffer.listPrice)} Value</span>
            <span>2 Full Sessions</span>
          </div>
        </div>
      </section>

      <section className="elite-section" id="payment">
        <div className="elite-shell">
          <p className="elite-kicker elite-center">LIMITED SLOTS ONLY</p>
          <h2>
            GET <em>FULL ACCESS</em>
          </h2>
          <div className="elite-grid-2">
            <div className="elite-glass" style={{ padding: "1.5rem" }}>
              <p className="elite-kicker">PAYMENT INSTRUCTIONS</p>
              <PaymentInstructions />
            </div>
            <div className="elite-glass" style={{ padding: "1.5rem" }}>
              <p className="elite-kicker">JDC ELITE SOCIETY LEARNING ACCESS</p>
              <p>Here&apos;s what you get:</p>
              <IncludeList items={mastermindOffer.includes} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
                <span>Total Value:</span>
                <span className="elite-strike">{formatPhp(mastermindOffer.listPrice)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
                <span>Today Only:</span>
                <span className="elite-price">{formatPhp(mastermindOffer.offerPrice)}</span>
              </div>
              <p style={{ textAlign: "right", fontStyle: "italic", fontSize: "0.8rem" }}>
                Limited time offer · JDC Mastermind
              </p>
              <a href="#checkout" className="elite-cta elite-cta-lg" style={{ width: "100%", marginTop: "1rem" }}>
                JOIN NOW
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="elite-section">
        <div className="elite-shell">
          <p className="elite-kicker elite-center">WHAT&apos;S INCLUDED</p>
          <h2>WHAT YOU GET INSIDE</h2>
          <p className="elite-quote">&quot;Dalawang sessions. Isang komunidad. Habambuhay na access.&quot;</p>
          <div className="elite-grid-2">
            {mastermindOffer.sessions.map((session) => (
              <article className="elite-card" key={session.title}>
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

      <section className="elite-section">
        <div className="elite-shell">
          <p className="elite-kicker elite-center">MASTERMIND — NOW OPEN</p>
          <h2>JDC MASTERMIND — FULL ACCESS</h2>
          <p className="elite-center elite-sub" style={{ marginInline: "auto" }}>
            Ito ang JDC Mastermind. Kapag sumali ka ngayon, makukuha mo agad ang full access sa dalawang Mastermind
            Sessions. Panoorin anytime, anywhere.
          </p>
          <div className="elite-agenda">
            {mastermindOffer.agenda.map((item) => (
              <article className="elite-glass" key={item.session}>
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
              JOIN NOW
            </a>
          </p>
        </div>
      </section>

      <section className="elite-section">
        <div className="elite-shell">
          <p className="elite-kicker elite-center">TESTIMONIALS</p>
          <h2>Real People. Real Results.</h2>
          <p className="elite-center elite-sub" style={{ marginInline: "auto" }}>
            Hindi kami nagbebenta ng pangarap. Nagbibigay kami ng structure para marating mo ang iyo.
          </p>
          <div className="elite-testimonials">
            {mastermindOffer.testimonials.map((item) => (
              <figure className="elite-glass" key={item.name}>
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
            {mastermindOffer.memberCount} miyembro na. Parehong OFW, empleyado, at entrepreneur. Lahat ay nagsimula sa
            iisang desisyon.
          </p>
          <p className="elite-center">
            <a href="#payment" className="elite-cta elite-cta-lg" onClick={scrollToPayment}>
              JOIN NOW
            </a>
          </p>
        </div>
      </section>

      <section className="elite-section">
        <div className="elite-shell elite-about">
          <img src={mastermindOffer.coachImage} alt="Coach Jayson Dela Cruz Background" />
          <div>
            <p className="elite-kicker">ABOUT YOUR COACH</p>
            <p className="elite-display" style={{ fontSize: "1.15rem" }}>
              A BUSINESS COACH & COMMUNITY BUILDER
            </p>
            <h2 className="elite-display">COACH JDC</h2>
            <p>
              Para sa halos dalawang dekada, si Coach Jayson Dela Cruz ay isa sa pinaka-influential na Filipino business
              coaches — nakatulong na sa libu-libong OFWs, empleyado, at mga nagtatayo ng negosyo na maabot ang kanilang
              mga pangarap.
            </p>
            <p>
              Naniniwala si Coach JDC na ang tunay na tagumpay ay hindi nangyayari nang aksidente. Ito ay resulta ng
              malinaw na structure, hindi matitinag na disiplina, at tamang direksyon.
            </p>
            <p>Mga framework na nilikha ni Coach JDC:</p>
            <IncludeList items={mastermindOffer.frameworks} />
            <a href="#payment" className="elite-cta elite-cta-lg" onClick={scrollToPayment} style={{ marginTop: "1.25rem" }}>
              JOIN NOW
            </a>
          </div>
        </div>
      </section>

      <section className="elite-section" id="checkout">
        <div className="elite-shell">
          <p className="elite-kicker elite-center">HULING HAKBANG</p>
          <h2>HANDA KA NA BA? KUMUHA NG FULL ACCESS NGAYON</h2>
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

      <section className="elite-final">
        <div className="elite-shell">
          <p className="elite-kicker">ITO NA ANG IYONG SUSUNOD NA HAKBANG.</p>
          <h2 className="elite-display">
            <span>HANDA KA NANG</span>
            <span style={{ color: "var(--elite-electric)" }}>MAG-TRANSFORM?</span>
          </h2>
          <p className="elite-sub" style={{ marginInline: "auto" }}>
            Growth doesn&apos;t happen by chance. It happens when you decide to operate at a higher standard. If
            you&apos;re serious about discipline, leadership, and long-term success — this is your entry point.
          </p>
          <a href="#payment" className="elite-cta elite-cta-lg" onClick={scrollToPayment}>
            JOIN NOW
          </a>
          <p className="elite-warn">⚠ JDC Mastermind · Lifetime Access · Full Sessions</p>
          <p style={{ fontStyle: "italic", color: "var(--elite-muted)" }}>
            Kapag punu na ang slots, sarado na ang offer na ito. Huwag hayaang maulit ang &quot;sana noon pa.&quot;
          </p>
        </div>
      </section>

      <footer className="elite-footer">
        <div className="elite-shell elite-footer-grid">
          <div>
            <img src={mastermindOffer.logo} alt="JDC Elite Society" className="elite-logo" />
            <p>JDC Mastermind · Full access to two sessions, community, and lifetime replays.</p>
          </div>
          <div>
            <h3>QUICK LINKS</h3>
            <a href="https://coachjdc.org/elite">JOIN ELITE SOCIETY →</a>
            <a href="https://coachjdc.org/programs">1-ON-1 COACHING →</a>
            <a href={mastermindOffer.communityUrl}>COMMUNITY →</a>
            <a href="https://coachjdc.org/dashboard/partnership">JDC PARTNERSHIP PROGRAM →</a>
            <a href={mastermindOffer.androidApp}>DOWNLOAD APP ON ANDROID →</a>
            <a href={mastermindOffer.iosApp}>DOWNLOAD APP ON iPHONE →</a>
          </div>
          <div>
            <h3>CONNECT</h3>
            <a href={`mailto:${mastermindOffer.support.email}`}>{mastermindOffer.support.email}</a>
            <a href={`tel:${mastermindOffer.support.tel}`}>{mastermindOffer.support.phone}</a>
            <a href="https://facebook.com/jaysondelacruzofficial">Facebook</a>
            <a href="https://instagram.com/jaysondc01">Instagram</a>
            <a href="https://tiktok.com/@jaysondelacruzofficial">TikTok</a>
            <a href="https://youtube.com/@JaysonDelaCruzOfficial">YouTube</a>
          </div>
        </div>
        <div className="elite-shell elite-legal">
          <p>
            This website is not part of Facebook or Facebook Inc. Additionally, this site is not endorsed by Facebook in
            any way. Facebook is a trademark of Facebook, Inc.
          </p>
          <p>Copyright 2026. JDC. All Rights Reserved.</p>
        </div>
      </footer>

      <div className="elite-sticky-mobile" hidden={!sticky} style={{ display: sticky ? undefined : "none" }}>
        <a href="#payment" className="elite-cta" onClick={scrollToPayment}>
          JOIN NOW
        </a>
      </div>

      {exitOpen ? (
        <div className="elite-modal" role="dialog" aria-modal="true">
          <div className="elite-modal-card elite-glass">
            <button className="elite-close" type="button" onClick={() => setExitOpen(false)} aria-label="Close">
              ×
            </button>
            <h2 className="elite-display">Aalis ka na ba?</h2>
            <p className="elite-center">Bago ka umalis — alalahanin mo:</p>
            <IncludeList
              items={[
                `JDC Mastermind — ${formatPhp(mastermindOffer.couponPrice)} lang (SPARTANS coupon)`,
                "Limited time offer — kapag tapos na, tapos na",
                `Regular price ay ${formatPhp(mastermindOffer.listPrice)}`,
              ]}
            />
            <a
              href="#payment"
              className="elite-cta elite-cta-lg"
              style={{ width: "100%", marginTop: "1.5rem" }}
              onClick={(event) => {
                setExitOpen(false);
                scrollToPayment(event);
              }}
            >
              JOIN NOW
            </a>
            <button className="elite-ghost" type="button" onClick={() => setExitOpen(false)}>
              Hindi, okay lang mawala ang slot ko.
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
