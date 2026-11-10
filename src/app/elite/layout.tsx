import type { Metadata } from "next";

import { mastermindSeo } from "@/lib/mastermind-seo";
import "./elite.css";

export const metadata: Metadata = mastermindSeo;

export default function EliteLayout({ children }: { children: React.ReactNode }) {
  // The GHL chat widget now loads site-wide from the root layout (src/app/layout.tsx) instead of
  // just here, so it isn't duplicated on /elite pages.
  return <div>{children}</div>;
}
