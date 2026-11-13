"use client";

import { Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { setFacilitatorStatusAction, updateStudentProgressAction } from "@/app/dashboard/project-jdc/actions";
import { ActionForm, SubmitButton } from "@/components/project-jdc/pjdc-client";
import { PjdcGenealogy } from "@/components/project-jdc/pjdc-genealogy";
import { firstName, PillarBoard, PjdcAvatar, shortDate, StatusPill } from "@/components/project-jdc/pjdc-ui";
import {
  PROJECT_JDC_STATUS_HINTS,
  PROJECT_JDC_STATUS_LABELS,
  PROJECT_JDC_STATUSES,
  type ProjectJdcStatus,
} from "@/lib/project-jdc-status";
import type { PjdcFacilitator, PjdcPerson, PjdcStudent } from "@/lib/project-jdc-view";
import { cn } from "@/lib/utils";

type Filter = "all" | ProjectJdcStatus;

type Selected = { kind: "student"; student: PjdcStudent } | { kind: "facilitator"; facilitator: PjdcFacilitator };

const PROGRAM_DAYS = 30;

function dayText(day: number) {
  if (day < 1) return "Starts soon";
  if (day > PROGRAM_DAYS) return "Finished 30 days";
  return `Day ${day}`;
}

export function StatusChoices({ value }: { value: ProjectJdcStatus }) {
  return (
    <fieldset className="pjdc-status-choices">
      <legend>How are they doing?</legend>
      {PROJECT_JDC_STATUSES.map((status) => (
        <label key={status} className={cn("pjdc-status-choice", `is-${status}`)}>
          <input type="radio" name="status" value={status} defaultChecked={status === value} />
          <span>
            <strong>{PROJECT_JDC_STATUS_LABELS[status]}</strong>
            <em>{PROJECT_JDC_STATUS_HINTS[status]}</em>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export function PjdcOrgChart({
  facilitators,
  unassigned = [],
  canEditStudent,
  canEditFacilitator = false,
  viewerId,
}: {
  facilitators: PjdcFacilitator[];
  unassigned?: PjdcPerson[];
  /** Which student cards show the status form: everyone, only this facilitator's, or none. */
  canEditStudent: "all" | "own" | "none";
  canEditFacilitator?: boolean;
  viewerId: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Selected | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const allStudents = useMemo(() => facilitators.flatMap((item) => item.students), [facilitators]);
  const counts = useMemo(() => {
    const result: Record<Filter, number> = { all: allStudents.length, active: 0, at_risk: 0, inactive: 0, completed: 0 };
    for (const student of allStudents) result[student.status] += 1;
    return result;
  }, [allStudents]);

  const needle = query.trim().toLowerCase();
  const narrowing = needle !== "" || filter !== "all";

  const branches = facilitators
    .map((facilitator) => {
      const facilitatorMatches = needle !== "" && facilitator.name.toLowerCase().includes(needle);
      const students = facilitator.students.filter(
        (student) =>
          (filter === "all" || student.status === filter) &&
          (needle === "" || facilitatorMatches || student.name.toLowerCase().includes(needle)),
      );
      return { facilitator, students, visible: !narrowing || students.length > 0 || facilitatorMatches };
    })
    .filter((branch) => branch.visible);

  function openDetail(next: Selected) {
    setSelected(next);
    dialogRef.current?.showModal();
  }

  const studentEditable = (student: PjdcStudent) =>
    canEditStudent === "all" || (canEditStudent === "own" && student.facilitatorId === viewerId);

  return (
    <div className="pjdc-org">
      <div className="pjdc-org-tools">
        <label className="pjdc-search">
          <Search aria-hidden size={18} />
          <input
            type="search"
            value={query}
            placeholder="Find someone"
            aria-label="Find someone by name"
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <button type="button" className="pjdc-icon-btn" aria-label="Clear search" onClick={() => setQuery("")}>
              <X aria-hidden size={16} />
            </button>
          ) : null}
        </label>
        <div className="pjdc-chips is-scroll" role="group" aria-label="Show students by status">
          {(["all", ...PROJECT_JDC_STATUSES] as Filter[]).map((value) => (
            <button
              key={value}
              type="button"
              className={cn("pjdc-chip", value !== "all" && `is-${value}`, filter === value && "is-on")}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {value === "all" ? "Everyone" : PROJECT_JDC_STATUS_LABELS[value]}
              <b>{counts[value]}</b>
            </button>
          ))}
        </div>
      </div>

      {branches.length === 0 && needle !== "" ? (
        <p className="pjdc-tree-none">No one matches that. Try another name or tap “Everyone”.</p>
      ) : (
        <PjdcGenealogy
          branches={branches}
          unassigned={narrowing ? [] : unassigned}
          totals={{ facilitators: facilitators.length, students: allStudents.length }}
          viewerId={viewerId}
          forceOpen={narrowing}
          onSelectStudent={(student) => openDetail({ kind: "student", student })}
          onSelectFacilitator={(facilitator) => openDetail({ kind: "facilitator", facilitator })}
        />
      )}

      <dialog
        ref={dialogRef}
        className="pjdc-sheet"
        aria-label="Person details"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div className="pjdc-sheet-body">
            <div className="pjdc-sheet-head">
              <span />
              <button type="button" className="pjdc-icon-btn" aria-label="Close" onClick={() => dialogRef.current?.close()}>
                <X aria-hidden size={20} />
              </button>
            </div>
            {selected.kind === "student" ? (
              <StudentDetail student={selected.student} editable={studentEditable(selected.student)} />
            ) : (
              <FacilitatorDetail facilitator={selected.facilitator} editable={canEditFacilitator} />
            )}
          </div>
        ) : null}
      </dialog>
    </div>
  );
}

function StudentDetail({ student, editable }: { student: PjdcStudent; editable: boolean }) {
  return (
    <>
      <div className="pjdc-profile">
        <PjdcAvatar name={student.name} photoUrl={student.photoUrl} status={student.status} size="xl" />
        <h2>{student.name}</h2>
        <StatusPill status={student.status} />
        {student.isSample ? <span className="pjdc-sample-tag">Sample student</span> : null}
      </div>
      <dl className="pjdc-facts">
        <div>
          <dt>Program</dt>
          <dd>{dayText(student.day)}{student.day >= 1 && student.day <= PROGRAM_DAYS ? ` of ${PROGRAM_DAYS}` : ""}</dd>
        </div>
        <div>
          <dt>Today</dt>
          <dd>{student.totalToday ? `${student.doneToday} of ${student.totalToday} done` : "No tasks"}</dd>
        </div>
        <div>
          <dt>Days in a row</dt>
          <dd>{student.streak}</dd>
        </div>
        <div>
          <dt>Last active</dt>
          <dd>{shortDate(student.lastCheckIn)}</dd>
        </div>
      </dl>
      <div className="pjdc-field">
        <span>5 areas of life</span>
        <PillarBoard stats={student.pillars} compact />
      </div>
      {editable ? (
        <>
          {student.phone || student.email ? (
            <p className="pjdc-contact">
              {student.phone ? <a href={`tel:${student.phone}`}>{student.phone}</a> : null}
              {student.email ? <a href={`mailto:${student.email}`}>{student.email}</a> : null}
            </p>
          ) : null}
          <ActionForm action={updateStudentProgressAction} success={`Saved for ${firstName(student.name)}.`} className="pjdc-form">
            <input type="hidden" name="studentId" value={student.id} />
            <StatusChoices value={student.status} />
            <label className="pjdc-field">
              Notes (only you and the coach see this)
              <textarea name="notes" defaultValue={student.notes} rows={2} maxLength={500} placeholder="e.g. Busy at work this week" />
            </label>
            <SubmitButton>Save</SubmitButton>
          </ActionForm>
        </>
      ) : null}
    </>
  );
}

function FacilitatorDetail({ facilitator, editable }: { facilitator: PjdcFacilitator; editable: boolean }) {
  const active = facilitator.students.filter((student) => student.status === "active").length;
  return (
    <>
      <div className="pjdc-profile">
        <PjdcAvatar name={facilitator.name} photoUrl={facilitator.photoUrl} status={facilitator.status} size="xl" />
        <h2>{facilitator.name}</h2>
        <StatusPill status={facilitator.status} />
      </div>
      <dl className="pjdc-facts">
        <div>
          <dt>Students</dt>
          <dd>{facilitator.students.length}</dd>
        </div>
        <div>
          <dt>Active now</dt>
          <dd>{active}</dd>
        </div>
        <div>
          <dt>New this week</dt>
          <dd>{facilitator.newThisWeek}</dd>
        </div>
        <div>
          <dt>Weekly goal</dt>
          <dd>{facilitator.target ? `${facilitator.target} ${facilitator.targetLabel}`.trim() : "Not set"}</dd>
        </div>
      </dl>
      {editable ? (
        <ActionForm action={setFacilitatorStatusAction} success={`Saved for ${firstName(facilitator.name)}.`} className="pjdc-form">
          <input type="hidden" name="facilitatorId" value={facilitator.id} />
          <StatusChoices value={facilitator.status} />
          <SubmitButton>Save</SubmitButton>
        </ActionForm>
      ) : null}
    </>
  );
}
