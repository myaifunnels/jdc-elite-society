"use client";

import { useMemo, useState } from "react";

import { InquiryForm } from "@/components/forms/inquiry-form";
import { ProgramCard } from "@/components/sections/program-card";
import { programs } from "@/data/programs";

const ALL_TAB = "all";

export function ProgramsBoard({ initialSlug = ALL_TAB }: { initialSlug?: string }) {
  const firstMatch = programs.some((program) => program.slug === initialSlug) ? initialSlug : ALL_TAB;
  const [active, setActive] = useState(firstMatch);

  const visiblePrograms = useMemo(
    () => (active === ALL_TAB ? programs : programs.filter((program) => program.slug === active)),
    [active],
  );

  const mastermind = programs.find((program) => program.slug === "jdc-mastermind");

  return (
    <div>
      <div className="program-tabs" role="tablist" aria-label="Program tracks">
        <button
          type="button"
          role="tab"
          aria-selected={active === ALL_TAB}
          className={active === ALL_TAB ? "program-tab is-active" : "program-tab"}
          onClick={() => setActive(ALL_TAB)}
        >
          All programs
        </button>
        {programs.map((program) => (
          <button
            type="button"
            key={program.slug}
            role="tab"
            aria-selected={active === program.slug}
            className={active === program.slug ? "program-tab is-active" : "program-tab"}
            onClick={() => setActive(program.slug)}
          >
            {program.title}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {visiblePrograms.map((program) => (
          <ProgramCard key={program.slug} program={program} />
        ))}
      </div>

      {mastermind ? (
        <section id="mastermind-form" className="mt-10">
          <div className="mb-6 max-w-3xl">
            <p className="eyebrow text-xs">JDC Mastermind</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Ask about the Mastermind</h2>
            <p className="mt-3 text-[var(--muted)]">
              This form lives on the Programs tab. Tell me where you are and I&apos;ll review whether the room is the right next step.
            </p>
          </div>
          <InquiryForm defaultProgram={mastermind.title} showIntro={false} />
        </section>
      ) : null}
    </div>
  );
}
