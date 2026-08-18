import Link from "next/link";

import { SiteLogo } from "@/components/branding/site-logo";
import { ScrollTopButton } from "@/components/layout/scroll-top-button";
import { getResolvedBrandingSettings } from "@/lib/branding-store";

const quickLinks = [
  { href: "/programs", label: "JDC Partnership Program" },
  { href: "/programs", label: "JDC Elite Society" },
  { href: "/programs", label: "1-on-1 Coaching" },
  { href: "/programs", label: "JDC Mastermind Event" },
  { href: "/about", label: "About Coach JDC" },
  { href: "/about", label: "Success Stories" },
  { href: "/#faq", label: "FAQ" },
];

const socialLinks = [
  {
    href: "https://facebook.com/jaysondelacruzofficial",
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.5 8.5V6.8c0-.7.5-1.3 1.2-1.3H17V3h-2.1C12.6 3 11 4.6 11 6.6v1.9H9v2.6h2V21h3.5v-9.9h2.3l.4-2.6h-2.7Z" />
      </svg>
    ),
  },
  {
    href: "https://instagram.com/jaysondc01/",
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm8 1.8H8A3.2 3.2 0 0 0 4.8 8v8A3.2 3.2 0 0 0 8 19.2h8A3.2 3.2 0 0 0 19.2 16V8A3.2 3.2 0 0 0 16 4.8ZM12 8.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2Zm0 1.6A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8Zm4.55-2.85a.95.95 0 1 1-.95.95.95.95 0 0 1 .95-.95Z" />
      </svg>
    ),
  },
  {
    href: "https://youtube.com/@JaysonDelaCruzOfficial",
    label: "YouTube",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22 12.2s0-3.2-.4-4.6a2.9 2.9 0 0 0-2-2.1C18 5.1 12 5.1 12 5.1s-6 0-7.6.4a2.9 2.9 0 0 0-2 2.1C2 9 2 12.2 2 12.2s0 3.2.4 4.6a2.9 2.9 0 0 0 2 2.1c1.6.4 7.6.4 7.6.4s6 0 7.6-.4a2.9 2.9 0 0 0 2-2.1c.4-1.4.4-4.6.4-4.6ZM10 15.5V8.9l6 3.3-6 3.3Z" />
      </svg>
    ),
  },
  {
    href: "https://tiktok.com/@jaysondelacruzofficial",
    label: "TikTok",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.2 3c.4 2.6 2 4.4 4.6 4.8v2.7c-1.5 0-2.9-.5-4.1-1.3v6.2a6.4 6.4 0 1 1-6.4-6.4c.3 0 .6 0 .9.1v2.9a3.5 3.5 0 1 0 2.5 3.4V3h2.5Z" />
      </svg>
    ),
  },
];

export async function SiteFooter() {
  const branding = await getResolvedBrandingSettings();

  return (
    <footer className="site-footer">
      <div className="container-shell site-footer-grid">
        <div className="site-footer-brand">
          <SiteLogo branding={branding} inverted compact={Boolean(branding.logoUrl)} />
          <p>
            Coach Jayson Dela Cruz has guided thousands of Filipinos to rise — from OFWs and
            employees to thriving first-time entrepreneurs.
          </p>
          <div className="site-footer-socials">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
              >
                {item.icon}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h2>Quick Links</h2>
          <ul>
            {quickLinks.map((item) => (
              <li key={item.label}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2>Connect With Us</h2>
          <ul className="site-footer-contact">
            <li>
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M4 6h16v12H4V6Zm8 6.5L5.8 8h12.4L12 12.5Z" />
                </svg>
              </span>
              <a href="mailto:team@mail.coachjdc.org">team@mail.coachjdc.org</a>
            </li>
            <li>
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M6.6 3.8h2.6l1.2 3.1-1.7 1.2a12.4 12.4 0 0 0 5.2 5.2l1.2-1.7 3.1 1.2v2.6c0 .8-.7 1.5-1.5 1.5C9.7 16.9 3.1 10.3 3.1 5.3c0-.8.7-1.5 1.5-1.5Z" />
                </svg>
              </span>
              <a href="tel:+639569448114">+63 956 944 8114</a>
            </li>
            <li>
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3a8 8 0 0 1 8 8c0 5.2-8 13-8 13S4 16.2 4 11a8 8 0 0 1 8-8Zm0 5.2A2.8 2.8 0 1 0 14.8 11 2.8 2.8 0 0 0 12 8.2Z" />
                </svg>
              </span>
              <a href="https://community.coachjdc.org" target="_blank" rel="noopener noreferrer">
                community.coachjdc.org
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2>Mobile App & Legal</h2>
          <div className="site-footer-apps">
            <a
              href="https://play.google.com/store/apps/details?id=net.clientclub.app.kollab&hl=en"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download App on Android
            </a>
            <a
              href="https://apps.apple.com/us/app/gokollab/id6484272411"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download App on iPhone
            </a>
          </div>
          <ul>
            <li>
              <Link href="/terms">Terms & Conditions</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy Policy</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="container-shell site-footer-bottom">
        <ScrollTopButton />
        <p>
          This website is not part of Facebook or Meta Platforms Inc. Additionally, this site is not
          endorsed by Facebook in any way. Facebook is a trademark of Facebook, Inc. While we may
          use Facebook for advertising and connecting with our audience, the content provided here
          is our own and is not in any way affiliated with or approved by Facebook.
        </p>
        <div className="site-footer-copy">Copyright © 2026 JDC Elite Society. All Rights Reserved.</div>
      </div>
    </footer>
  );
}
