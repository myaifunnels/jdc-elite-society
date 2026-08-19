"use client";

import { useEffect, useRef, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { readStoredForm, shouldPersistField, writeStoredForm } from "@/lib/form-storage";

export function StickyForm({
  storageKey,
  className,
  action,
  children,
}: {
  storageKey: string;
  className?: string;
  action?: ComponentProps<"form">["action"];
  children: ReactNode;
}) {
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = ref.current;
    if (!form) {
      return;
    }

    const saved = readStoredForm(storageKey);
    for (const [name, value] of Object.entries(saved)) {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
        if (shouldPersistField(field) && !(field.dataset.lock === "true" && field.value)) {
          field.value = value;
        }
      }
    }

    function persist() {
      if (!form) {
        return;
      }

      const next: Record<string, string> = {};
      for (const field of Array.from(form.elements)) {
        if (
          (field instanceof HTMLInputElement ||
            field instanceof HTMLSelectElement ||
            field instanceof HTMLTextAreaElement) &&
          shouldPersistField(field)
        ) {
          next[field.name] = field.value;
        }
      }
      writeStoredForm(storageKey, next);
    }

    form.addEventListener("input", persist);
    form.addEventListener("change", persist);
    return () => {
      form.removeEventListener("input", persist);
      form.removeEventListener("change", persist);
    };
  }, [storageKey]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const next: Record<string, string> = {};
    for (const field of Array.from(form.elements)) {
      if (
        (field instanceof HTMLInputElement ||
          field instanceof HTMLSelectElement ||
          field instanceof HTMLTextAreaElement) &&
        shouldPersistField(field)
      ) {
        next[field.name] = field.value;
      }
    }
    writeStoredForm(storageKey, next);
  }

  return (
    <form ref={ref} action={action} className={className} onSubmit={onSubmit}>
      {children}
    </form>
  );
}
