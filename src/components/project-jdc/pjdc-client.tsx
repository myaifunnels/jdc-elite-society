"use client";

import { Camera, CircleAlert, CircleCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { PILLAR_ICONS } from "@/components/project-jdc/pjdc-ui";
import { PILLAR_LABELS, PILLARS, TASK_IDEAS, type Pillar } from "@/lib/project-jdc-pillars";
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
  /** May return { error } with a plain message to show instead of the success toast. */
  action: (formData: FormData) => Promise<void | { error: string }>;
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
          const result = await action(formData);
          if (result?.error) {
            showToast(result.error, "error");
            return;
          }
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

/**
 * Fields for giving tasks: pick an area of life, tap ideas (or type your own, one per line),
 * then choose the day and an optional deadline.
 */
export function TaskFields({
  students,
  defaultStudentId,
  today,
}: {
  students: Array<{ id: string; name: string }>;
  defaultStudentId?: string;
  today: string;
}) {
  const [pillar, setPillar] = useState<Pillar>("physical");
  const [text, setText] = useState("");
  const [startDate, setStartDate] = useState(today);
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  function toggleIdea(idea: string) {
    setText((current) => {
      const list = current.split("\n").map((line) => line.trim()).filter(Boolean);
      return (list.includes(idea) ? list.filter((line) => line !== idea) : [...list, idea]).join("\n");
    });
  }

  return (
    <div className="pjdc-form">
      {defaultStudentId ? (
        <input type="hidden" name="studentId" value={defaultStudentId} />
      ) : (
        <label className="pjdc-field">
          Who is it for?
          <select name="studentId" required defaultValue={students.length > 1 ? "all" : students[0]?.id}>
            {students.length > 1 ? <option value="all">All my students ({students.length})</option> : null}
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <fieldset className="pjdc-pillar-pick">
        <legend>Which area of life?</legend>
        {PILLARS.map((value) => {
          const Icon = PILLAR_ICONS[value];
          return (
            <label key={value} className={`is-${value}`}>
              <input type="radio" name="category" value={value} checked={pillar === value} onChange={() => setPillar(value)} />
              <span>
                <Icon aria-hidden size={20} />
                {PILLAR_LABELS[value]}
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="pjdc-field">
        <span>Tap ideas to add them</span>
        <div className="pjdc-chips">
          {TASK_IDEAS[pillar].map((idea) => (
            <button
              key={idea}
              type="button"
              className={cn("pjdc-chip", lines.includes(idea) && "is-on")}
              aria-pressed={lines.includes(idea)}
              onClick={() => toggleIdea(idea)}
            >
              {idea}
            </button>
          ))}
        </div>
      </div>

      <label className="pjdc-field">
        <span>
          Checklist (one task per line)
          {lines.length > 1 ? <i className="pjdc-you">{lines.length} tasks</i> : null}
        </span>
        <textarea
          name="labels"
          required
          rows={3}
          maxLength={2000}
          value={text}
          placeholder={"e.g. Walk 10,000 steps\nDrink 8 glasses of water"}
          onChange={(event) => setText(event.target.value)}
        />
      </label>

      <div className="pjdc-two">
        <label className="pjdc-field">
          Starts on
          <input type="date" name="itemDate" value={startDate} min={today} onChange={(event) => setStartDate(event.target.value)} required />
        </label>
        <label className="pjdc-field">
          Deadline (optional)
          <input type="date" name="dueDate" min={startDate} />
        </label>
      </div>
    </div>
  );
}

const MAX_PROOF_IMAGES = 3;

/** Shrinks a photo or screenshot in the browser so it uploads fast on mobile data. */
async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.72));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** Screenshot, link and a few words: what a student sends so the facilitator can check the task. */
export function ProofFields() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const picked = Array.from(input.files ?? []).slice(0, MAX_PROOF_IMAGES);
    if ((input.files?.length ?? 0) > MAX_PROOF_IMAGES) showToast(`Up to ${MAX_PROOF_IMAGES} pictures. We kept the first ${MAX_PROOF_IMAGES}.`, "error");
    setBusy(true);
    const shrunk = await Promise.all(picked.map(shrinkImage));
    setBusy(false);
    try {
      const transfer = new DataTransfer();
      shrunk.forEach((file) => transfer.items.add(file));
      input.files = transfer.files;
    } catch {
      // Older browsers keep the original files; the server still checks the size.
    }
    setPreviews(shrunk.map((file) => URL.createObjectURL(file)));
  }

  function clearPictures() {
    if (inputRef.current) inputRef.current.value = "";
    setPreviews([]);
  }

  return (
    <div className="pjdc-form">
      <div className="pjdc-field">
        <span>Screenshot or photo</span>
        <label className="pjdc-upload">
          <input ref={inputRef} type="file" name="proofImages" accept="image/png,image/jpeg,image/webp" multiple onChange={onPick} />
          <Camera aria-hidden size={22} />
          <span>{busy ? "Getting your pictures ready…" : previews.length ? "Change pictures" : "Add a screenshot or photo"}</span>
        </label>
        {previews.length ? (
          <div className="pjdc-proof-images">
            {previews.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element -- local preview of a picked file
              <img key={url} src={url} alt="Picture you picked" />
            ))}
            <button type="button" className="pjdc-link pjdc-plain" onClick={clearPictures}>
              Remove
            </button>
          </div>
        ) : null}
      </div>
      <label className="pjdc-field">
        Link (optional)
        <input type="url" name="proofLink" inputMode="url" placeholder="Paste the link to your post or video" />
      </label>
      <label className="pjdc-field">
        What did you do?
        <textarea name="proofNote" rows={2} maxLength={600} placeholder="e.g. Walked 10,200 steps with my sister" />
      </label>
      <p className="pjdc-muted pjdc-small">Add at least one: a picture, a link, or a few words.</p>
    </div>
  );
}
