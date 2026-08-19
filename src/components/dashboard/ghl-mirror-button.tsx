"use client";

import { useActionState } from "react";

import { IntegrationFormState, mirrorGhlContactsNow } from "@/app/dashboard/integrations/actions";

const initialState: IntegrationFormState = {};

export function GhlMirrorButton({
  label = "Mirror contacts now",
}: {
  label?: string;
}) {
  const [state, formAction, pending] = useActionState(mirrorGhlContactsNow, initialState);

  return (
    <form action={formAction} className="grid gap-2">
      <button
        type="submit"
        disabled={pending}
        className="macos-btn macos-btn-secondary pressable w-fit disabled:opacity-70"
      >
        {pending ? "Mirroring..." : label}
      </button>
      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}
    </form>
  );
}
