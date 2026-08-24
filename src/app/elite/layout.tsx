import type { Metadata } from "next";
import Script from "next/script";

import { mastermindOffer } from "@/data/mastermind-offer";
import { eliteSiteUrl } from "@/lib/site";
import "./elite.css";

export const metadata: Metadata = {
  metadataBase: new URL(eliteSiteUrl),
  title: {
    absolute: mastermindOffer.title,
  },
  description: mastermindOffer.description,
  openGraph: {
    title: "JDC Mastermind | Full Access (SPARTANS: PHP 1,500)",
    description: mastermindOffer.description,
    url: eliteSiteUrl,
    images: [{ url: mastermindOffer.ogImage }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JDC Mastermind | Full Access (SPARTANS: PHP 1,500)",
    description: mastermindOffer.description,
    images: [mastermindOffer.ogImage],
  },
};

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
