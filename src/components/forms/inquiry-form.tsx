"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { programs } from "@/data/programs";
import { siteContent } from "@/data/site-content";
import { cn } from "@/lib/utils";
import { LeadInput, leadSchema } from "@/lib/validations";

type InquiryFormProps = {
  className?: string;
  defaultProgram?: string;
  showIntro?: boolean;
};

export function InquiryForm({ className, defaultProgram, showIntro = true }: InquiryFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const defaultValues = useMemo<LeadInput>(
    () => ({
      name: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      address: "",
      city: "",
      tags: defaultProgram ? `${defaultProgram}, Website` : "Website, Warm lead",
      programInterest: defaultProgram ?? programs[0].title,
      assignedPartner: "",
    }),
    [defaultProgram],
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues,
  });

  const address = useWatch({ control, name: "address" });

  async function onSubmit(values: LeadInput) {
    setServerError("");

    const response = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      setServerError("I couldn't receive this just now. Try again.");
      return;
    }

    setSubmitted(true);
    reset(defaultValues);
  }

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[1.25fr_0.75fr]", className)}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="glass-panel fade-up rounded-[2rem] p-6 sm:p-8"
      >
        {showIntro ? (
          <div className="mb-6 space-y-2">
            <p className="eyebrow text-xs">{siteContent.inquiry.eyebrow}</p>
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">{siteContent.inquiry.heading}</h2>
            <p className="text-sm text-[var(--muted)]">{siteContent.inquiry.body}</p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name" error={errors.name?.message}>
            <input className={inputClass} {...register("name")} placeholder="Juan Dela Cruz" />
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <input className={inputClass} {...register("email")} placeholder="juan@example.com" />
          </Field>

          <Field label="Phone" error={errors.phone?.message}>
            <input className={inputClass} {...register("phone")} placeholder="+63 917 000 0000" />
          </Field>

          <Field label="Date of birth" error={errors.dateOfBirth?.message}>
            <input className={inputClass} type="date" {...register("dateOfBirth")} />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Which program are you considering?" error={errors.programInterest?.message}>
            <select className={inputClass} {...register("programInterest")}>
              {programs.map((program) => (
                <option key={program.slug} value={program.title}>
                  {program.title}
                </option>
              ))}
            </select>
          </Field>

          <Field label="City / region" error={errors.city?.message}>
            <input className={inputClass} {...register("city")} placeholder="Makati" />
          </Field>
        </div>

        <div className="mt-4 grid gap-4">
          <input type="hidden" {...register("tags")} />
          <Field label="Where are you based?" error={errors.address?.message}>
            <input
              className={inputClass}
              {...register("address")}
              placeholder="Street, city, province or country"
              autoComplete="street-address"
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-[var(--muted)]">
            {submitted
              ? siteContent.inquiry.success
              : siteContent.inquiry.helper}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="button-primary pressable w-full rounded-full px-5 py-3 font-semibold disabled:opacity-70 sm:w-auto"
          >
            {isSubmitting ? siteContent.inquiry.submitting : siteContent.inquiry.submit}
          </button>
        </div>

        {serverError ? <p className="mt-4 text-sm text-red-700">{serverError}</p> : null}
      </form>

      <aside className="glass-panel fade-up-delay-1 fade-up rounded-[2rem] p-6 sm:p-8">
        <p className="text-sm font-semibold tracking-[-0.01em]">{siteContent.inquiry.nextHeading}</p>
        <ul className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
          {siteContent.inquiry.nextSteps.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="mt-6 rounded-3xl border border-dashed border-[var(--line)] bg-[color:var(--surface-elevated)]/80 p-4 text-sm">
          <p className="font-medium">Where you are tells me the season you&apos;re in.</p>
          <p className="mt-2 text-[var(--muted)]">
            {address?.trim() || "Add where you live or work. OFW or home, it matters."}
          </p>
          {address?.trim() ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="button-secondary pressable mt-4 inline-flex rounded-full px-4 py-2 font-medium"
            >
              Open in Google Maps
            </a>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </label>
  );
}

const inputClass =
  "w-full min-h-11 rounded-2xl border border-[var(--line)] bg-[color:var(--surface-elevated)]/86 px-4 py-3 text-base outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand)_22%,transparent)]";
