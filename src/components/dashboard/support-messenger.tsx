"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Paperclip, Plus, Search, Send, X } from "lucide-react";

import {
  createTicketAction,
  replyToTicketAction,
  SupportActionState,
  updateTicketStatusAction,
} from "@/app/dashboard/support/actions";
import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { SupportStatusPill } from "@/components/dashboard/support-analytics";
import { supportStatusLabel } from "@/lib/support-labels";
import { SupportTicket, SupportTicketMessage, SupportTicketStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const initialState: SupportActionState = {};

const categoryLabels: Record<SupportTicket["category"], string> = {
  general: "General",
  payment: "Payment",
  university: "University",
  account: "Account",
  other: "Other",
};

function formatShortTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return new Intl.DateTimeFormat("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Manila",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Manila",
  }).format(date);
}

function formatFullTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function displayName(ticket: SupportTicket, isAdmin: boolean) {
  return isAdmin ? ticket.userName : "Coach JDC Support";
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
      {!isOwn ? <ContactAvatar name={message.authorName} size="sm" /> : null}
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
          {formatShortTime(message.createdAt)}
        </time>
      </div>
      {isOwn ? <ContactAvatar name={message.authorName} size="sm" /> : null}
    </div>
  );
}

function TicketDetails({
  ticket,
  isAdmin,
  statusAction,
  statusPending,
}: {
  ticket: SupportTicket;
  isAdmin: boolean;
  statusAction: (payload: FormData) => void;
  statusPending: boolean;
}) {
  return (
    <aside className="support-details">
      <div className="support-details-profile">
        <ContactAvatar name={isAdmin ? ticket.userName : "Coach JDC Support"} size="lg" />
        <h3>{isAdmin ? ticket.userName : "Support Team"}</h3>
        <p>{isAdmin ? ticket.userEmail : ticket.subject}</p>
        <SupportStatusPill status={ticket.status} />
      </div>

      <dl className="support-details-meta">
        <div>
          <dt>Subject</dt>
          <dd>{ticket.subject}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>{categoryLabels[ticket.category]}</dd>
        </div>
        <div>
          <dt>Opened</dt>
          <dd>{formatFullTime(ticket.createdAt)}</dd>
        </div>
        <div>
          <dt>Last update</dt>
          <dd>{formatFullTime(ticket.updatedAt)}</dd>
        </div>
      </dl>

      {isAdmin ? (
        <form action={statusAction} className="support-details-status">
          <label htmlFor={`status-${ticket.id}`}>Ticket status</label>
          <select id={`status-${ticket.id}`} name="status" defaultValue={ticket.status}>
            {(["open", "waiting_for_response", "resolved", "completed"] as SupportTicketStatus[]).map(
              (status) => (
                <option key={status} value={status}>
                  {supportStatusLabel(status)}
                </option>
              ),
            )}
          </select>
          <input type="hidden" name="ticketId" value={ticket.id} />
          <button type="submit" className="support-btn-primary" disabled={statusPending}>
            Update status
          </button>
        </form>
      ) : null}
    </aside>
  );
}

function TicketThread({
  ticket,
  messages,
  currentUserId,
  isAdmin,
  onBack,
}: {
  ticket: SupportTicket;
  messages: SupportTicketMessage[];
  currentUserId: string;
  isAdmin: boolean;
  onBack?: () => void;
}) {
  const [replyState, replyAction, replyPending] = useActionState(replyToTicketAction, initialState);
  const [statusState, statusAction, statusPending] = useActionState(updateTicketStatusAction, initialState);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, replyState.success]);

  return (
    <>
      <div className="support-thread">
        <header className="support-thread-head">
          <div className="support-thread-head-main">
            {onBack ? (
              <button type="button" className="support-back-btn pressable" onClick={onBack}>
                ←
              </button>
            ) : null}
            <ContactAvatar name={displayName(ticket, isAdmin)} size="md" />
            <div>
              <h2>{isAdmin ? ticket.userName : ticket.subject}</h2>
              <p>
                {isAdmin ? ticket.userEmail : categoryLabels[ticket.category]}
                <span className="support-online-dot" aria-hidden />
                {ticket.status === "completed" ? "Closed" : "Active"}
              </p>
            </div>
          </div>
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
              rows={1}
              placeholder="Type your message…"
              aria-label="Your message"
              required
            />
            <button type="submit" className="support-send-btn pressable" disabled={replyPending}>
              <Send size={16} aria-hidden />
              Send
            </button>
          </form>
        ) : (
          <p className="support-closed-note">This conversation is completed. Start a new message if you need more help.</p>
        )}

        {replyState.error ? <p className="support-form-error">{replyState.error}</p> : null}
        {statusState.error ? <p className="support-form-error">{statusState.error}</p> : null}
      </div>

      <TicketDetails
        ticket={ticket}
        isAdmin={isAdmin}
        statusAction={statusAction}
        statusPending={statusPending}
      />
    </>
  );
}

function NewTicketModal({
  relatedOrderId,
  onClose,
}: {
  relatedOrderId?: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(createTicketAction, initialState);

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <div className="support-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="support-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-new-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="support-modal-head">
          <h2 id="support-new-title">New message</h2>
          <button type="button" className="support-modal-close pressable" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
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
            <textarea name="message" rows={5} placeholder="Describe your issue…" required />
          </label>
          <div className="support-modal-actions">
            <button type="button" className="support-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="support-btn-primary" disabled={pending}>
              Send message
            </button>
          </div>
          {state.error ? <p className="support-form-error">{state.error}</p> : null}
        </form>
      </div>
    </div>
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
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const activeTicket = tickets.find((ticket) => ticket.id === activeId);

  useEffect(() => {
    if (selectedTicketId) setActiveId(selectedTicketId);
  }, [selectedTicketId]);

  const filteredTickets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return tickets;
    return tickets.filter((ticket) => {
      const lastMessage = messagesByTicket[ticket.id]?.at(-1)?.body ?? "";
      return [ticket.subject, ticket.userName, ticket.userEmail, lastMessage]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [messagesByTicket, query, tickets]);

  return (
    <div className="support-messenger">
      <aside className={cn("support-inbox", activeId && "has-selection")}>
        <div className="support-inbox-head">
          <h2>Conversations</h2>
          <button type="button" className="support-new-btn pressable" onClick={() => setShowNew(true)}>
            <Plus size={15} aria-hidden />
            New
          </button>
        </div>

        <label className="support-search">
          <Search size={15} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations…"
            aria-label="Search conversations"
          />
        </label>

        <ul className="support-inbox-list">
          {filteredTickets.length === 0 ? (
            <li className="support-inbox-empty">
              {query ? "No conversations match your search." : "No conversations yet. Start a new message."}
            </li>
          ) : (
            filteredTickets.map((ticket) => {
              const lastMessage = messagesByTicket[ticket.id]?.at(-1);
              const unread = ticket.status === "open" || ticket.status === "waiting_for_response";
              return (
                <li key={ticket.id}>
                  <button
                    type="button"
                    className={cn("support-inbox-item pressable", activeId === ticket.id && "is-active")}
                    onClick={() => setActiveId(ticket.id)}
                  >
                    <ContactAvatar name={displayName(ticket, isAdmin)} size="md" />
                    <span className="support-inbox-copy">
                      <span className="support-inbox-row">
                        <strong>{isAdmin ? ticket.userName : ticket.subject}</strong>
                        <time dateTime={ticket.updatedAt}>{formatShortTime(ticket.updatedAt)}</time>
                      </span>
                      <span className="support-inbox-preview">
                        {lastMessage?.body.slice(0, 72) ?? "No messages yet"}
                      </span>
                      <span className="support-inbox-meta">
                        <SupportStatusPill status={ticket.status} />
                      </span>
                    </span>
                    {unread ? <span className="support-unread-dot" aria-label="Active conversation" /> : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </aside>

      <div className={cn("support-pane", !activeId && "is-empty")}>
        {activeTicket ? (
          <TicketThread
            ticket={activeTicket}
            messages={messagesByTicket[activeTicket.id] ?? []}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onBack={() => setActiveId("")}
          />
        ) : (
          <div className="support-empty-state">
            <MessageCircle size={52} strokeWidth={1.1} aria-hidden />
            <h3>Select a conversation</h3>
            <p>Choose a thread from the left or start a new message with our team.</p>
            <button type="button" className="support-btn-primary pressable" onClick={() => setShowNew(true)}>
              <Plus size={16} aria-hidden />
              New message
            </button>
          </div>
        )}
      </div>

      {showNew ? <NewTicketModal relatedOrderId={relatedOrderId} onClose={() => setShowNew(false)} /> : null}
    </div>
  );
}
