import type { MetadataRoute } from "next";

import { programs } from "@/data/programs";
import { eliteSiteUrl, siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPaths = [
    { path: "", priority: 0.8 },
    { path: "/programs", priority: 0.7 },
    { path: "/programs/1-on-1-coaching", priority: 0.6 },
    { path: "/about", priority: 0.5 },
    { path: "/contact", priority: 0.5 },
    { path: "/elite", priority: 0.95 },
  ];

  return [
    ...staticPaths.map((item) => ({
      url: `${siteUrl}${item.path || "/"}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: item.priority,
    })),
    ...programs
      .filter((program) => program.slug !== "jdc-mastermind")
      .map((program) => ({
        url: `${siteUrl}/programs/${program.slug}`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.55,
      })),
    {
      url: `${eliteSiteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 1,
    },
  ];
}
