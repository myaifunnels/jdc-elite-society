import { PaymentRejectedNotice } from "@/components/dashboard/payment-rejected-notice";
import { UniversityCommunityEmbed } from "@/components/dashboard/university-community-embed";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { hasAccess } from "@/lib/access";
import { resolveAccess } from "@/lib/access-store";
import { listEliteCheckoutOrdersForUser } from "@/lib/elite-checkout-store";
import { requireCapability } from "@/lib/session";
import { hasUniversityAccess } from "@/lib/university-access";

export default async function UniversityPage() {
  const { user } = await requireCapability("university");
  const access = await resolveAccess(user);
  const unlocked = hasUniversityAccess(user);
  const verifyHref = hasAccess(access, "dashboard") ? "/dashboard" : "/dashboard/university";

  const checkoutOrders = await listEliteCheckoutOrdersForUser(user.id);
  const rejectedOrder = checkoutOrders.find((order) => order.status === "rejected");

  if (rejectedOrder) {
    return (
      <DashboardShell
        fill
        title="University"
        description="Payment verification required before University access is restored."
      >
        <PaymentRejectedNotice order={rejectedOrder} />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      fill
      title="University"
      description={
        unlocked
          ? "The JDC Elite Society community plus Mastermind Sessions 1 and 2."
          : "University is locked because payment was not verified."
      }
    >
      <UniversityCommunityEmbed unlocked={unlocked} verifyHref={verifyHref} />
    </DashboardShell>
  );
}
