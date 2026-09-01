import { SupportTicketMetrics } from "@/lib/types";
import { supportStatusLabel } from "@/lib/support-store";

export function SupportAnalytics({ metrics }: { metrics: SupportTicketMetrics }) {
  const cards = [
    { label: "Waiting for response", value: metrics.open, detail: "New tickets awaiting team reply" },
    { label: "Awaiting reply", value: metrics.waitingForResponse, detail: "Team replied — waiting on customer" },
    { label: "Resolved", value: metrics.resolved, detail: "Issue resolved, pending closure" },
    { label: "Completed", value: metrics.completed, detail: "Closed tickets" },
  ];

  return (
    <div className="support-analytics-grid">
      {cards.map((card) => (
        <article key={card.label} className="dashboard-metric-card">
          <p className="macos-kicker">{card.label}</p>
          <p className="dashboard-metric-value">{card.value}</p>
          <p className="dashboard-metric-copy">{card.detail}</p>
        </article>
      ))}
    </div>
  );
}

export function SupportStatusPill({ status }: { status: Parameters<typeof supportStatusLabel>[0] }) {
  return (
    <span className={`support-status-pill is-${status.replace(/_/g, "-")}`}>
      {supportStatusLabel(status)}
    </span>
  );
}
