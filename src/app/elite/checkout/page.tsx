import type { Metadata } from "next";

import { EliteCheckoutPage } from "@/components/elite/elite-checkout-page";

export const metadata: Metadata = {
  title: {
    absolute: "Checkout | JDC Mastermind",
  },
  description: "Complete your JDC Mastermind payment and submit your receipt for verification.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <EliteCheckoutPage />;
}
