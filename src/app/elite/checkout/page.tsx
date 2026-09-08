import type { Metadata } from "next";

import { EliteCheckoutPage } from "@/components/elite/elite-checkout-page";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: {
    absolute: "Checkout | JDC Mastermind",
  },
  description: "Complete your JDC Mastermind payment and submit your receipt for verification.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const user = await getSessionUser();
  return (
    <EliteCheckoutPage
      signedInUser={user ? { name: user.name, email: user.email, phone: user.phone, phoneCountry: user.phoneCountry } : null}
    />
  );
}
