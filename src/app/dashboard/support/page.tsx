import { SupportAnalytics } from "@/components/dashboard/support-analytics";
import { SupportMessenger } from "@/components/dashboard/support-messenger";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { hasAccess } from "@/lib/access";
import {
  getSupportTicketMetrics,
  listAllSupportTickets,
  listSupportTicketMessages,
  listSupportTicketsForUser,
} from "@/lib/support-store";
import { requireCapability } from "@/lib/session";
import { SupportTicketMessage } from "@/lib/types";

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string; category?: string }>;
}) {
  const { user, access } = await requireCapability("support");
  const isAdmin = hasAccess(access, "support.admin");
  const params = await searchParams;

  const tickets = isAdmin ? await listAllSupportTickets() : await listSupportTicketsForUser(user.id);
  const metrics = await getSupportTicketMetrics(isAdmin ? undefined : user.id);

  const messagesByTicket: Record<string, SupportTicketMessage[]> = {};
  await Promise.all(
    tickets.map(async (ticket) => {
      messagesByTicket[ticket.id] = await listSupportTicketMessages(ticket.id);
    }),
  );

  return (
    <DashboardShell
      fill
      title="Support"
      description={
        isAdmin
          ? "Review and respond to customer support tickets."
          : "Message our team — we typically respond within 24 hours."
      }
    >
      <div className="support-workspace">
        <SupportAnalytics metrics={metrics} compact />
        <SupportMessenger
          tickets={tickets}
          messagesByTicket={messagesByTicket}
          currentUserId={user.id}
          isAdmin={isAdmin}
          selectedTicketId={params.ticket}
        />
      </div>
    </DashboardShell>
  );
}
