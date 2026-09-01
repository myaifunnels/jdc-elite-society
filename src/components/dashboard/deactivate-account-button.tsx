"use client";

import { useActionState } from "react";

import {
  deactivateUserAction,
  reactivateUserAction,
  type DeactivateUserState,
} from "@/app/dashboard/access/actions";

const initialState: DeactivateUserState = {};

export function DeactivateAccountButton({
  userId,
  name,
  compact = false,
}: {
  userId: string;
  name: string;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(deactivateUserAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Deactivate ${name}? They immediately lose dashboard and course access. This is reversible — you can reactivate them later.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <button type="submit" className="macos-btn macos-btn-danger" disabled={pending}>
        {pending ? "…" : compact ? "Deactivate" : "Deactivate account"}
      </button>
      {state.error ? <p className="auth-error">{state.error}</p> : null}
      {state.success ? <p className="auth-success">{state.success}</p> : null}
    </form>
  );
}

export function ReactivateAccountButton({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(reactivateUserAction, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={userId} />
      <button type="submit" className="macos-btn macos-btn-secondary" disabled={pending}>
        {pending ? "Reactivating..." : "Reactivate account"}
      </button>
      {state.error ? <p className="auth-error">{state.error}</p> : null}
      {state.success ? <p className="auth-success">{state.success}</p> : null}
    </form>
  );
}
