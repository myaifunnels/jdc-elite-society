"use client";

import { useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "automation-template-view";
type View = "grid" | "list";

export function TemplateViewToggle({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>("grid");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "grid" || saved === "list") setView(saved);
    } catch {
      // Private browsing or blocked storage — grid stays the default.
    }
  }, []);

  function choose(next: View) {
    setView(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Nothing to persist to; the choice still applies for this visit.
    }
  }

  return (
    <div className="dashboard-span-2 template-view-toggle-wrap">
      <div className="macos-segment" style={{ gridTemplateColumns: "1fr 1fr", width: "min(12rem, 100%)" }} role="tablist" aria-label="Template layout">
        <button type="button" role="tab" aria-selected={view === "grid"} className={view === "grid" ? "is-active" : ""} onClick={() => choose("grid")}>
          Grid
        </button>
        <button type="button" role="tab" aria-selected={view === "list"} className={view === "list" ? "is-active" : ""} onClick={() => choose("list")}>
          List
        </button>
      </div>
      <div data-view={view} className="template-view-body">
        {children}
      </div>
    </div>
  );
}
