import type { MetadataRoute } from "next";

import { programs } from "@/data/programs";
import { eliteSiteUrl, siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "",
    "/programs",
    "/programs/1-on-1-coaching",
    "/about",
    "/contact",
    "/register",
    "/login",
    "/elite",
  ];

  return [
    ...staticPaths.map((path) => ({
      url: `${siteUrl}${path || "/"}`,
    })),
    ...programs.filter((program) => program.slug !== "jdc-mastermind").map((program) => ({
      url: `${siteUrl}/programs/${program.slug}`,
    })),
    { url: `${eliteSiteUrl}/` },
  ];
}
