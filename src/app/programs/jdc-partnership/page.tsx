import type { Metadata } from "next";

import { PartnershipPage } from "@/components/programs/partnership-page";

export const metadata: Metadata = {
  title: "JDC Partnership Program",
  description: "Become a partner of Coach Jayson Dela Cruz. Watch the video and sign up.",
};

export default function JdcPartnershipPage() {
  return <PartnershipPage />;
}
