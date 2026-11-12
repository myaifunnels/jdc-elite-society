"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

type ToastTone = "success" | "error";
type ToastDetail = { message: string; tone: ToastTone };

const TOAST_EVENT = "pjdc:toast";

export function showToast(message: string, tone: ToastTone = "success") {
  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail: { message, tone } }));
}

/** One friendly message at a time, just above the tab bar. */
export function PjdcToaster() {
  const [toast, setToast] = useState<(ToastDetail & { key: number }) | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function onToast(event: Event) {
      const { detail } = event as CustomEvent<ToastDetail>;
      setToast({ ...detail, key: Date.now() });
      clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 3200);
    }
    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="pjdc-toast-region" aria-live="polite" role="status">
      {toast ? (
        <div key={toast.key} className={cn("pjdc-toast", `is-${toast.tone}`)}>
          {toast.tone === "success" ? <CircleCheck aria-hidden size={20} /> : <CircleAlert aria-hidden size={20} />}
          <span>{toast.message}</span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * A form that runs a server action, then shows a short friendly message.
 * If the form sits inside a sheet, the sheet closes when it succeeds.
 */
export function ActionForm({
  action,
  success,
  className,
  children,
  reset = false,
}: {
  action: (formData: FormData) => Promise<void>;
  success: string;
  className?: string;
  children: React.ReactNode;
  reset?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className={className}
      action={async (formData) => {
        try {
          await action(formData);
          showToast(success);
          if (reset) formRef.current?.reset();
          formRef.current?.closest("dialog")?.close();
        } catch {
          showToast("That didn't work. Check your internet and try again.", "error");
        }
      }}
    >
      {children}
    </form>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className = "pjdc-btn is-primary",
  disabled,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending || disabled} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}

/** A button that opens a bottom sheet (a centered panel on wide screens). */
export function SheetButton({
  label,
  title,
  className = "pjdc-btn is-primary",
  children,
}: {
  label: React.ReactNode;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" className={className} onClick={() => dialogRef.current?.showModal()}>
        {label}
      </button>
      <dialog
        ref={dialogRef}
        className="pjdc-sheet"
        aria-label={title}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="pjdc-sheet-body">
          <div className="pjdc-sheet-head">
            <h2>{title}</h2>
            <button
              type="button"
              className="pjdc-icon-btn"
              aria-label="Close"
              onClick={() => dialogRef.current?.close()}
            >
              <X aria-hidden size={20} />
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}

/** Asks "Are you sure?" in plain words before submitting the surrounding form. */
export function ConfirmButton({
  label,
  title,
  message,
  confirmLabel,
  className = "pjdc-btn is-quiet",
}: {
  label: React.ReactNode;
  title: string;
  message: string;
  confirmLabel: string;
  className?: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button ref={buttonRef} type="button" className={className} onClick={() => dialogRef.current?.showModal()}>
        {label}
      </button>
      <dialog ref={dialogRef} className="pjdc-confirm" aria-label={title}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="pjdc-confirm-actions">
          <button type="button" className="pjdc-btn is-quiet" onClick={() => dialogRef.current?.close()}>
            No, go back
          </button>
          <button
            type="button"
            className="pjdc-btn is-danger"
            onClick={() => {
              dialogRef.current?.close();
              buttonRef.current?.form?.requestSubmit();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}

const TASK_IDEAS: Array<{ label: string; category: string }> = [
  { label: "Post today's content on Facebook", category: "content" },
  { label: "Make a short video", category: "content" },
  { label: "Walk 10,000 steps", category: "fitness" },
  { label: "Watch today's training", category: "learning" },
  { label: "Pray or meditate for 10 minutes", category: "meditation" },
  { label: "Plan tomorrow", category: "planning" },
];

/** Fields for giving a task, with one-tap ideas so nobody has to type much. */
export function TaskFields({
  students,
  defaultStudentId,
  today,
}: {
  students: Array<{ id: string; name: string }>;
  defaultStudentId?: string;
  today: string;
}) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("general");

  return (
    <div className="pjdc-form">
      {defaultStudentId ? (
        <input type="hidden" name="studentId" value={defaultStudentId} />
      ) : (
        <label className="pjdc-field">
          Who is it for?
          <select name="studentId" required defaultValue={students.length > 1 ? "all" : students[0]?.id}>
            {students.length > 1 ? <option value="all">All my students</option> : null}
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="pjdc-field">
        <span>Pick an idea</span>
        <div className="pjdc-chips">
          {TASK_IDEAS.map((idea) => (
            <button
              key={idea.label}
              type="button"
              className={cn("pjdc-chip", label === idea.label && "is-on")}
              aria-pressed={label === idea.label}
              onClick={() => {
                setLabel(idea.label);
                setCategory(idea.category);
              }}
            >
              {idea.label}
            </button>
          ))}
        </div>
      </div>

      <label className="pjdc-field">
        Or type your own
        <input
          type="text"
          name="label"
          required
          maxLength={200}
          value={label}
          placeholder="e.g. Share your story in a reel"
          onChange={(event) => {
            setLabel(event.target.value);
            setCategory("general");
          }}
        />
      </label>
      <input type="hidden" name="category" value={category} />

      <label className="pjdc-field">
        For which day?
        <input type="date" name="itemDate" defaultValue={today} required />
      </label>
    </div>
  );
}
