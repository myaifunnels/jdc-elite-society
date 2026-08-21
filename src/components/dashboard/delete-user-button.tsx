"use client";

import { useActionState } from "react";

import { deleteUserAction, type DeleteUserState } from "@/app/dashboard/access/actions";

const initialState: DeleteUserState = {};

export function DeleteUserButton({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const [state, formAction, pending] = useActionState(deleteUserAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Delete ${name}? Their login is removed and they drop off the contact map. This cannot be undone.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <button type="submit" className="macos-btn macos-btn-danger" disabled={pending}>
        {pending ? "Deleting…" : "Delete"}
      </button>
      {state.error ? <p className="auth-error">{state.error}</p> : null}
    </form>
  );
}
