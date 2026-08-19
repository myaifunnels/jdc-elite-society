"use client";

import { useActionState } from "react";

import {
  IntegrationFormState,
  saveGoogleMapsIntegration,
  saveR2Integration,
} from "@/app/dashboard/integrations/actions";
import { StickyForm } from "@/components/forms/sticky-form";
import { maskSecret } from "@/lib/integrations";

const initialState: IntegrationFormState = {};

const inputClass =
  "w-full rounded-2xl border border-[var(--line)] bg-[color:var(--surface-elevated)]/86 px-4 py-3 outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[rgba(41,98,255,0.18)]";

export function GoogleMapsIntegrationForm({
  configured,
}: {
  configured: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    saveGoogleMapsIntegration,
    initialState,
  );

  return (
    <StickyForm storageKey="coach-jdc-maps-integration" action={formAction} className="mt-6 grid gap-4">
      <label className="grid gap-2 text-sm">
        <span className="font-medium">Maps Embed API key</span>
        <input
          name="googleMapsEmbedKey"
          type="password"
          autoComplete="off"
          data-sticky="off"
          placeholder={configured ? maskSecret("set") : "AIza..."}
          className={inputClass}
        />
      </label>

      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="button-primary pressable w-fit rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-70"
      >
        {pending ? "Saving..." : "Save Google Maps"}
      </button>
    </StickyForm>
  );
}

export function R2IntegrationForm({
  accountId,
  bucket,
  publicUrl,
  accessKeyConfigured,
}: {
  accountId: string;
  bucket: string;
  publicUrl: string;
  accessKeyConfigured: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveR2Integration, initialState);

  return (
    <StickyForm storageKey="coach-jdc-r2-integration" action={formAction} className="mt-6 grid gap-4">
      <label className="grid gap-2 text-sm">
        <span className="font-medium">Account ID</span>
        <input
          name="r2AccountId"
          autoComplete="off"
          defaultValue={accountId}
          placeholder="Cloudflare account ID"
          className={inputClass}
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="font-medium">Access key ID</span>
        <input
          name="r2AccessKeyId"
          autoComplete="off"
          data-sticky="off"
          placeholder={accessKeyConfigured ? maskSecret("set") : "R2 access key"}
          className={inputClass}
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="font-medium">Secret access key</span>
        <input
          name="r2SecretAccessKey"
          type="password"
          autoComplete="off"
          data-sticky="off"
          placeholder={accessKeyConfigured ? maskSecret("set") : "R2 secret key"}
          className={inputClass}
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="font-medium">Bucket</span>
        <input name="r2Bucket" defaultValue={bucket} placeholder="coach-jdc-media" className={inputClass} />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="font-medium">Public URL</span>
        <input
          name="r2PublicUrl"
          defaultValue={publicUrl}
          placeholder="https://media.yourdomain.com"
          className={inputClass}
        />
      </label>

      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="button-primary pressable w-fit rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-70"
      >
        {pending ? "Saving..." : "Save Cloudflare R2"}
      </button>
    </StickyForm>
  );
}
