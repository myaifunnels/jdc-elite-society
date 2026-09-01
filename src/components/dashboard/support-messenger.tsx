"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { MessageCircle, Paperclip, Plus, Send } from "lucide-react";

import {
  createTicketAction,
  replyToTicketAction,
  SupportActionState,
  updateTicketStatusAction,
} from "@/app/dashboard/support/actions";
import { SupportStatusPill } from "@/components/dashboard/support-analytics";
import { supportStatusLabel } from "@/lib/support-store";
import { SupportTicket, SupportTicketMessage, SupportTicketStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const initialState: SupportActionState = {};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: SupportTicketMessage;
  isOwn: boolean;
}) {
  return (
    <div className={cn("support-bubble-row", isOwn && "is-own")}>
      <div className={cn("support-bubble", isOwn ? "is-sent" : "is-received")}>
        {!isOwn ? <p className="support-bubble-author">{message.authorName}</p> : null}
        <p className="support-bubble-body">{message.body}</p>
        {message.attachmentUrl ? (
          <a
            href={message.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="support-bubble-attachment"
          >
            <Paperclip size={13} aria-hidden />
            View attachment
          </a>
        ) : null}
        <time className="support-bubble-time" dateTime={message.createdAt}>
          {formatTime(message.createdAt)}
        </time>
      </div>
    </div>
  );
}

function TicketThread({
  ticket,
  messages,
  currentUserId,
  isAdmin,
}: {
  ticket: SupportTicket;
  messages: SupportTicketMessage[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [replyState, replyAction, replyPending] = useActionState(replyToTicketAction, initialState);
  const [statusState, statusAction, statusPending] = useActionState(updateTicketStatusAction, initialState);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, replyState.success]);

  return (
    <div className="support-thread">
      <header className="support-thread-head">
        <div>
          <h2>{ticket.subject}</h2>
          <p>
            {isAdmin ? `${ticket.userName} · ${ticket.userEmail}` : ticket.category}
            {" · "}
            <SupportStatusPill status={ticket.status} />
          </p>
        </div>
        {isAdmin ? (
          <form action={statusAction} className="support-status-form">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <select name="status" defaultValue={ticket.status} aria-label="Ticket status">
              {(["open", "waiting_for_response", "resolved", "completed"] as SupportTicketStatus[]).map(
                (status) => (
                  <option key={status} value={status}>
                    {supportStatusLabel(status)}
                  </option>
                ),
              )}
            </select>
            <button type="submit" className="macos-btn macos-btn-secondary" disabled={statusPending}>
              Update
            </button>
          </form>
        ) : null}
      </header>

      <div className="support-messages" ref={scrollRef}>
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.authorId === currentUserId}
          />
        ))}
      </div>

      {ticket.status !== "completed" ? (
        <form action={replyAction} className="support-compose">
          <input type="hidden" name="ticketId" value={ticket.id} />
          <textarea
            name="message"
            rows={2}
            placeholder="iMessage"
            aria-label="Your message"
            required
          />
          <button type="submit" className="support-send-btn pressable" disabled={replyPending} aria-label="Send">
            <Send size={18} />
          </button>
        </form>
      ) : (
        <p className="support-closed-note">This ticket is completed. Open a new ticket if you need more help.</p>
      )}

      {replyState.error ? <p className="support-form-error">{replyState.error}</p> : null}
      {statusState.error ? <p className="support-form-error">{statusState.error}</p> : null}
    </div>
  );
}

function NewTicketForm({ relatedOrderId }: { relatedOrderId?: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createTicketAction, initialState);

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  if (!open) {
    return (
      <button type="button" className="support-new-btn pressable" onClick={() => setOpen(true)}>
        <Plus size={16} aria-hidden />
        New message
      </button>
    );
  }

  return (
    <form action={action} className="support-new-form">
      <input type="hidden" name="relatedOrderId" value={relatedOrderId ?? ""} />
      <label>
        Subject
        <input name="subject" type="text" placeholder="What do you need help with?" required />
      </label>
      <label>
        Category
        <select name="category" defaultValue={relatedOrderId ? "payment" : "general"}>
          <option value="general">General</option>
          <option value="payment">Payment</option>
          <option value="university">University</option>
          <option value="account">Account</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label>
        Message
        <textarea name="message" rows={4} placeholder="Describe your issue..." required />
      </label>
      <div className="macos-actions">
        <button type="button" className="macos-btn macos-btn-secondary" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="submit" className="macos-btn macos-btn-primary" disabled={pending}>
          Send
        </button>
      </div>
      {state.error ? <p className="support-form-error">{state.error}</p> : null}
    </form>
  );
}

export function SupportMessenger({
  tickets,
  messagesByTicket,
  currentUserId,
  isAdmin,
  selectedTicketId,
  relatedOrderId,
}: {
  tickets: SupportTicket[];
  messagesByTicket: Record<string, SupportTicketMessage[]>;
  currentUserId: string;
  isAdmin: boolean;
  selectedTicketId?: string;
  relatedOrderId?: string;
}) {
  const [activeId, setActiveId] = useState(selectedTicketId ?? tickets[0]?.id ?? "");
  const activeTicket = tickets.find((ticket) => ticket.id === activeId);

  useEffect(() => {
    if (selectedTicketId) setActiveId(selectedTicketId);
  }, [selectedTicketId]);

  return (
    <div className="support-messenger">
      <aside className={cn("support-inbox", activeId && "has-selection")}>
        <div className="support-inbox-head">
          <MessageCircle size={18} aria-hidden />
          <span>Messages</span>
          <NewTicketForm relatedOrderId={relatedOrderId} />
        </div>
        <ul className="support-inbox-list">
          {tickets.length === 0 ? (
            <li className="support-inbox-empty">No conversations yet. Start a new message.</li>
          ) : (
            tickets.map((ticket) => {
              const lastMessage = messagesByTicket[ticket.id]?.at(-1);
              return (
                <li key={ticket.id}>
                  <button
                    type="button"
                    className={cn("support-inbox-item pressable", activeId === ticket.id && "is-active")}
                    onClick={() => setActiveId(ticket.id)}
                  >
                    <span className="support-inbox-subject">{ticket.subject}</span>
                    <span className="support-inbox-preview">
                      {lastMessage?.body.slice(0, 60) ?? "No messages"}
                    </span>
                    <span className="support-inbox-meta">
                      <SupportStatusPill status={ticket.status} />
                      <time dateTime={ticket.updatedAt}>{formatTime(ticket.updatedAt)}</time>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </aside>

      <div className={cn("support-pane", !activeId && "is-empty")}>
        {activeTicket ? (
          <>
            <button
              type="button"
              className="support-back-btn pressable lg:hidden"
              onClick={() => setActiveId("")}
            >
              ← Back
            </button>
            <TicketThread
              ticket={activeTicket}
              messages={messagesByTicket[activeTicket.id] ?? []}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          </>
        ) : (
          <div className="support-empty-state">
            <MessageCircle size={48} strokeWidth={1.2} aria-hidden />
            <p>Select a conversation or start a new message.</p>
          </div>
        )}
      </div>
    </div>
  );
}
