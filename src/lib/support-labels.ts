import { SupportTicketStatus } from "@/lib/types";

export function supportStatusLabel(status: SupportTicketStatus) {
  switch (status) {
    case "open":
      return "Waiting for response";
    case "waiting_for_response":
      return "Awaiting your reply";
    case "resolved":
      return "Resolved";
    case "completed":
      return "Completed";
  }
}
