import type { Metadata } from "next";

import { EliteCheckoutPage } from "@/components/elite/elite-checkout-page";

export const metadata: Metadata = {
  title: {
    absolute: "Checkout | JDC Mastermind",
  },
  description: "Complete your JDC Mastermind enrollment through our secure checkout form.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ src?: string }>;
}) {
  const { src } = await searchParams;
  return <EliteCheckoutPage src={src} />;
}
