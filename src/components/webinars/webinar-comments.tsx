"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";

import { postWebinarCommentAction, type CommentFormState } from "@/app/webinars/[id]/replay/actions";
import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import type { WebinarComment } from "@/lib/webinar-comments-store";

const initialState: CommentFormState = {};

function formatCommentDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function WebinarCommentForm({
  webinarId,
  currentUser,
}: {
  webinarId: string;
  currentUser: { name: string; photoUrl?: string } | null;
}) {
  const action = postWebinarCommentAction.bind(null, webinarId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  if (!currentUser) {
    return (
      <div className="webinar-comment-signin">
        <p className="m-0 text-sm font-semibold text-[var(--muted)]">
          <Link href="/login" className="font-extrabold text-[var(--brand)]">
            Sign in
          </Link>{" "}
          to join the discussion.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="webinar-comment-form">
      <ContactAvatar name={currentUser.name} photoUrl={currentUser.photoUrl} size="sm" />
      <div className="webinar-comment-form-body">
        <textarea
          name="body"
          rows={2}
          maxLength={2000}
          placeholder="Share your thoughts on this episode..."
          required
          className="webinar-comment-input"
        />
        <div className="flex items-center justify-between gap-3">
          {state.error ? <p className="m-0 text-xs font-semibold text-red-400">{state.error}</p> : <span />}
          <button type="submit" disabled={pending} className="button-primary pressable px-4 py-2 text-sm font-extrabold disabled:opacity-60">
            {pending ? "Posting..." : "Post comment"}
          </button>
        </div>
      </div>
    </form>
  );
}

export function WebinarCommentList({ comments }: { comments: WebinarComment[] }) {
  if (comments.length === 0) {
    return <p className="m-0 text-sm text-[var(--muted)]">Be the first to comment on this episode.</p>;
  }

  return (
    <ul className="webinar-comment-list">
      {comments.map((comment) => (
        <li key={comment.id} className="webinar-comment-row">
          <ContactAvatar name={comment.name} photoUrl={comment.photoUrl} size="sm" />
          <div className="min-w-0">
            <p className="m-0 flex flex-wrap items-baseline gap-2">
              <strong className="text-sm font-extrabold">{comment.name}</strong>
              <span className="text-xs font-semibold text-[var(--muted)]">{formatCommentDate(comment.createdAt)}</span>
            </p>
            <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">{comment.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
