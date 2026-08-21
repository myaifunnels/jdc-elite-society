import type { Metadata } from "next";

import { EliteThankYou } from "@/components/elite/elite-thank-you";

export const metadata: Metadata = {
  title: {
    absolute: "Salamat — JDC Mastermind",
  },
  robots: { index: false, follow: false },
};

export default function EliteThankYouPage() {
  return <EliteThankYou />;
}
