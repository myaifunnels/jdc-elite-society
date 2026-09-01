"use client";

import { useActionState } from "react";

import {
  IntegrationFormState,
  saveGhlIntegration,
  saveGoogleMapsIntegration,
  saveR2Integration,
  saveTextBeeIntegration,
} from "@/app/dashboard/integrations/actions";
import { FloatField } from "@/components/forms/float-field";
import { StickyForm } from "@/components/forms/sticky-form";
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
    <StickyForm storageKey="coach-jdc-maps-integration" action={formAction} className="mt-6 grid gap-4">
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
      <FloatField label="Enter your Cloudflare account ID">
        <input name="r2AccountId" autoComplete="off" defaultValue={accountId} placeholder=" " />
      </FloatField>
      <FloatField
        label={accessKeyConfigured ? `Enter a new access key (${maskSecret("set")})` : "Enter your R2 access key"}
      >
        <input name="r2AccessKeyId" autoComplete="off" data-sticky="off" placeholder=" " />
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
    </StickyForm>
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
    <StickyForm storageKey="coach-jdc-ghl-integration" action={formAction} className="mt-6 grid gap-4">
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
    </StickyForm>
  );
}

export function TextBeeIntegrationForm({
  configured,
  deviceId,
}: {
  configured: boolean;
  deviceId: string;
}) {
  const [state, formAction, pending] = useActionState(saveTextBeeIntegration, initialState);

  return (
    <StickyForm storageKey="coach-jdc-textbee-integration" action={formAction} className="mt-6 grid gap-4">
      <FloatField
        label={configured ? `Enter a new API key (${maskSecret("set")})` : "Enter your TextBee API key"}
      >
        <input name="textbeeApiKey" type="password" autoComplete="off" placeholder=" " />
      </FloatField>
      <FloatField label="Enter your TextBee device ID">
        <input name="textbeeDeviceId" autoComplete="off" defaultValue={deviceId} placeholder=" " />
      </FloatField>

      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="button-primary pressable w-fit rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-70"
      >
        {pending ? "Saving..." : "Save TextBee"}
      </button>
    </StickyForm>
  );
}

export function GhlIntegrationForm({
  locationId,
  locationName,
  tags,
  webhookUrl,
  autoSync,
  tokenConfigured,
}: {
  locationId: string;
  locationName: string;
  tags: string;
  webhookUrl: string;
  autoSync: boolean;
  tokenConfigured: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveGhlIntegration, initialState);

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <label className="grid gap-2 text-sm">
        <span className="font-medium">Subaccount Location ID</span>
        <input
          name="ghlLocationId"
          autoComplete="off"
          defaultValue={locationId}
          placeholder="Paste the JDC Elite Society location ID"
          className={inputClass}
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="font-medium">Private Integration token</span>
        <input
          name="ghlPrivateToken"
          type="password"
          autoComplete="off"
          placeholder={tokenConfigured ? maskSecret("set") : "pit-..."}
          className={inputClass}
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="font-medium">Default GHL tags</span>
        <input
          name="ghlTags"
          autoComplete="off"
          defaultValue={tags}
          placeholder="Website, JDC Elite Society"
          className={inputClass}
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="font-medium">Inbound webhook URL (optional)</span>
        <input
          name="ghlWebhookUrl"
          autoComplete="off"
          defaultValue={webhookUrl}
          placeholder="https://services.leadconnectorhq.com/hooks/..."
          className={inputClass}
        />
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input
          name="ghlAutoSync"
          type="checkbox"
          defaultChecked={autoSync}
          className="mt-1 h-4 w-4 accent-[var(--brand)]"
        />
        <span>
          <span className="font-medium">Automatic sync</span>
          <span className="mt-1 block text-[var(--muted)]">
            Create or update a contact in {locationName || "the JDC Elite Society subaccount"} every
            time someone submits a website form.
          </span>
        </span>
      </label>

      {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="button-primary pressable w-fit rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-70"
      >
        {pending ? "Connecting..." : tokenConfigured ? "Save GoHighLevel" : "Connect GoHighLevel"}
      </button>
    </form>
  );
}
