import type { Metadata } from "next";

import { mastermindSeo } from "@/lib/mastermind-seo";
import "../elite/elite.css";

export const metadata: Metadata = mastermindSeo;

export default function BuildingLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
