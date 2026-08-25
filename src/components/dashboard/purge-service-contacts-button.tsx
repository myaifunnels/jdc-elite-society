"use client";

import { useActionState } from "react";

import {
  purgeServiceContactsAction,
  type PurgeServiceContactsState,
} from "@/app/dashboard/contacts/actions";

const initialState: PurgeServiceContactsState = {};

export function PurgeServiceContactsButton() {
  const [state, formAction, pending] = useActionState(purgeServiceContactsAction, initialState);

  return (
    <form
      action={formAction}
      className="purge-service-contacts-form"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Remove company/service contacts (Zoom, Calendly, noreply@, etc.) from the list? Future syncs will also skip them automatically.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className="macos-btn macos-btn-secondary" disabled={pending}>
        {pending ? "Cleaning up..." : "Remove company emails"}
      </button>
      {state.error ? <p className="auth-error">{state.error}</p> : null}
      {state.success ? <p className="auth-success">{state.success}</p> : null}
    </form>
  );
}
