import type { Metadata } from "next";

import { mastermindBatch2Seo } from "@/lib/mastermind-batch2-seo";
import "../elite/elite.css";

export const metadata: Metadata = mastermindBatch2Seo;

export default function MastermindLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
