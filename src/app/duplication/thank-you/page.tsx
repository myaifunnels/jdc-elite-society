import type { Metadata } from "next";

import { EliteThankYou } from "@/components/elite/elite-thank-you";

export const metadata: Metadata = {
  title: {
    absolute: "Salamat | JDC Mastermind: Duplication Season",
  },
  robots: { index: false, follow: false },
};

export default function DuplicationThankYouPage() {
  return <EliteThankYou offer="duplication" />;
}
