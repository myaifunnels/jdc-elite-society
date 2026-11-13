"use client";

import { ChevronDown, Flame, Maximize2, Minus, Plus, TriangleAlert, Users } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { firstName, PjdcAvatar, ProgressBar } from "@/components/project-jdc/pjdc-ui";
import type { PjdcFacilitator, PjdcPerson, PjdcStudent } from "@/lib/project-jdc-view";
import { cn } from "@/lib/utils";

export type GenealogyBranch = { facilitator: PjdcFacilitator; students: PjdcStudent[] };

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.6;
const PROGRAM_DAYS = 30;

function dayText(day: number) {
  if (day < 1) return "Starts soon";
  if (day > PROGRAM_DAYS) return "Finished";
  return `Day ${day}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * The network as a family tree you can pan, zoom and fold:
 * JDC Elite Society (generation 0) → facilitators (generation 1) → students (generation 2).
 */
export function PjdcGenealogy({
  branches,
  unassigned,
  totals,
  viewerId,
  forceOpen,
  onSelectStudent,
  onSelectFacilitator,
}: {
  branches: GenealogyBranch[];
  unassigned: PjdcPerson[];
  totals: { facilitators: number; students: number };
  viewerId: string;
  /** Searching or filtering opens every branch so matches are never hidden. */
  forceOpen: boolean;
  onSelectStudent: (student: PjdcStudent) => void;
  onSelectFacilitator: (facilitator: PjdcFacilitator) => void;
}) {
  const viewerBranch = branches.find(
    ({ facilitator }) => facilitator.id === viewerId || facilitator.students.some((student) => student.id === viewerId),
  );
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(viewerBranch ? [viewerBranch.facilitator.id] : branches.length <= 3 ? branches.map((b) => b.facilitator.id) : []),
  );
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [grabbing, setGrabbing] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);

  const fit = useCallback(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const k = clamp(Math.min(1, (canvas.clientWidth - 24) / stage.offsetWidth), MIN_ZOOM, 1);
    setView({ k, x: Math.max(12, (canvas.clientWidth - stage.offsetWidth * k) / 2), y: 12 });
  }, []);

  useLayoutEffect(() => {
    fit();
  }, [fit]);

  // Re-centre when the layout changes size (open/close, search, window resize).
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return;
    let first = true;
    const observer = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      fit();
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [fit]);

  function zoomTo(next: number, around?: { x: number; y: number }, relative = false) {
    setView((current) => {
      const k = clamp(relative ? current.k * next : next, MIN_ZOOM, MAX_ZOOM);
      const canvas = canvasRef.current;
      const point = around ?? { x: (canvas?.clientWidth ?? 0) / 2, y: (canvas?.clientHeight ?? 0) / 2 };
      const ratio = k / current.k;
      return { k, x: point.x - (point.x - current.x) * ratio, y: point.y - (point.y - current.y) * ratio };
    });
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    drag.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, originX: view.x, originY: view.y, moved: false };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    if (!current.moved && Math.hypot(dx, dy) < 5) return;
    if (!current.moved) {
      current.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setGrabbing(true);
    }
    setView((v) => ({ ...v, x: current.originX + dx, y: current.originY + dy }));
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    if (current.moved) {
      justDragged.current = true;
      setTimeout(() => (justDragged.current = false), 0);
    }
    drag.current = null;
    setGrabbing(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    const step = 60;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    if (event.key in moves) {
      event.preventDefault();
      const [dx, dy] = moves[event.key];
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
    } else if (event.key === "+" || event.key === "=") zoomTo(view.k * 1.15);
    else if (event.key === "-") zoomTo(view.k / 1.15);
    else if (event.key === "0") fit();
  }

  // Ctrl/Cmd + scroll zooms toward the pointer; plain scroll still scrolls the page.
  const zoomRef = useRef(zoomTo);
  useEffect(() => {
    zoomRef.current = zoomTo;
  });
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function onWheel(event: WheelEvent) {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const rect = canvas!.getBoundingClientRect();
      zoomRef.current(event.deltaY < 0 ? 1.1 : 1 / 1.1, { x: event.clientX - rect.left, y: event.clientY - rect.top }, true);
    }
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  function toggle(id: string) {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const isOpen = (id: string) => forceOpen || open.has(id);
  const allOpen = branches.every(({ facilitator }) => isOpen(facilitator.id));

  return (
    <div className="pjdc-geo">
      <div className="pjdc-geo-bar" role="toolbar" aria-label="Genealogy view">
        <button type="button" className="pjdc-btn is-quiet" onClick={() => setOpen(new Set(allOpen ? [] : branches.map((b) => b.facilitator.id)))} disabled={forceOpen}>
          {allOpen ? "Fold all" : "Open all"}
        </button>
        <span className="pjdc-geo-zoom">
          <button type="button" className="pjdc-icon-btn" aria-label="Zoom out" onClick={() => zoomTo(view.k / 1.2)}>
            <Minus aria-hidden size={16} />
          </button>
          <output aria-label="Zoom level">{Math.round(view.k * 100)}%</output>
          <button type="button" className="pjdc-icon-btn" aria-label="Zoom in" onClick={() => zoomTo(view.k * 1.2)}>
            <Plus aria-hidden size={16} />
          </button>
          <button type="button" className="pjdc-icon-btn" aria-label="Fit everything on screen" onClick={fit}>
            <Maximize2 aria-hidden size={16} />
          </button>
        </span>
      </div>

      <div
        ref={canvasRef}
        className={cn("pjdc-geo-canvas", grabbing && "is-grabbing")}
        tabIndex={0}
        role="group"
        aria-label="Genealogy tree. Drag to move, use the buttons to zoom."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        onClickCapture={(event) => {
          if (justDragged.current) {
            event.stopPropagation();
            event.preventDefault();
          }
        }}
      >
        <div ref={stageRef} className="pjdc-geo-stage" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
          <ul className="pjdc-g">
            <li>
              <div className="pjdc-g-root">
                <span className="pjdc-g-logo">
                  <Image src="/brand/jdc-elite-society-logo-stacked.webp" alt="" width={56} height={56} />
                </span>
                <span>
                  <strong>JDC Elite Society</strong>
                  <em>
                    {totals.facilitators} facilitator{totals.facilitators === 1 ? "" : "s"} · {totals.students} student
                    {totals.students === 1 ? "" : "s"}
                  </em>
                </span>
                <b className="pjdc-g-gen">Gen 0</b>
              </div>

              {branches.length || unassigned.length ? (
                <ul>
                  {branches.map(({ facilitator, students }) => {
                    const expanded = isOpen(facilitator.id);
                    const members = facilitator.students;
                    const active = members.filter((s) => s.status === "active").length;
                    const risk = members.filter((s) => s.status === "at_risk" || s.status === "inactive").length;
                    const overdue = members.reduce((sum, s) => sum + s.overdue, 0);
                    const panelId = `pjdc-g-${facilitator.id}`;
                    return (
                      <li key={facilitator.id}>
                        <div className={cn("pjdc-g-fac", facilitator.id === viewerId && "is-you")}>
                          <button type="button" className="pjdc-g-main" onClick={() => onSelectFacilitator(facilitator)}>
                            <PjdcAvatar name={facilitator.name} photoUrl={facilitator.photoUrl} status={facilitator.status} size="lg" />
                            <span className="pjdc-g-text">
                              <strong>
                                {facilitator.name}
                                {facilitator.id === viewerId ? <i className="pjdc-you">You</i> : null}
                              </strong>
                              <em>Facilitator</em>
                            </span>
                            <b className="pjdc-g-gen">Gen 1</b>
                          </button>
                          <dl className="pjdc-g-stats">
                            <div>
                              <dt>
                                <Users aria-hidden size={12} /> Team
                              </dt>
                              <dd>{members.length}</dd>
                            </div>
                            <div>
                              <dt>Active</dt>
                              <dd>{members.length ? `${Math.round((active / members.length) * 100)}%` : "–"}</dd>
                            </div>
                            <div className={cn(risk > 0 && "is-warn")}>
                              <dt>Need help</dt>
                              <dd>{risk}</dd>
                            </div>
                          </dl>
                          {facilitator.target > 0 ? (
                            <span className="pjdc-g-goal">
                              <ProgressBar value={facilitator.newThisWeek} max={facilitator.target} label="Weekly goal" />
                              <small>
                                {facilitator.newThisWeek}/{facilitator.target} this week
                              </small>
                            </span>
                          ) : null}
                          {overdue > 0 ? (
                            <span className="pjdc-g-late">
                              <TriangleAlert aria-hidden size={13} /> {overdue} late task{overdue === 1 ? "" : "s"} on this team
                            </span>
                          ) : null}
                          {members.length > 0 ? (
                            <button
                              type="button"
                              className="pjdc-g-fold"
                              aria-expanded={expanded}
                              aria-controls={panelId}
                              disabled={forceOpen}
                              onClick={() => toggle(facilitator.id)}
                            >
                              <span className="pjdc-avatar-stack" aria-hidden>
                                {members.slice(0, 3).map((student) => (
                                  <PjdcAvatar key={student.id} name={student.name} photoUrl={student.photoUrl} size="sm" />
                                ))}
                              </span>
                              {expanded ? "Fold" : `Show ${members.length}`}
                              <ChevronDown aria-hidden size={16} />
                            </button>
                          ) : null}
                        </div>

                        {expanded ? (
                          <div id={panelId} className="pjdc-g-stack">
                            {students.length === 0 ? (
                              <p className="pjdc-g-empty">No students here yet.</p>
                            ) : (
                              students.map((student) => (
                                <button
                                  key={student.id}
                                  type="button"
                                  className={cn("pjdc-g-leaf", `is-${student.status}`, student.id === viewerId && "is-you")}
                                  onClick={() => onSelectStudent(student)}
                                >
                                  <PjdcAvatar name={student.name} photoUrl={student.photoUrl} status={student.status} size="md" />
                                  <span className="pjdc-g-text">
                                    <strong>{student.id === viewerId ? "You" : firstName(student.name)}</strong>
                                    <em>
                                      {dayText(student.day)}
                                      {student.overdue > 0 ? ` · ${student.overdue} late` : ""}
                                    </em>
                                  </span>
                                  {student.streak > 1 ? (
                                    <span className="pjdc-leaf-streak">
                                      <Flame aria-hidden size={12} />
                                      {student.streak}
                                    </span>
                                  ) : null}
                                </button>
                              ))
                            )}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}

                  {unassigned.length > 0 && !forceOpen ? (
                    <li>
                      <div className="pjdc-g-fac is-waiting">
                        <span className="pjdc-g-text">
                          <strong>Waiting for a facilitator</strong>
                          <em>{unassigned.length} not assigned yet</em>
                        </span>
                      </div>
                      <div className="pjdc-g-stack">
                        {unassigned.map((person) => (
                          <span key={person.id} className="pjdc-g-leaf is-static">
                            <PjdcAvatar name={person.name} photoUrl={person.photoUrl} size="md" />
                            <span className="pjdc-g-text">
                              <strong>{firstName(person.name)}</strong>
                              <em>Not assigned</em>
                            </span>
                          </span>
                        ))}
                      </div>
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </li>
          </ul>
        </div>
      </div>
      <p className="pjdc-geo-hint">Drag to move around · Tap anyone for details · Ctrl + scroll to zoom</p>
    </div>
  );
}
