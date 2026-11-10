import { SupportTicketMetrics } from "@/lib/types";
import { supportStatusLabel } from "@/lib/support-labels";

export function SupportAnalytics({
  metrics,
  compact = false,
}: {
  metrics: SupportTicketMetrics;
  compact?: boolean;
}) {
  const cards = [
    { label: "Waiting", value: metrics.open, status: "open" as const },
    { label: "Awaiting reply", value: metrics.waitingForResponse, status: "waiting_for_response" as const },
    { label: "Resolved", value: metrics.resolved, status: "resolved" as const },
    { label: "Completed", value: metrics.completed, status: "completed" as const },
  ];

  if (compact) {
    return (
      <div className="support-metrics-strip" aria-label="Support ticket summary">
        {cards.map((card) => (
          <div key={card.label} className="support-metrics-chip">
            <span className={`support-status-dot is-${card.status.replace(/_/g, "-")}`} aria-hidden />
            <span className="support-metrics-chip-value">{card.value}</span>
            <span className="support-metrics-chip-label">{card.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="support-analytics-grid">
      {cards.map((card) => (
        <article key={card.label} className="dashboard-metric-card">
          <p className="macos-kicker">{card.label}</p>
          <p className="dashboard-metric-value">{card.value}</p>
          <p className="dashboard-metric-copy">{supportStatusLabel(card.status)}</p>
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
