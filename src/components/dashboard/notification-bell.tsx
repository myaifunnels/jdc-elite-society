"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/dashboard/notifications/actions";
import type { AppNotification } from "@/lib/notification-store";
import { cn } from "@/lib/utils";

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

export function NotificationBell({ items }: { items: AppNotification[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const unread = items.filter((item) => !item.readAt).length;

  function openItem(item: AppNotification) {
    startTransition(async () => {
      const data = new FormData();
      data.set("id", item.id);
      await markNotificationReadAction(data);
      setOpen(false);
      if (item.href) {
        router.push(item.href);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="notification-bell">
      <button
        type="button"
        className="glass-icon-btn pressable inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full"
        aria-expanded={open}
        aria-label={unread ? `${unread} unread notifications` : "Notifications"}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={16} aria-hidden />
        {unread ? <span className="notification-badge">{unread > 9 ? "9+" : unread}</span> : null}
      </button>
      {open ? (
        <>
          <button type="button" className="notification-scrim" aria-label="Close notifications" onClick={() => setOpen(false)} />
          <div className="notification-panel">
            <header>
              <strong>Notifications</strong>
              {unread ? (
                <button
                  type="button"
                  className="auth-forgot"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await markAllNotificationsReadAction();
                      router.refresh();
                    })
                  }
                >
                  Mark all read
                </button>
              ) : null}
            </header>
            {items.length === 0 ? (
              <p className="notification-empty">No activity yet. Purchases, support, and account alerts show up here.</p>
            ) : (
              <ul>
                {items.map((item) => (
                  <li key={item.id}>
                    <button type="button" className={cn(!item.readAt && "is-unread")} onClick={() => openItem(item)}>
                      <strong>{item.title}</strong>
                      {item.body ? <span>{item.body}</span> : null}
                      <em>{timeLabel(item.createdAt)}</em>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/dashboard/support" className="notification-footer" onClick={() => setOpen(false)}>
              Open Support
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
