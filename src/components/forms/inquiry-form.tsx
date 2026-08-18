"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { programs } from "@/data/programs";
import { cn } from "@/lib/utils";
import { LeadInput, leadSchema } from "@/lib/validations";

type InquiryFormProps = {
  className?: string;
  defaultProgram?: string;
};

export function InquiryForm({ className, defaultProgram }: InquiryFormProps) {
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
      setServerError("The inquiry could not be saved right now.");
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
        <div className="mb-6 space-y-2">
          <p className="eyebrow text-xs">
            CRM capture form
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">
            Collect leads directly into the Coach JDC CRM.
          </h2>
          <p className="text-sm text-[var(--muted)]">
            This form captures the core CRM fields for admin and partner follow-up.
          </p>
        </div>

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
          <Field label="Program interest" error={errors.programInterest?.message}>
            <select className={inputClass} {...register("programInterest")}>
              {programs.map((program) => (
                <option key={program.slug} value={program.title}>
                  {program.title}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tags" error={errors.tags?.message}>
            <input
              className={inputClass}
              {...register("tags")}
              placeholder="Warm lead, OFW, Partner"
            />
          </Field>
        </div>

        <div className="mt-4 grid gap-4">
          <Field label="Address" error={errors.address?.message}>
            <input
              className={inputClass}
              {...register("address")}
              placeholder="Street, city, province or country"
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="City / region" error={errors.city?.message}>
              <input className={inputClass} {...register("city")} placeholder="Makati" />
            </Field>

            <Field label="Assigned partner" error={errors.assignedPartner?.message}>
              <input
                className={inputClass}
                {...register("assignedPartner")}
                placeholder="Optional partner owner"
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-[var(--muted)]">
            {submitted
              ? "Inquiry saved in the demo CRM feed."
              : "Submit to create a lead record for follow-up."}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="button-primary pressable rounded-full px-5 py-3 font-semibold disabled:opacity-70"
          >
            {isSubmitting ? "Saving..." : "Save inquiry"}
          </button>
        </div>

        {serverError ? <p className="mt-4 text-sm text-red-700">{serverError}</p> : null}
      </form>

      <aside className="glass-panel fade-up-delay-1 fade-up rounded-[2rem] p-6 sm:p-8">
        <p className="text-sm font-semibold tracking-[-0.01em]">Google Maps-ready address workflow</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Use the captured address to drive Google Maps lookups, partner territory routing, or future visit planning.
        </p>

        <div className="mt-6 rounded-3xl border border-dashed border-[var(--line)] bg-[color:var(--surface-elevated)]/80 p-4 text-sm">
          <p className="font-medium">Live lookup preview</p>
          <p className="mt-2 text-[var(--muted)]">
            {address?.trim() || "Enter an address to preview the map-ready location string."}
          </p>
          {address?.trim() ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noreferrer"
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
  "w-full rounded-2xl border border-[var(--line)] bg-[color:var(--surface-elevated)]/86 px-4 py-3 outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[rgba(184,134,77,0.18)]";
