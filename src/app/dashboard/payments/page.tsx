import { ApproveMastermindPaymentButton } from "@/components/dashboard/approve-mastermind-payment-button";
import { DeactivateAccountButton } from "@/components/dashboard/deactivate-account-button";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { formatPhp } from "@/data/mastermind-offer";
import { listEliteCheckoutOrders, type EliteCheckoutOrder } from "@/lib/elite-checkout-store";
import { requireCapability } from "@/lib/session";

function submittedAt(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function PaymentRow({ order }: { order: EliteCheckoutOrder }) {
  return (
    <article className="registration-row payment-row">
      <div className="payment-row-main">
        <strong>{order.fullName}</strong>
        <em>{order.email} · {order.mobile}</em>
        <p>{order.paymentMethod} · {formatPhp(order.price)} · {submittedAt(order.createdAt)}</p>
        <p>
          Category: {order.coachingHours > 0 ? `Mastermind + ${order.coachingMode === "in-person" ? "In-person" : "Online"} Coaching` : "Mastermind only"}
          {order.coachingHours > 0 ? ` · ${order.coachingHours} coaching hour${order.coachingHours === 1 ? "" : "s"}` : ""}
        </p>
        {order.couponCode ? <p>Coupon: {order.couponCode}</p> : null}
      </div>
      <span className="status-pill">
        {order.coachingHours > 0
          ? order.coachingMode === "in-person" ? "In-person coaching" : "Online coaching"
          : "Mastermind"}
      </span>
      <a className="macos-btn macos-btn-secondary" href={order.receiptUrl} target="_blank" rel="noreferrer">
        View receipt
      </a>
      {order.status === "pending" ? (
        <>
          <p className="dashboard-metric-copy" style={{ margin: 0 }}>
            Newly signed up · instant access already granted
          </p>
          <ApproveMastermindPaymentButton orderId={order.id} />
          <DeactivateAccountButton userId={order.userId} name={order.fullName} />
        </>
      ) : (
        <span className="status-pill is-verified">Approved</span>
      )}
    </article>
  );
}

export default async function PaymentsPage() {
  await requireCapability("registrations");
  const orders = await listEliteCheckoutOrders();
  const pending = orders.filter((order) => order.status === "pending");
  const approved = orders.filter((order) => order.status === "approved");
  const approvedRevenue = approved.reduce((total, order) => total + order.price, 0);

  return (
    <DashboardShell
      title="Mastermind payments"
      description="Buyers get instant access at checkout. Use this queue to verify receipts after the fact, and deactivate any account whose receipt turns out to be fraudulent."
    >
      <div className="dashboard-widget-grid">
        <article className="dashboard-metric-card">
          <p className="macos-kicker">Awaiting review</p>
          <p className="dashboard-metric-value">{pending.length}</p>
          <p className="dashboard-metric-copy">Payment submissions that still need verification.</p>
        </article>
        <article className="dashboard-metric-card">
          <p className="macos-kicker">Approved</p>
          <p className="dashboard-metric-value">{approved.length}</p>
          <p className="dashboard-metric-copy">Mastermind checkouts approved by the team.</p>
        </article>
        <article className="dashboard-metric-card">
          <p className="macos-kicker">Approved value</p>
          <p className="dashboard-metric-value">{formatPhp(approvedRevenue)}</p>
          <p className="dashboard-metric-copy">Recorded value of approved checkout submissions.</p>
        </article>

        <MacosWindow title={`Pending verification · ${pending.length}`} className="dashboard-span-2">
          {pending.length ? pending.map((order) => <PaymentRow key={order.id} order={order} />) : (
            <p className="macos-lead" style={{ textAlign: "left" }}>No Mastermind payments are waiting for review.</p>
          )}
        </MacosWindow>

        <details className="dashboard-disclosure dashboard-span-2">
          <summary>Approval history · {approved.length}</summary>
          <div className="dashboard-disclosure-body">
            {approved.length ? approved.map((order) => <PaymentRow key={order.id} order={order} />) : (
              <p className="macos-lead" style={{ textAlign: "left" }}>Approved payments will appear here.</p>
            )}
          </div>
        </details>
      </div>
    </DashboardShell>
  );
}
