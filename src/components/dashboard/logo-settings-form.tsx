"use client";

import { useActionState } from "react";

import { BrandingFormState, saveLogoSettings } from "@/app/dashboard/settings/actions";
import { FloatField } from "@/components/forms/float-field";
import { StickyForm } from "@/components/forms/sticky-form";
import { BrandingSettings } from "@/lib/branding";

const initialState: BrandingFormState = {};

export function LogoSettingsForm({ branding }: { branding: BrandingSettings }) {
  const [state, formAction, pending] = useActionState(saveLogoSettings, initialState);

  return (
    <section className="glass-panel rounded-[2rem] p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold">Logo and logo link</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Add a public logo image. Clicking the logo in the site header and footer always goes to the homepage,
            not the image file. The same logo also appears at the top of this admin sidebar.
          </p>
        </div>
        {branding.logoUrl ? (
          <div className="rounded-2xl border border-[var(--line)] bg-[color:var(--surface-elevated)]/86 px-4 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={branding.logoUrl}
              alt={branding.logoAlt || "Current site logo"}
              className="h-10 w-auto max-w-[12rem] object-contain"
            />
          </div>
        ) : null}
      </div>

      <StickyForm storageKey="coach-jdc-logo-settings" action={formAction} className="mt-6 grid gap-4">
        <FloatField label="Enter your logo image URL">
          <input
            name="logoUrl"
            type="text"
            inputMode="url"
            autoComplete="off"
            defaultValue={branding.logoUrl}
            placeholder=" "
          />
        </FloatField>
        <p className="text-sm text-[var(--muted)]">
          Paste an R2 or CDN URL. Leave this blank to use the Coach JDC text mark.
        </p>

        <input type="hidden" name="logoHref" value="/" />

        <FloatField label="Enter logo alt text">
          <input name="logoAlt" autoComplete="off" defaultValue={branding.logoAlt} placeholder=" " />
        </FloatField>

        {state.error ? <p className="text-sm text-red-500">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-emerald-400">{state.success}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="button-primary pressable w-fit rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-70"
        >
          {pending ? "Saving..." : "Save logo"}
        </button>
      </StickyForm>
    </section>
  );
}
