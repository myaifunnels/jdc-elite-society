"use client";

import { useActionState } from "react";

import { deleteUserAction, type DeleteUserState } from "@/app/dashboard/access/actions";

const initialState: DeleteUserState = {};

export function DeleteUserButton({
  userId = "",
  email = "",
  name,
  redirectTo = "/dashboard/contacts",
  label = "Delete user",
}: {
  userId?: string;
  email?: string;
  name: string;
  redirectTo?: string;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState(deleteUserAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Delete ${name}? Their login is removed and they drop off Contacts and the map. This cannot be undone.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button type="submit" className="macos-btn macos-btn-danger" disabled={pending}>
        {pending ? "Deleting…" : label}
      </button>
      {state.error ? <p className="auth-error">{state.error}</p> : null}
    </form>
  );
}
