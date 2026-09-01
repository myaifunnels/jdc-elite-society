import { Pool } from "pg";

import {
  SupportTicket,
  SupportTicketCategory,
  SupportTicketMessage,
  SupportTicketMetrics,
  SupportTicketStatus,
} from "@/lib/types";
import { supportStatusLabel } from "@/lib/support-labels";

export { supportStatusLabel };

const memoryTickets: SupportTicket[] = [];
const memoryMessages: SupportTicketMessage[] = [];
let pool: Pool | null | undefined;
let tableReady = false;

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  if (pool === undefined) {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function ensureTable(client: Pool) {
  if (tableReady) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      status TEXT NOT NULL DEFAULT 'open',
      related_order_id TEXT NOT NULL DEFAULT '',
      assigned_to TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS support_ticket_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_role TEXT NOT NULL DEFAULT 'member',
      body TEXT NOT NULL,
      attachment_url TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS support_tickets_status_updated_idx
    ON support_tickets (status, updated_at DESC)
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx
    ON support_tickets (user_id, updated_at DESC)
  `);
  tableReady = true;
}

function parseStatus(value: unknown): SupportTicketStatus {
  if (value === "waiting_for_response" || value === "resolved" || value === "completed") {
    return value;
  }
  return "open";
}

function parseCategory(value: unknown): SupportTicketCategory {
  if (value === "payment" || value === "university" || value === "account" || value === "other") {
    return value;
  }
  return "general";
}

function mapTicket(row: Record<string, unknown>): SupportTicket {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    userName: String(row.user_name),
    userEmail: String(row.user_email).toLowerCase(),
    subject: String(row.subject),
    category: parseCategory(row.category),
    status: parseStatus(row.status),
    relatedOrderId: String(row.related_order_id ?? ""),
    assignedTo: String(row.assigned_to ?? ""),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapMessage(row: Record<string, unknown>): SupportTicketMessage {
  return {
    id: String(row.id),
    ticketId: String(row.ticket_id),
    authorId: String(row.author_id),
    authorName: String(row.author_name),
    authorRole: String(row.author_role) as SupportTicketMessage["authorRole"],
    body: String(row.body),
    attachmentUrl: String(row.attachment_url ?? ""),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function createSupportTicket(input: {
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category?: SupportTicketCategory;
  relatedOrderId?: string;
  initialMessage: string;
  attachmentUrl?: string;
}) {
  const now = new Date().toISOString();
  const ticket: SupportTicket = {
    id: `ticket-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    userName: input.userName,
    userEmail: input.userEmail.toLowerCase(),
    subject: input.subject.trim(),
    category: input.category ?? "general",
    status: "open",
    relatedOrderId: input.relatedOrderId ?? "",
    assignedTo: "",
    createdAt: now,
    updatedAt: now,
  };
  const message: SupportTicketMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ticketId: ticket.id,
    authorId: input.userId,
    authorName: input.userName,
    authorRole: "member",
    body: input.initialMessage.trim(),
    attachmentUrl: input.attachmentUrl ?? "",
    createdAt: now,
  };

  memoryTickets.unshift(ticket);
  memoryMessages.push(message);

  const client = getPool();
  if (client) {
    await ensureTable(client);
    await client.query("BEGIN");
    try {
      await client.query(
        `
        INSERT INTO support_tickets (
          id, user_id, user_name, user_email, subject, category, status,
          related_order_id, assigned_to, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
        [
          ticket.id,
          ticket.userId,
          ticket.userName,
          ticket.userEmail,
          ticket.subject,
          ticket.category,
          ticket.status,
          ticket.relatedOrderId,
          ticket.assignedTo,
          ticket.createdAt,
          ticket.updatedAt,
        ],
      );
      await client.query(
        `
        INSERT INTO support_ticket_messages (
          id, ticket_id, author_id, author_name, author_role, body, attachment_url, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          message.id,
          message.ticketId,
          message.authorId,
          message.authorName,
          message.authorRole,
          message.body,
          message.attachmentUrl,
          message.createdAt,
        ],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      memoryTickets.shift();
      memoryMessages.pop();
      console.error("Failed to create support ticket", error);
      throw new Error("I couldn't create your support ticket. Please try again.");
    }
  }

  return { ticket, message };
}

export async function listSupportTicketsForUser(userId: string) {
  const client = getPool();
  if (!client) {
    return memoryTickets.filter((ticket) => ticket.userId === userId).sort(sortByUpdated);
  }

  await ensureTable(client);
  const result = await client.query(
    "SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY updated_at DESC",
    [userId],
  );
  return result.rows.map(mapTicket);
}

export async function listAllSupportTickets() {
  const client = getPool();
  if (!client) return [...memoryTickets].sort(sortByUpdated);

  await ensureTable(client);
  const result = await client.query("SELECT * FROM support_tickets ORDER BY updated_at DESC");
  return result.rows.map(mapTicket);
}

export async function getSupportTicket(ticketId: string) {
  const client = getPool();
  if (!client) return memoryTickets.find((ticket) => ticket.id === ticketId) ?? null;

  await ensureTable(client);
  const result = await client.query("SELECT * FROM support_tickets WHERE id = $1 LIMIT 1", [ticketId]);
  return result.rows[0] ? mapTicket(result.rows[0]) : null;
}

export async function listSupportTicketMessages(ticketId: string) {
  const client = getPool();
  if (!client) {
    return memoryMessages
      .filter((message) => message.ticketId === ticketId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  await ensureTable(client);
  const result = await client.query(
    "SELECT * FROM support_ticket_messages WHERE ticket_id = $1 ORDER BY created_at ASC",
    [ticketId],
  );
  return result.rows.map(mapMessage);
}

export async function addSupportTicketMessage(input: {
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: SupportTicketMessage["authorRole"];
  body: string;
  attachmentUrl?: string;
  newStatus?: SupportTicketStatus;
}) {
  const now = new Date().toISOString();
  const message: SupportTicketMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ticketId: input.ticketId,
    authorId: input.authorId,
    authorName: input.authorName,
    authorRole: input.authorRole,
    body: input.body.trim(),
    attachmentUrl: input.attachmentUrl ?? "",
    createdAt: now,
  };

  const ticketIndex = memoryTickets.findIndex((ticket) => ticket.id === input.ticketId);
  if (ticketIndex >= 0) {
    memoryTickets[ticketIndex] = {
      ...memoryTickets[ticketIndex],
      updatedAt: now,
      status: input.newStatus ?? memoryTickets[ticketIndex].status,
    };
  }
  memoryMessages.push(message);

  const client = getPool();
  if (client) {
    await ensureTable(client);
    await client.query("BEGIN");
    try {
      await client.query(
        `
        INSERT INTO support_ticket_messages (
          id, ticket_id, author_id, author_name, author_role, body, attachment_url, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          message.id,
          message.ticketId,
          message.authorId,
          message.authorName,
          message.authorRole,
          message.body,
          message.attachmentUrl,
          message.createdAt,
        ],
      );
      if (input.newStatus) {
        await client.query(
          "UPDATE support_tickets SET status = $2, updated_at = $3 WHERE id = $1",
          [input.ticketId, input.newStatus, now],
        );
      } else {
        await client.query("UPDATE support_tickets SET updated_at = $2 WHERE id = $1", [input.ticketId, now]);
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      memoryMessages.pop();
      console.error("Failed to add support message", error);
      throw new Error("I couldn't send your message. Please try again.");
    }
  }

  return message;
}

export async function updateSupportTicketStatus(ticketId: string, status: SupportTicketStatus) {
  const now = new Date().toISOString();
  const ticketIndex = memoryTickets.findIndex((ticket) => ticket.id === ticketId);
  if (ticketIndex >= 0) {
    memoryTickets[ticketIndex] = { ...memoryTickets[ticketIndex], status, updatedAt: now };
  }

  const client = getPool();
  if (client) {
    await ensureTable(client);
    const result = await client.query(
      "UPDATE support_tickets SET status = $2, updated_at = $3 WHERE id = $1 RETURNING *",
      [ticketId, status, now],
    );
    if (!result.rows[0]) throw new Error("Support ticket not found.");
    return mapTicket(result.rows[0]);
  }

  if (ticketIndex < 0) throw new Error("Support ticket not found.");
  return memoryTickets[ticketIndex];
}

export async function getSupportTicketMetrics(userId?: string): Promise<SupportTicketMetrics> {
  const tickets = userId
    ? await listSupportTicketsForUser(userId)
    : await listAllSupportTickets();

  return {
    open: tickets.filter((ticket) => ticket.status === "open").length,
    waitingForResponse: tickets.filter((ticket) => ticket.status === "waiting_for_response").length,
    resolved: tickets.filter((ticket) => ticket.status === "resolved").length,
    completed: tickets.filter((ticket) => ticket.status === "completed").length,
    total: tickets.length,
  };
}

function sortByUpdated(a: SupportTicket, b: SupportTicket) {
  return b.updatedAt.localeCompare(a.updatedAt);
}
