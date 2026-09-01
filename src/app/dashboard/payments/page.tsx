import {
  ApproveMastermindPaymentButton,
  DeletePaymentRecordButton,
  RejectMastermindPaymentButton,
} from "@/components/dashboard/approve-mastermind-payment-button";
import { DeactivateAccountButton } from "@/components/dashboard/deactivate-account-button";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MacosWindow } from "@/components/dashboard/macos-window";
import { formatPhp } from "@/data/mastermind-offer";
import { contactIdsByEmail } from "@/lib/crm-store";
import { listEliteCheckoutOrders, type EliteCheckoutOrder } from "@/lib/elite-checkout-store";
import { requireCapability } from "@/lib/session";

function submittedAt(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function categoryLabel(order: EliteCheckoutOrder) {
  if (order.coachingHours <= 0) return "Mastermind";
  const mode = order.coachingMode === "in-person" ? "In-person" : "Online";
  return `Mastermind + ${mode} Coaching · ${order.coachingHours} hr${order.coachingHours === 1 ? "" : "s"}`;
}

function PaymentRow({ order, contactId }: { order: EliteCheckoutOrder; contactId?: string }) {
  return (
    <article className="payment-row">
      <header className="payment-row-head">
        <div className="payment-row-who">
          <strong>{order.fullName}</strong>
          <span className="payment-row-tags">
            <span className="status-pill is-quiet">{categoryLabel(order)}</span>
            {order.status === "approved" ? <span className="status-pill is-verified">Approved</span> : null}
            {order.status === "rejected" ? <span className="status-pill is-rejected">Rejected</span> : null}
          </span>
        </div>
        <a className="macos-btn macos-btn-secondary" href={order.receiptUrl} target="_blank" rel="noreferrer">
          Receipt
        </a>
      </header>

      <p className="payment-row-contact">{order.email} · {order.mobile}</p>
      <p className="payment-row-detail">
        {order.paymentMethod} · {formatPhp(order.price)} · {submittedAt(order.createdAt)}
        {order.couponCode ? ` · Coupon ${order.couponCode}` : ""}
      </p>

      {order.status === "pending" ? (
        <p className="payment-row-note">Newly signed up · instant access already granted</p>
      ) : order.status === "rejected" ? (
        <p className="payment-row-note is-warn">University, courses, and group access are locked</p>
      ) : null}

      <div className="payment-row-actions">
        {contactId ? (
          <a href={`/dashboard/contacts/${contactId}`} className="macos-btn macos-btn-secondary">
            Open
          </a>
        ) : (
          <a href={`/dashboard/contacts/${encodeURIComponent(order.email)}`} className="macos-btn macos-btn-secondary">
            Open
          </a>
        )}
        {order.status === "pending" ? (
          <>
            <ApproveMastermindPaymentButton orderId={order.id} />
            <RejectMastermindPaymentButton orderId={order.id} />
            <DeactivateAccountButton userId={order.userId} name={order.fullName} />
          </>
        ) : order.status === "approved" ? (
          <RejectMastermindPaymentButton orderId={order.id} />
        ) : (
          <ApproveMastermindPaymentButton orderId={order.id} />
        )}
        <DeletePaymentRecordButton orderId={order.id} name={order.fullName} />
      </div>
    </article>
  );
}

export default async function PaymentsPage() {
  await requireCapability("registrations");
  const [orders, idsByEmail] = await Promise.all([listEliteCheckoutOrders(), contactIdsByEmail()]);
  const pending = orders.filter((order) => order.status === "pending");
  const approved = orders.filter((order) => order.status === "approved");
  const rejected = orders.filter((order) => order.status === "rejected");
  const approvedRevenue = approved.reduce((total, order) => total + order.price, 0);

  return (
    <DashboardShell
      title="Mastermind payments"
      description="Buyers get University at signup. Verify receipts here. Open a contact dashboard from any row, or delete a test/random submission to remove the payment, contact, and login."
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

        <MacosWindow title={`Pending verification · ${pending.length}`} className="dashboard-span-2" bodyClassName="payment-row-list">
          {pending.length ? pending.map((order) => <PaymentRow key={order.id} order={order} contactId={idsByEmail.get(order.email.toLowerCase())} />) : (
            <p className="macos-lead" style={{ textAlign: "left" }}>No Mastermind payments are waiting for review.</p>
          )}
        </MacosWindow>

        <details className="dashboard-disclosure dashboard-span-2">
          <summary>Approval history · {approved.length}</summary>
          <div className="dashboard-disclosure-body payment-row-list">
            {approved.length ? approved.map((order) => <PaymentRow key={order.id} order={order} contactId={idsByEmail.get(order.email.toLowerCase())} />) : (
              <p className="macos-lead" style={{ textAlign: "left" }}>Approved payments will appear here.</p>
            )}
          </div>
        </details>

        <details className="dashboard-disclosure dashboard-span-2">
          <summary>Rejected · {rejected.length}</summary>
          <div className="dashboard-disclosure-body payment-row-list">
            {rejected.length ? rejected.map((order) => <PaymentRow key={order.id} order={order} contactId={idsByEmail.get(order.email.toLowerCase())} />) : (
              <p className="macos-lead" style={{ textAlign: "left" }}>Rejected payments will appear here.</p>
            )}
          </div>
        </details>
      </div>
    </DashboardShell>
  );
}
