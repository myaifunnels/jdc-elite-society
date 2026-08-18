"use client";

import { useActionState } from "react";

import {
  IntegrationFormState,
  saveGhlIntegration,
  saveGoogleMapsIntegration,
  saveR2Integration,
} from "@/app/dashboard/integrations/actions";
import { FloatField } from "@/components/forms/float-field";
import { maskSecret } from "@/lib/integrations";

const initialState: IntegrationFormState = {};

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
    <form action={formAction} className="mt-6 grid gap-4">
      <FloatField label={configured ? `Enter a new Maps API key (${maskSecret("set")})` : "Enter your Maps API key"}>
        <input name="googleMapsEmbedKey" type="password" autoComplete="off" placeholder=" " />
      </FloatField>

      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="button-primary pressable w-fit rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-70"
      >
        {pending ? "Saving..." : "Save Google Maps"}
      </button>
    </form>
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
    <form action={formAction} className="mt-6 grid gap-4">
      <FloatField label="Enter your Cloudflare account ID">
        <input name="r2AccountId" autoComplete="off" defaultValue={accountId} placeholder=" " />
      </FloatField>
      <FloatField
        label={accessKeyConfigured ? `Enter a new access key (${maskSecret("set")})` : "Enter your R2 access key"}
      >
        <input name="r2AccessKeyId" autoComplete="off" placeholder=" " />
      </FloatField>
      <FloatField
        label={accessKeyConfigured ? `Enter a new secret key (${maskSecret("set")})` : "Enter your R2 secret key"}
      >
        <input name="r2SecretAccessKey" type="password" autoComplete="off" placeholder=" " />
      </FloatField>
      <FloatField label="Enter your R2 bucket name">
        <input name="r2Bucket" defaultValue={bucket} placeholder=" " />
      </FloatField>
      <FloatField label="Enter your public media URL">
        <input name="r2PublicUrl" defaultValue={publicUrl} placeholder=" " />
      </FloatField>

      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="button-primary pressable w-fit rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-70"
      >
        {pending ? "Saving..." : "Save Cloudflare R2"}
      </button>
    </form>
  );
}

export function GhlIntegrationForm({
  configured,
  locationId,
}: {
  configured: boolean;
  locationId: string;
}) {
  const [state, formAction, pending] = useActionState(saveGhlIntegration, initialState);

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <FloatField
        label={configured ? `Enter a new GHL token (${maskSecret("set")})` : "Enter your GHL private token"}
      >
        <input name="ghlApiKey" type="password" autoComplete="off" placeholder=" " />
      </FloatField>
      <FloatField label="Enter your GHL location ID">
        <input name="ghlLocationId" autoComplete="off" defaultValue={locationId} placeholder=" " />
      </FloatField>

      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="button-primary pressable w-fit rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-70"
      >
        {pending ? "Saving..." : "Save GoHighLevel"}
      </button>
    </form>
  );
}
