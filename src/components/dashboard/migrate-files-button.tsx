"use client";

import { useActionState } from "react";

import { migrateFilesToR2Action, type IntegrationFormState } from "@/app/dashboard/integrations/actions";

const initialState: IntegrationFormState = {};

export function MigrateFilesToR2Button() {
  const [state, formAction, pending] = useActionState(migrateFilesToR2Action, initialState);

  return (
    <form action={formAction} className="mt-2 grid gap-2">
      <button
        type="submit"
        disabled={pending}
        className="button-secondary pressable w-fit rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-70"
      >
        {pending ? "Migrating..." : "Migrate existing files to R2"}
      </button>
      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}
    </form>
  );
}
