import type { Metadata } from "next";

import { EliteCoachingUpsell } from "@/components/elite/elite-coaching-upsell";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Exclusive Offer: 1-on-1 Coaching",
  description: "Add Online or Face-to-Face private coaching with Coach Jayson Dela Cruz.",
  robots: { index: false, follow: false },
};

export default async function EliteCoachingOfferPage() {
  const user = await requireSessionUser();

  return <EliteCoachingUpsell firstName={user.name.split(" ")[0] || "there"} />;
}
