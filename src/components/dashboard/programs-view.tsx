"use client";

import Link from "next/link";
import { ChevronRight, LayoutGrid, List } from "lucide-react";
import { useState } from "react";

export type ProgramsViewEntry = {
  slug: string;
  title: string;
  description: string;
  href: string;
  availed: boolean;
  statusLabel: string;
  status: "active" | "completed" | "cancelled";
  since: string;
};

type ViewMode = "grid" | "list";

function ProgramCard({ entry, promoteHref }: { entry: ProgramsViewEntry; promoteHref: string }) {
  return (
    <li className={`pg-card${entry.availed ? " is-availed" : ""}`}>
      <Link href={entry.href} className="pg-media" aria-label={entry.title}>
        <span className="pg-media-mark" aria-hidden>
          {entry.title.slice(0, 1)}
        </span>
      </Link>
      <div className="pg-body">
        <Link href={entry.href} className="pg-title">
          {entry.title}
        </Link>
        {entry.availed ? (
          <span className="pg-meta">
            <span className={`pg-dot is-${entry.status}`} aria-hidden />
            {entry.statusLabel} · since {entry.since}
          </span>
        ) : null}
        <p className="pg-desc">{entry.description}</p>
      </div>
      <Link href={promoteHref} className="pg-promote">
        Promote
        <ChevronRight size={16} aria-hidden />
      </Link>
    </li>
  );
}

function Section({
  id,
  heading,
  entries,
  view,
  promoteHref,
  emptyText,
}: {
  id: string;
  heading: string;
  entries: ProgramsViewEntry[];
  view: ViewMode;
  promoteHref: string;
  emptyText?: string;
}) {
  if (entries.length === 0 && !emptyText) return null;
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="pg-heading">
        {heading}
      </h2>
      {entries.length > 0 ? (
        <ul className={`pg-list ${view === "grid" ? "is-grid" : "is-list"}`}>
          {entries.map((entry) => (
            <ProgramCard key={entry.slug} entry={entry} promoteHref={promoteHref} />
          ))}
        </ul>
      ) : (
        <div className="pg-empty">
          <p>{emptyText}</p>
        </div>
      )}
    </section>
  );
}

export function ProgramsView({ entries, promoteHref }: { entries: ProgramsViewEntry[]; promoteHref: string }) {
  const [view, setView] = useState<ViewMode>("grid");

  return (
    <div className="pg-page">
      <div className="pg-toolbar" role="group" aria-label="Layout">
        <button
          type="button"
          className={`pg-toggle${view === "grid" ? " is-active" : ""}`}
          aria-pressed={view === "grid"}
          onClick={() => setView("grid")}
        >
          <LayoutGrid size={15} aria-hidden />
          Grid
        </button>
        <button
          type="button"
          className={`pg-toggle${view === "list" ? " is-active" : ""}`}
          aria-pressed={view === "list"}
          onClick={() => setView("list")}
        >
          <List size={15} aria-hidden />
          List
        </button>
      </div>
      <Section
        id="pg-yours"
        heading="Your programs"
        entries={entries.filter((entry) => entry.availed)}
        view={view}
        promoteHref={promoteHref}
        emptyText="You haven't availed a program yet. Pick one below to get started."
      />
      <Section
        id="pg-explore"
        heading="Explore more"
        entries={entries.filter((entry) => !entry.availed)}
        view={view}
        promoteHref={promoteHref}
      />
    </div>
  );
}
