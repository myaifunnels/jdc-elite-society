"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

import { mastermindOffer } from "@/data/mastermind-offer";

// Kept off the authenticated dashboard (which already has its own Support ticket system) and the
// auth screens -- everywhere else on the public site gets the real GoHighLevel chat widget
// instead of the old "Talk to Coach" sticky button + inline form.
const hiddenPaths = ["/dashboard", "/login", "/register", "/forgot-password", "/reset-password", "/account"];

export function SiteChatWidget() {
  const pathname = usePathname();

  if (hiddenPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return null;
  }

  return (
    <Script
      src="https://widgets.leadconnectorhq.com/loader.js"
      data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
      data-widget-id={mastermindOffer.chatWidgetId}
      strategy="lazyOnload"
    />
  );
}
