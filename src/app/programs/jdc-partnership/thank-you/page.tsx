import type { Metadata } from "next";

import { PartnershipThankYou } from "@/components/programs/partnership-page";

export const metadata: Metadata = {
  title: "Welcome, Partner — JDC Partnership Program",
  robots: { index: false, follow: false },
};

export default function JdcPartnershipThankYouPage() {
  return <PartnershipThankYou />;
}
