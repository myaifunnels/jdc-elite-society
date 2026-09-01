"use client";

import { MessageCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { InquiryForm } from "@/components/forms/inquiry-form";

const hiddenPaths = ["/login", "/register", "/account", "/dashboard", "/forgot-password", "/reset-password"];

export function StickyContact() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (hiddenPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return null;
  }

  return (
    <div className="sticky-contact">
      {open ? (
        <div className="sticky-contact-panel" role="dialog" aria-label="Contact Coach JDC">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow text-xs">Sticky contact</p>
              <p className="mt-1 text-sm font-semibold">Your details stay filled in as you move around the site.</p>
            </div>
            <button
              type="button"
              className="button-secondary pressable rounded-full px-3 py-2"
              aria-label="Close contact form"
              onClick={() => setOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
          <InquiryForm showIntro={false} variant="sticky" />
        </div>
      ) : null}

      <button
        type="button"
        className="sticky-contact-toggle pressable"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MessageCircle size={18} />
        Talk to Coach
      </button>
    </div>
  );
}
