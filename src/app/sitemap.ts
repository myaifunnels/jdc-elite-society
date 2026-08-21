import type { MetadataRoute } from "next";

import { programs } from "@/data/programs";
import { eliteSiteUrl, siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["", "/programs", "/about", "/contact", "/register", "/login", "/elite"];

  return [
    ...staticPaths.map((path) => ({
      url: `${siteUrl}${path || "/"}`,
    })),
    ...programs.map((program) => ({
      url: `${siteUrl}/programs/${program.slug}`,
    })),
    { url: `${eliteSiteUrl}/` },
  ];
}
