"use client";

import { useEffect, useRef, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { readStoredForm, shouldPersistField, writeStoredForm } from "@/lib/form-storage";

function collectValues(form: HTMLFormElement) {
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
  return next;
}

function restoreValues(form: HTMLFormElement, storageKey: string) {
  const saved = readStoredForm(storageKey);
  for (const [name, value] of Object.entries(saved)) {
    const field = form.elements.namedItem(name);
    if (
      (field instanceof HTMLInputElement ||
        field instanceof HTMLSelectElement ||
        field instanceof HTMLTextAreaElement) &&
      shouldPersistField(field) &&
      !(field.dataset.lock === "true" && field.value)
    ) {
      field.value = value;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
}

export function StickyForm({
  storageKey,
  restoreToken,
  className,
  action,
  encType,
  children,
}: {
  storageKey: string;
  restoreToken?: string;
  className?: string;
  action?: ComponentProps<"form">["action"];
  encType?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = ref.current;
    if (!form) {
      return;
    }

    const current = form;
    restoreValues(current, storageKey);

    function persist() {
      writeStoredForm(storageKey, collectValues(current));
    }

    function onReset() {
      queueMicrotask(() => restoreValues(current, storageKey));
    }

    current.addEventListener("input", persist);
    current.addEventListener("change", persist);
    current.addEventListener("reset", onReset);
    return () => {
      current.removeEventListener("input", persist);
      current.removeEventListener("change", persist);
      current.removeEventListener("reset", onReset);
    };
  }, [storageKey, restoreToken]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    writeStoredForm(storageKey, collectValues(event.currentTarget));
  }

  return (
    <form ref={ref} action={action} className={className} encType={encType} onSubmit={onSubmit}>
      {children}
    </form>
  );
}
