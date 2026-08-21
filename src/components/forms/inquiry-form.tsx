"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { AddressAutocomplete } from "@/components/forms/address-autocomplete";
import { FloatField } from "@/components/forms/float-field";
import { programs } from "@/data/programs";
import { siteContent } from "@/data/site-content";
import { inquiryDraftStorageKey, readStoredForm, writeStoredForm } from "@/lib/form-storage";
import { cn } from "@/lib/utils";
import { LeadInput, leadSchema } from "@/lib/validations";

type InquiryFormProps = {
  className?: string;
  defaultProgram?: string;
  showIntro?: boolean;
  variant?: "full" | "sticky";
};

export function InquiryForm({
  className,
  defaultProgram,
  showIntro = true,
  variant = "full",
}: InquiryFormProps) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const skipDraftWrite = useRef(true);

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

  const values = useWatch({ control });
  const address = values.address;

  useEffect(() => {
    const saved = readStoredForm(inquiryDraftStorageKey);
    reset({
      ...defaultValues,
      ...saved,
      tags: saved.tags || defaultValues.tags,
      programInterest: saved.programInterest || defaultValues.programInterest,
    });
  }, [defaultValues, reset]);

  useEffect(() => {
    if (skipDraftWrite.current) {
      skipDraftWrite.current = false;
      return;
    }
    if (!values) {
      return;
    }
    writeStoredForm(inquiryDraftStorageKey, values);
  }, [values]);

  async function onSubmit(formValues: LeadInput) {
    setServerError("");
    writeStoredForm(inquiryDraftStorageKey, formValues);

    const response = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValues),
    });

    const payload = (await response.json().catch(() => null)) as
      | { redirectTo?: string; error?: string }
      | null;

    if (response.status === 409 && payload?.redirectTo) {
      router.push(payload.redirectTo);
      return;
    }

    if (!response.ok) {
      setServerError(payload?.error || "I couldn't receive this just now. Try again.");
      return;
    }

    setSubmitted(true);
  }

  const compact = variant === "sticky";

  return (
    <div className={cn(compact ? "grid gap-4" : "grid gap-6 lg:grid-cols-[1.25fr_0.75fr]", className)}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={cn("glass-panel fade-up rounded-[2rem]", compact ? "p-5" : "p-6 sm:p-8")}
      >
        {showIntro ? (
          <div className="mb-6 space-y-2">
            <p className="eyebrow text-xs">{siteContent.inquiry.eyebrow}</p>
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">{siteContent.inquiry.heading}</h2>
            <p className="text-sm text-[var(--muted)]">{siteContent.inquiry.body}</p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <FloatField label="Enter your full name" error={errors.name?.message}>
            <input {...register("name")} placeholder=" " />
          </FloatField>

          <FloatField label="Enter your email address" error={errors.email?.message}>
            <input {...register("email")} placeholder=" " />
          </FloatField>

          <FloatField label="Enter your phone number" error={errors.phone?.message}>
            <input {...register("phone")} placeholder=" " />
          </FloatField>

          <FloatField label="Enter your date of birth" error={errors.dateOfBirth?.message}>
            <input type="date" {...register("dateOfBirth")} />
          </FloatField>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FloatField label="Which program are you considering?" error={errors.programInterest?.message}>
            <select {...register("programInterest")}>
              {programs.map((program) => (
                <option key={program.slug} value={program.title}>
                  {program.title}
                </option>
              ))}
            </select>
          </FloatField>

          <FloatField label="Enter your city or region" error={errors.city?.message}>
            <input {...register("city")} placeholder=" " />
          </FloatField>
        </div>

        <div className="mt-4 grid gap-4">
          <input type="hidden" {...register("tags")} />
          <FloatField label="Enter your address" error={errors.address?.message}>
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <AddressAutocomplete
                  name={field.name}
                  value={field.value}
                  placeholder=" "
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </FloatField>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-[var(--muted)]">
            {submitted
              ? "Received. If you already have an account, sign in with your email. First-time access uses the temporary password JDCELITESOCIETY, then you set a new password."
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

      {compact ? null : (
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
      )}
    </div>
  );
}
