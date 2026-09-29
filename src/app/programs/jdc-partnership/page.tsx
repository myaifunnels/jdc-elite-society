import type { Metadata } from "next";

import { PartnershipPage } from "@/components/programs/partnership-page";

const socialImage = "https://assets.cdn.filesafe.space/Col3j2B7jRDX5y8J5bgN/media/6abb5ba0b5e520ac174ffd19.png";

export const metadata: Metadata = {
  title: "JDC Partnership Program",
  description: "Become a partner of Coach Jayson Dela Cruz. Watch the video and sign up.",
  alternates: { canonical: "/programs/jdc-partnership" },
  openGraph: {
    title: "JDC Partnership Program",
    description: "Become a partner of Coach Jayson Dela Cruz. Watch the video and sign up.",
    url: "/programs/jdc-partnership",
    type: "website",
    images: [{ url: socialImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "JDC Partnership Program",
    description: "Become a partner of Coach Jayson Dela Cruz. Watch the video and sign up.",
    images: [socialImage],
  },
};

export default function JdcPartnershipPage() {
  return <PartnershipPage />;
}
