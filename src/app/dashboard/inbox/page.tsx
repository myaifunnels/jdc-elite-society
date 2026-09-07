import { CalendarDays, Mail, MessageSquareText } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { listCommunicationsForRecipients } from "@/lib/communication-log-store";
import { toE164Phone } from "@/lib/identity";
import { requireCapability } from "@/lib/session";

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function textPreview(html: string, max = 80) {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default async function InboxPage() {
  const { user } = await requireCapability("inbox");
  const recipients = [user.email, toE164Phone(user.phone || "")].filter(Boolean) as string[];
  const items = await listCommunicationsForRecipients(recipients, 100);

  return (
    <DashboardShell
      title="Inbox"
      description="Every email and text notification we've sent to your account, in one place."
    >
      {items.length === 0 ? (
        <div className="card-surface p-8 text-center text-[var(--muted)]">
          <p className="m-0">Nothing here yet — email and text notifications will show up as they arrive.</p>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {items.map((item) => (
            <details key={item.id} className="dashboard-disclosure inbox-item">
              <summary>
                <span className="inbox-item-summary">
                  <span className={item.channel === "email" ? "inbox-channel-pill is-email" : "inbox-channel-pill is-sms"}>
                    {item.channel === "email" ? <Mail size={12} aria-hidden /> : <MessageSquareText size={12} aria-hidden />}
                    {item.channel === "email" ? "Email" : "Text"}
                  </span>
                  <span className="inbox-item-subject">
                    {item.channel === "email" ? item.subject || "(no subject)" : textPreview(item.body, 70)}
                  </span>
                  <span className="inbox-item-date">
                    <CalendarDays size={12} aria-hidden />
                    {formatDateTime(item.createdAt)}
                  </span>
                </span>
              </summary>
              <div className="dashboard-disclosure-body">
                {item.channel === "email" ? (
                  <div className="inbox-email-body" dangerouslySetInnerHTML={{ __html: item.body }} />
                ) : (
                  <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed">{item.body}</p>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
