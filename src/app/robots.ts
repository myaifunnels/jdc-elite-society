import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/api",
        "/account",
        "/elite/checkout",
        "/elite/thank-you",
        "/elite/coaching-offer",
        "/checkout",
        "/thank-you",
        "/coaching-offer",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
