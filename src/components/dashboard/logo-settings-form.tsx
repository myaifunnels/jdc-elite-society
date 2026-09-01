"use client";

import { useActionState } from "react";

import { BrandingFormState, saveLogoSettings } from "@/app/dashboard/settings/actions";
import { BrandingSettings } from "@/lib/branding";

const initialState: BrandingFormState = {};

const inputClass = "macos-control";

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

      <form action={formAction} className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Logo image URL</span>
          <input
            name="logoUrl"
            type="text"
            inputMode="url"
            autoComplete="off"
            defaultValue={branding.logoUrl}
            placeholder="https://media.yourdomain.com/logo.png"
            className={inputClass}
          />
          <span className="text-[var(--muted)]">
            Paste an R2 or CDN URL. Leave this blank to use the Coach JDC text mark.
          </span>
        </label>

        <input type="hidden" name="logoHref" value="/" />

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Alt text</span>
          <input
            name="logoAlt"
            autoComplete="off"
            defaultValue={branding.logoAlt}
            placeholder="Coach Jayson Dela Cruz"
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
          {pending ? "Saving..." : "Save logo"}
        </button>
      </form>
    </section>
  );
}
