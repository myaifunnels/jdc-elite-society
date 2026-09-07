"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

/** Minimal accessible dialog: backdrop (click to close), Escape closes, focus moves into the
 * modal on open and is restored to the trigger on close. Built inline for the webinar hero
 * since no shared Modal/Dialog component exists elsewhere in this codebase yet (checked
 * src/components/** for `role="dialog"`, `<dialog>`, and Modal/Dialog components). */
export function WebinarRegisterModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;

    previousActiveElement.current = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelector<HTMLElement>(
      'input, button, select, textarea, a[href], [tabindex]:not([tabindex="-1"])',
    );
    (focusable ?? dialog)?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'input, button, select, textarea, a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="webinar-register-modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="webinar-register-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="webinar-register-modal-head">
          <p id={titleId} className="m-0 text-lg font-extrabold text-white">
            {title}
          </p>
          <button
            type="button"
            className="webinar-register-modal-close pressable"
            aria-label="Close registration"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
