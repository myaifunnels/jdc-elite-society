import type { Metadata } from "next";
import Script from "next/script";

import { mastermindOffer } from "@/data/mastermind-offer";
import { mastermindSeo } from "@/lib/mastermind-seo";
import "./elite.css";

export const metadata: Metadata = mastermindSeo;

export default function EliteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      <Script
        src="https://widgets.leadconnectorhq.com/loader.js"
        data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
        data-widget-id={mastermindOffer.chatWidgetId}
        strategy="lazyOnload"
      />
    </div>
  );
}
