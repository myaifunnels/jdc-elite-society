import {
  CalendarClock,
  CircleCheck,
  ClipboardCheck,
  Database,
  Link2,
  Plus,
  Target,
  Trash2,
  TriangleAlert,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

import {
  addChecklistItemAction,
  approveAllChecklistItemsAction,
  approveChecklistItemAction,
  assignStudentAction,
  createProjectJdcPersonAction,
  deleteChecklistItemAction,
  deleteProjectJdcPersonAction,
  loadSampleDataAction,
  removeSampleDataAction,
  renameProjectJdcPersonAction,
  saveWeeklyPlanAction,
  sendBackChecklistItemAction,
} from "@/app/dashboard/project-jdc/actions";
import { ProjectJdcPersonSearch } from "@/components/dashboard/project-jdc-person-search";
import { ActionForm, ConfirmButton, SheetButton, SubmitButton, TaskFields } from "@/components/project-jdc/pjdc-client";
import {
  categoryLabel,
  CategoryIcon,
  DueTag,
  EmptyState,
  firstName,
  PillarBoard,
  PjdcAvatar,
  ProgressBar,
  ProofView,
  shortDate,
  StatusPill,
} from "@/components/project-jdc/pjdc-ui";
import { countByPillar } from "@/lib/project-jdc-pillars";
import { PROJECT_JDC_STATUS_LABELS, PROJECT_JDC_STATUSES } from "@/lib/project-jdc-status";
import { addDaysIso, WEEK_DAYS, type ProjectJdcChecklistItem, type ProjectJdcWeeklyPlan, type WeekDay } from "@/lib/project-jdc-store";
import type { PjdcFacilitator, PjdcStudent } from "@/lib/project-jdc-view";
import type { AuthUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const DAY_NAMES: Record<WeekDay, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export function todayWeekDay(today: string): WeekDay {
  const index = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  return WEEK_DAYS[index];
}

function friendlyDate(date: string, today: string) {
  if (date === today) return "Today";
  if (date === addDaysIso(today, -1)) return "Yesterday";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "UTC" });
}

function daysSince(iso: string | null, today: string) {
  if (!iso) return null;
  const last = new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  return Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${last}T00:00:00Z`)) / 86_400_000);
}

/** Students a facilitator should look at first, with a plain reason. */
export function needsAttention(students: PjdcStudent[], today: string) {
  return students
    .filter((student) => student.status !== "completed" && student.status !== "inactive" && student.day >= 1)
    .flatMap((student) => {
      if (student.status === "at_risk") return [{ student, reason: "Marked as needing help" }];
      if (student.overdue > 0) {
        return [{ student, reason: `${student.overdue} task${student.overdue === 1 ? "" : "s"} past the deadline` }];
      }
      const gap = daysSince(student.lastCheckIn, today);
      if (gap === null && student.day > 2) return [{ student, reason: "Hasn't done a task yet" }];
      if (gap !== null && gap >= 2) return [{ student, reason: `No tasks done in ${gap} days` }];
      return [];
    })
    .slice(0, 5);
}

export function GiveTaskButton({
  students,
  today,
  label = "Give tasks",
  className = "pjdc-btn is-primary is-big is-wide",
}: {
  students: Array<{ id: string; name: string }>;
  today: string;
  label?: string;
  className?: string;
}) {
  if (students.length === 0) return null;
  return (
    <SheetButton
      title="Give tasks"
      className={className}
      label={
        <>
          <Plus aria-hidden size={20} />
          {label}
        </>
      }
    >
      <ActionForm action={addChecklistItemAction} success="Tasks sent!" className="pjdc-form" reset>
        <TaskFields students={students} today={today} />
        <SubmitButton className="pjdc-btn is-primary is-big is-wide" pendingLabel="Sending…">
          Send
        </SubmitButton>
      </ActionForm>
    </SheetButton>
  );
}

type Deadline = { key: string; label: string; category: string; dueDate: string; total: number; done: number };

/** Tasks with a deadline, grouped so "Finish your vision board" for 15 students is one row. */
function upcomingDeadlines(items: ProjectJdcChecklistItem[], today: string): Deadline[] {
  const groups = new Map<string, Deadline>();
  for (const item of items) {
    if (!item.dueDate || item.dueDate < addDaysIso(today, -7) || item.itemDate > today) continue;
    const key = `${item.dueDate}|${item.label}`;
    const group = groups.get(key) ?? { key, label: item.label, category: item.category, dueDate: item.dueDate, total: 0, done: 0 };
    group.total += 1;
    if (item.studentDone) group.done += 1;
    groups.set(key, group);
  }
  return [...groups.values()]
    .filter((group) => group.done < group.total || group.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);
}

function DeadlineList({ items, today }: { items: ProjectJdcChecklistItem[]; today: string }) {
  const deadlines = upcomingDeadlines(items, today);
  if (deadlines.length === 0) {
    return <p className="pjdc-muted">No deadlines this week. Add one when you give tasks.</p>;
  }
  return (
    <ul className="pjdc-deadlines">
      {deadlines.map((deadline) => (
        <li key={deadline.key}>
          <CategoryIcon category={deadline.category} size={18} />
          <span className="pjdc-task-text">
            <strong>{deadline.label}</strong>
            <em>
              <DueTag dueDate={deadline.dueDate} today={today} done={deadline.done === deadline.total} />
              {deadline.total > 1 ? ` · ${deadline.done} of ${deadline.total} done` : deadline.done ? " · Done" : " · Not done yet"}
            </em>
          </span>
          {deadline.total > 1 ? <ProgressBar value={deadline.done} max={deadline.total} label={`${deadline.label} progress`} /> : null}
        </li>
      ))}
    </ul>
  );
}

function lastWeek(items: ProjectJdcChecklistItem[], today: string) {
  const from = addDaysIso(today, -6);
  return items.filter((item) => item.itemDate >= from && item.itemDate <= today);
}

function StatStrip({ stats }: { stats: Array<{ label: string; value: number | string; tone?: string }> }) {
  return (
    <dl className="pjdc-stats">
      {stats.map((stat) => (
        <div key={stat.label} className={stat.tone ? `is-${stat.tone}` : undefined}>
          <dt>{stat.label}</dt>
          <dd>{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- Facilitator ---------- */

export function FacilitatorHome({
  me,
  items,
  plan,
  pending,
  today,
}: {
  me: PjdcFacilitator;
  items: ProjectJdcChecklistItem[];
  plan: ProjectJdcWeeklyPlan | null;
  pending: number;
  today: string;
}) {
  const todayPlan = plan?.days[todayWeekDay(today)] ?? "";
  const attention = needsAttention(me.students, today);
  const finishedToday = me.students.filter((student) => student.totalToday > 0 && student.doneToday === student.totalToday).length;
  const withTasksToday = me.students.filter((student) => student.totalToday > 0).length;
  const overdue = me.students.reduce((sum, student) => sum + student.overdue, 0);
  const todayItems = items.filter((item) => item.itemDate === today);

  return (
    <div className="pjdc-layout">
      <div className="pjdc-main">
        <StatStrip
          stats={[
            { label: "Students", value: me.students.length },
            { label: "Done today", value: `${todayItems.filter((item) => item.studentDone).length}/${todayItems.length}` },
            { label: "To check", value: pending, tone: pending ? "action" : undefined },
            { label: "Past deadline", value: overdue, tone: overdue ? "risk" : undefined },
          ]}
        />
        <section className={cn("pjdc-panel pjdc-callout", pending > 0 ? "is-action" : "is-calm")}>
          {pending > 0 ? (
            <>
              <ClipboardCheck aria-hidden size={30} />
              <h2>
                {pending} task{pending === 1 ? "" : "s"} to check
              </h2>
              <p>Your students finished these. Take a look!</p>
              <Link href="/dashboard/project-jdc?tab=check" className="pjdc-btn is-primary is-big is-wide">
                Check now
              </Link>
            </>
          ) : (
            <>
              <CircleCheck aria-hidden size={30} />
              <h2>All caught up!</h2>
              <p>Nothing to check right now.</p>
            </>
          )}
        </section>

        <GiveTaskButton students={me.students} today={today} />

        <section className="pjdc-panel">
          <div className="pjdc-panel-head">
            <h2>5 areas of life</h2>
            <span className="pjdc-muted pjdc-small">Your team, last 7 days</span>
          </div>
          <PillarBoard stats={countByPillar(lastWeek(items, today))} />
        </section>

        <section className="pjdc-panel">
          <div className="pjdc-panel-head">
            <h2>Needs your help</h2>
          </div>
          {attention.length === 0 ? (
            <EmptyState icon={<Users size={28} />} title="Everyone is on track">
              {me.students.length ? "Nice! No one needs extra help today." : "You don't have students yet. Your coach will add them."}
            </EmptyState>
          ) : (
            <ul className="pjdc-people">
              {attention.map(({ student, reason }) => (
                <li key={student.id}>
                  <Link href="/dashboard/project-jdc?tab=team" className="pjdc-person">
                    <PjdcAvatar name={student.name} photoUrl={student.photoUrl} status={student.status} />
                    <span>
                      <strong>{student.name}</strong>
                      <em>
                        <TriangleAlert aria-hidden size={14} /> {reason}
                      </em>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="pjdc-side">
        <section className="pjdc-panel">
          <div className="pjdc-panel-head">
            <h2>Your plan today</h2>
            <Link href="/dashboard/project-jdc?tab=week" className="pjdc-link">
              Edit
            </Link>
          </div>
          {todayPlan ? (
            <p className="pjdc-plan-today">{todayPlan}</p>
          ) : (
            <p className="pjdc-muted">
              No plan for today yet. <Link href="/dashboard/project-jdc?tab=week">Set your week</Link>
            </p>
          )}
          {me.target > 0 ? (
            <div className="pjdc-goal">
              <Target aria-hidden size={20} />
              <span>
                <strong>
                  {me.newThisWeek} of {me.target}
                </strong>{" "}
                {me.targetLabel || "goal"} this week
              </span>
              <ProgressBar value={me.newThisWeek} max={me.target} label="Weekly goal" />
            </div>
          ) : null}
        </section>

        {withTasksToday > 0 ? (
          <section className="pjdc-panel">
            <div className="pjdc-panel-head">
              <h2>Team today</h2>
              <span className="pjdc-count">
                {finishedToday}/{withTasksToday}
              </span>
            </div>
            <p className="pjdc-muted">students finished all their tasks</p>
            <ProgressBar value={finishedToday} max={withTasksToday} label="Students finished today" />
          </section>
        ) : null}

        <section className="pjdc-panel">
          <div className="pjdc-panel-head">
            <h2>
              <CalendarClock aria-hidden size={18} className="pjdc-head-icon" />
              Deadlines
            </h2>
          </div>
          <DeadlineList items={items} today={today} />
        </section>
      </div>
    </div>
  );
}

export function FacilitatorCheck({
  items,
  userById,
  today,
}: {
  items: ProjectJdcChecklistItem[];
  userById: Map<string, AuthUser>;
  today: string;
}) {
  const pending = items
    .filter((item) => item.studentDone && !item.facilitatorApproved)
    .sort((a, b) => (a.studentDoneAt ?? "").localeCompare(b.studentDoneAt ?? ""));
  const notDoneToday = items.filter((item) => item.itemDate === today && !item.studentDone);
  const late = items.filter((item) => item.dueDate && item.dueDate < today && !item.studentDone);

  return (
    <div className="pjdc-layout">
      <div className="pjdc-main">
        <section className="pjdc-panel">
          <div className="pjdc-panel-head">
            <h2>Ready to check</h2>
            {pending.length ? <span className="pjdc-count">{pending.length}</span> : null}
          </div>
          {pending.length === 0 ? (
            <EmptyState icon={<CircleCheck size={28} />} title="All caught up!">
              When a student finishes a task, it shows up here.
            </EmptyState>
          ) : (
            <>
              {pending.length > 1 ? (
                <ActionForm action={approveAllChecklistItemsAction} success={`All ${pending.length} tasks checked!`}>
                  <SubmitButton className="pjdc-btn is-primary is-big is-wide" pendingLabel="Checking…">
                    <CircleCheck aria-hidden size={20} />
                    All look good ({pending.length})
                  </SubmitButton>
                </ActionForm>
              ) : null}
              <ul className="pjdc-checks">
                {pending.map((item) => {
                  const student = userById.get(item.studentId);
                  const name = student?.name ?? "Student";
                  return (
                    <li key={item.id} className="pjdc-check">
                      <PjdcAvatar name={name} photoUrl={student?.facebookPhotoUrl} />
                      <span className="pjdc-check-text">
                        <strong>{name}</strong>
                        <span>{item.label}</span>
                        <em>
                          <CategoryIcon category={item.category} size={14} />
                          {categoryLabel(item.category)} · {friendlyDate(item.itemDate, today)}
                          {item.dueDate ? <DueTag dueDate={item.dueDate} today={today} done /> : null}
                        </em>
                      </span>
                      <ProofView proof={item.proof} />
                      <div className="pjdc-check-actions">
                        <SheetButton title={`Not yet for ${firstName(name)}`} className="pjdc-btn is-quiet" label="Not yet">
                          <p className="pjdc-muted">
                            “{item.label}” goes back on {firstName(name)}&apos;s list with your note.
                          </p>
                          <ActionForm action={sendBackChecklistItemAction} success={`Sent back to ${firstName(name)}.`} className="pjdc-form">
                            <input type="hidden" name="itemId" value={item.id} />
                            <label className="pjdc-field">
                              What should they add or fix?
                              <textarea name="note" rows={2} maxLength={300} required defaultValue="Please add a screenshot so I can check." />
                            </label>
                            <SubmitButton className="pjdc-btn is-primary is-big is-wide" pendingLabel="Sending…">
                              Send back
                            </SubmitButton>
                          </ActionForm>
                        </SheetButton>
                        <ActionForm action={approveChecklistItemAction} success={`Checked! ${firstName(name)} will see it.`}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <SubmitButton className="pjdc-btn is-good" pendingLabel="…">
                            <CircleCheck aria-hidden size={18} />
                            Looks good
                          </SubmitButton>
                        </ActionForm>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>

      <div className="pjdc-side">
        {late.length ? (
          <section className="pjdc-panel is-attention">
            <div className="pjdc-panel-head">
              <h2>Past the deadline</h2>
              <span className="pjdc-count">{late.length}</span>
            </div>
            <ul className="pjdc-tasks is-compact">
              {late.slice(0, 8).map((item) => (
                <li key={item.id} className="pjdc-task">
                  <CategoryIcon category={item.category} />
                  <span className="pjdc-task-text">
                    <strong>{item.label}</strong>
                    <em>{userById.get(item.studentId)?.name ?? "Student"}</em>
                  </span>
                  <DueTag dueDate={item.dueDate} today={today} />
                </li>
              ))}
            </ul>
            {late.length > 8 ? <p className="pjdc-muted pjdc-small">and {late.length - 8} more</p> : null}
          </section>
        ) : null}

        <section className="pjdc-panel">
          <div className="pjdc-panel-head">
            <h2>Still working on it today</h2>
            {notDoneToday.length ? <span className="pjdc-count">{notDoneToday.length}</span> : null}
          </div>
          {notDoneToday.length === 0 ? (
            <p className="pjdc-muted">No open tasks for today.</p>
          ) : (
            <ul className="pjdc-tasks is-compact">
              {notDoneToday.slice(0, 10).map((item) => {
                const name = userById.get(item.studentId)?.name ?? "Student";
                return (
                  <li key={item.id} className="pjdc-task">
                    <CategoryIcon category={item.category} />
                    <span className="pjdc-task-text">
                      <strong>{item.label}</strong>
                      <em>{name}</em>
                    </span>
                    <ActionForm action={deleteChecklistItemAction} success="Task removed.">
                      <input type="hidden" name="itemId" value={item.id} />
                      <ConfirmButton
                        className="pjdc-icon-btn"
                        label={<Trash2 aria-label="Remove task" size={18} />}
                        title="Remove this task?"
                        message={`"${item.label}" will be taken off ${firstName(name)}'s list.`}
                        confirmLabel="Yes, remove it"
                      />
                    </ActionForm>
                  </li>
                );
              })}
            </ul>
          )}
          {notDoneToday.length > 10 ? <p className="pjdc-muted pjdc-small">and {notDoneToday.length - 10} more</p> : null}
        </section>
      </div>
    </div>
  );
}

export function FacilitatorWeek({
  plan,
  weekStart,
  today,
}: {
  plan: ProjectJdcWeeklyPlan | null;
  weekStart: string;
  today: string;
}) {
  const todayKey = todayWeekDay(today);
  return (
    <ActionForm action={saveWeeklyPlanAction} success="Your week is saved!" className="pjdc-layout is-week">
      <input type="hidden" name="weekStart" value={weekStart} />
      <section className="pjdc-panel pjdc-side">
        <div className="pjdc-panel-head">
          <h2>Your goal this week</h2>
        </div>
        <div className="pjdc-goal-fields">
          <label className="pjdc-field is-number">
            How many?
            <input type="number" inputMode="numeric" min={0} max={999} name="targetCount" defaultValue={plan?.targetCount ?? 0} />
          </label>
          <label className="pjdc-field">
            Of what?
            <input type="text" name="targetLabel" defaultValue={plan?.targetLabel ?? ""} placeholder="e.g. new Elite members" />
          </label>
        </div>
      </section>

      <section className="pjdc-panel pjdc-main">
        <div className="pjdc-panel-head">
          <h2>What you will do each day</h2>
        </div>
        <div className="pjdc-week">
          {WEEK_DAYS.map((day) => (
            <label key={day} className={cn("pjdc-field pjdc-weekday", day === todayKey && "is-today")}>
              <span>
                {DAY_NAMES[day]}
                {day === todayKey ? <i className="pjdc-you">Today</i> : null}
              </span>
              <input type="text" name={`day_${day}`} defaultValue={plan?.days[day] ?? ""} placeholder="e.g. 10K steps, 2 posts" />
            </label>
          ))}
        </div>
      </section>

      <div className="pjdc-sticky-save">
        <SubmitButton className="pjdc-btn is-primary is-big is-wide">Save my week</SubmitButton>
      </div>
    </ActionForm>
  );
}

/* ---------- Admin ---------- */

function SampleDataPanel({ sampleCount, facilitatorCount }: { sampleCount: number; facilitatorCount: number }) {
  return (
    <section className="pjdc-panel pjdc-sample">
      <div className="pjdc-panel-head">
        <h2>
          <Database aria-hidden size={18} className="pjdc-head-icon" />
          Sample data
        </h2>
        {sampleCount ? <span className="pjdc-count">{sampleCount}</span> : null}
      </div>
      {sampleCount ? (
        <>
          <p className="pjdc-muted">
            {sampleCount} contacts are practice students with 2 weeks of tasks and proof. Real students are not affected.
          </p>
          <ActionForm action={removeSampleDataAction} success="Sample data removed.">
            <ConfirmButton
              className="pjdc-btn is-danger-quiet is-wide"
              label={
                <>
                  <Trash2 aria-hidden size={18} />
                  Remove sample data
                </>
              }
              title="Remove all sample data?"
              message="The practice students and their tasks will be deleted. The contacts themselves stay in your CRM."
              confirmLabel="Yes, remove"
            />
          </ActionForm>
        </>
      ) : (
        <>
          <p className="pjdc-muted">
            Give each facilitator 15 contacts as practice students, with 2 weeks of tasks in all 5 areas, proof and deadlines.
          </p>
          <ActionForm action={loadSampleDataAction} success="Sample students added!">
            <SubmitButton className="pjdc-btn is-secondary is-wide" pendingLabel="Adding sample data…" disabled={facilitatorCount === 0}>
              Load sample data
            </SubmitButton>
          </ActionForm>
          {facilitatorCount === 0 ? <p className="pjdc-muted pjdc-small">Add a facilitator first.</p> : null}
        </>
      )}
    </section>
  );
}

export function AdminHome({
  facilitators,
  students,
  items,
  unassignedCount,
  sampleCount,
  today,
}: {
  facilitators: PjdcFacilitator[];
  students: PjdcStudent[];
  items: ProjectJdcChecklistItem[];
  unassignedCount: number;
  sampleCount: number;
  today: string;
}) {
  const total = students.length;
  const attention = needsAttention(students, today);
  const pending = items.filter((item) => item.studentDone && !item.facilitatorApproved).length;
  const overdue = students.reduce((sum, student) => sum + student.overdue, 0);
  const todayItems = items.filter((item) => item.itemDate === today);

  return (
    <div className="pjdc-layout">
      <div className="pjdc-main">
        <StatStrip
          stats={[
            { label: "Students", value: total },
            { label: "Done today", value: `${todayItems.filter((item) => item.studentDone).length}/${todayItems.length}` },
            { label: "Waiting for check", value: pending, tone: pending ? "action" : undefined },
            { label: "Past deadline", value: overdue, tone: overdue ? "risk" : undefined },
          ]}
        />

        <section className="pjdc-panel">
          <div className="pjdc-panel-head">
            <h2>5 areas of life</h2>
            <span className="pjdc-muted pjdc-small">Everyone, last 7 days</span>
          </div>
          <PillarBoard stats={countByPillar(lastWeek(items, today))} />
        </section>

        <section className="pjdc-panel">
          <div className="pjdc-panel-head">
            <h2>All students</h2>
            <span className="pjdc-count">{total}</span>
          </div>
          {total === 0 ? (
            <p className="pjdc-muted">No students in the program yet.</p>
          ) : (
            <>
              <div className="pjdc-split" aria-hidden>
                {PROJECT_JDC_STATUSES.map((status) => {
                  const count = students.filter((student) => student.status === status).length;
                  return count ? <span key={status} className={`is-${status}`} style={{ flexGrow: count }} /> : null;
                })}
              </div>
              <ul className="pjdc-split-legend">
                {PROJECT_JDC_STATUSES.map((status) => (
                  <li key={status} className={`is-${status}`}>
                    <strong>{students.filter((student) => student.status === status).length}</strong>
                    {PROJECT_JDC_STATUS_LABELS[status]}
                  </li>
                ))}
              </ul>
            </>
          )}
          {unassignedCount > 0 ? (
            <Link href="/dashboard/project-jdc?tab=people" className="pjdc-notice">
              <Link2 aria-hidden size={18} />
              {unassignedCount} student{unassignedCount === 1 ? " is" : "s are"} waiting for a facilitator
            </Link>
          ) : null}
        </section>

        <section className="pjdc-panel">
          <div className="pjdc-panel-head">
            <h2>Needs help</h2>
            <Link href="/dashboard/project-jdc?tab=team" className="pjdc-link">
              Open team
            </Link>
          </div>
          {attention.length === 0 ? (
            <p className="pjdc-muted">Everyone is on track.</p>
          ) : (
            <ul className="pjdc-people">
              {attention.map(({ student, reason }) => (
                <li key={student.id} className="pjdc-person">
                  <PjdcAvatar name={student.name} photoUrl={student.photoUrl} status={student.status} />
                  <span>
                    <strong>{student.name}</strong>
                    <em>
                      <TriangleAlert aria-hidden size={14} /> {reason}
                    </em>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="pjdc-side">
        <section className="pjdc-panel">
          <div className="pjdc-panel-head">
            <h2>Facilitators this week</h2>
            <Link href="/dashboard/project-jdc?tab=week" className="pjdc-link">
              See plans
            </Link>
          </div>
          {facilitators.length === 0 ? (
            <p className="pjdc-muted">No facilitators yet.</p>
          ) : (
            <ul className="pjdc-people">
              {facilitators.map((facilitator) => (
                <li key={facilitator.id} className="pjdc-person">
                  <PjdcAvatar name={facilitator.name} photoUrl={facilitator.photoUrl} status={facilitator.status} />
                  <span>
                    <strong>{facilitator.name}</strong>
                    {facilitator.target > 0 ? (
                      <>
                        <ProgressBar value={facilitator.newThisWeek} max={facilitator.target} label={`${facilitator.name} weekly goal`} />
                        <em>
                          {facilitator.newThisWeek} of {facilitator.target} {facilitator.targetLabel}
                        </em>
                      </>
                    ) : (
                      <em>No goal set · {facilitator.students.length} students</em>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <SampleDataPanel sampleCount={sampleCount} facilitatorCount={facilitators.length} />
      </div>
    </div>
  );
}

export function AdminPeople({
  users,
  students,
  today,
}: {
  users: AuthUser[];
  students: PjdcStudent[];
  today: string;
}) {
  const facilitators = users.filter((user) => user.role === "facilitator");
  const studentUsers = users.filter((user) => user.role === "student");
  const googleUsers = users
    .filter((user) => user.googleId && user.role !== "admin")
    .map((user) => ({ id: user.id, name: user.name, email: user.email }));
  const facilitatorOf = new Map(students.map((student) => [student.id, student.facilitatorId]));
  const nameById = new Map(users.map((user) => [user.id, user.name]));
  const people = [...facilitators, ...studentUsers];

  return (
    <div className="pjdc-stack">
      <div className="pjdc-actions-row">
        <SheetButton
          title="Add a person"
          className="pjdc-btn is-primary is-big"
          label={
            <>
              <UserPlus aria-hidden size={20} />
              Add a person
            </>
          }
        >
          <ActionForm action={createProjectJdcPersonAction} success="Added! They'll get an email to set a password." className="pjdc-form">
            <fieldset className="pjdc-role-pick">
              <legend>They are a…</legend>
              <label>
                <input type="radio" name="role" value="student" defaultChecked />
                <span>Student</span>
              </label>
              <label>
                <input type="radio" name="role" value="facilitator" />
                <span>Facilitator</span>
              </label>
            </fieldset>
            <ProjectJdcPersonSearch namePlaceholder="Full name" candidates={googleUsers} />
            <SubmitButton className="pjdc-btn is-primary is-big is-wide">Add</SubmitButton>
          </ActionForm>
        </SheetButton>

        <SheetButton
          title="Give a student a facilitator"
          className="pjdc-btn is-secondary is-big"
          label={
            <>
              <Link2 aria-hidden size={20} />
              Assign
            </>
          }
        >
          <ActionForm action={assignStudentAction} success="Done! The student's 30 days start on that date." className="pjdc-form">
            <label className="pjdc-field">
              Student
              <select name="studentId" required defaultValue="">
                <option value="" disabled>
                  Choose a student
                </option>
                {studentUsers.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                    {facilitatorOf.has(student.id) ? ` (with ${firstName(nameById.get(facilitatorOf.get(student.id)!) ?? "")})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="pjdc-field">
              Facilitator
              <select name="facilitatorId" required defaultValue="">
                <option value="" disabled>
                  Choose a facilitator
                </option>
                {facilitators.map((facilitator) => (
                  <option key={facilitator.id} value={facilitator.id}>
                    {facilitator.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="pjdc-field">
              Day 1 is on
              <input type="date" name="startDate" defaultValue={today} required />
            </label>
            <SubmitButton className="pjdc-btn is-primary is-big is-wide">Assign</SubmitButton>
          </ActionForm>
        </SheetButton>
      </div>

      <section className="pjdc-panel">
        <div className="pjdc-panel-head">
          <h2>Everyone</h2>
          <span className="pjdc-count">{people.length}</span>
        </div>
        {people.length === 0 ? (
          <EmptyState icon={<Users size={28} />} title="No one yet">
            Tap “Add a person” to start.
          </EmptyState>
        ) : (
          <ul className="pjdc-people is-two-col">
            {people.map((person) => {
              const coach = facilitatorOf.get(person.id);
              return (
                <li key={person.id} className="pjdc-person">
                  <PjdcAvatar name={person.name} photoUrl={person.facebookPhotoUrl} />
                  <span>
                    <strong>{person.name}</strong>
                    <em>
                      {person.role === "facilitator"
                        ? "Facilitator"
                        : coach
                          ? `Student · with ${firstName(nameById.get(coach) ?? "")}`
                          : "Student · no facilitator yet"}
                    </em>
                  </span>
                  <SheetButton title={`Edit ${firstName(person.name)}`} className="pjdc-btn is-quiet" label="Edit">
                    <div className="pjdc-profile">
                      <PjdcAvatar name={person.name} photoUrl={person.facebookPhotoUrl} size="xl" />
                      <p className="pjdc-muted">{person.email.endsWith("@ghl.invalid") ? "No email" : person.email}</p>
                    </div>
                    <ActionForm action={renameProjectJdcPersonAction} success="Name saved." className="pjdc-form">
                      <input type="hidden" name="userId" value={person.id} />
                      <label className="pjdc-field">
                        Name
                        <input type="text" name="name" defaultValue={person.name} required />
                      </label>
                      <SubmitButton className="pjdc-btn is-primary is-big is-wide">Save name</SubmitButton>
                    </ActionForm>
                    <ActionForm action={deleteProjectJdcPersonAction} success={`${firstName(person.name)} was removed.`} className="pjdc-form">
                      <input type="hidden" name="userId" value={person.id} />
                      <ConfirmButton
                        className="pjdc-btn is-danger-quiet is-wide"
                        label={
                          <>
                            <Trash2 aria-hidden size={18} />
                            Remove {firstName(person.name)}
                          </>
                        }
                        title={`Remove ${person.name}?`}
                        message="Their account and Project JDC progress will be deleted. This can't be undone."
                        confirmLabel="Yes, remove"
                      />
                    </ActionForm>
                  </SheetButton>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export function AdminWeek({
  facilitators,
  plans,
  today,
}: {
  facilitators: PjdcFacilitator[];
  plans: Map<string, ProjectJdcWeeklyPlan>;
  today: string;
}) {
  const todayKey = todayWeekDay(today);
  if (facilitators.length === 0) {
    return (
      <EmptyState icon={<Users size={28} />} title="No facilitators yet">
        Add one in the People tab.
      </EmptyState>
    );
  }

  return (
    <div className="pjdc-stack pjdc-cards">
      {facilitators.map((facilitator) => {
        const plan = plans.get(facilitator.id);
        const days = WEEK_DAYS.filter((day) => plan?.days[day]);
        return (
          <section key={facilitator.id} className="pjdc-panel">
            <div className="pjdc-person">
              <PjdcAvatar name={facilitator.name} photoUrl={facilitator.photoUrl} status={facilitator.status} />
              <span>
                <strong>{facilitator.name}</strong>
                <em>
                  {facilitator.target > 0
                    ? `${facilitator.newThisWeek} of ${facilitator.target} ${facilitator.targetLabel}`.trim()
                    : "No goal set yet"}
                </em>
              </span>
              <StatusPill status={facilitator.status} />
            </div>
            {facilitator.target > 0 ? (
              <ProgressBar value={facilitator.newThisWeek} max={facilitator.target} label={`${facilitator.name} weekly goal`} />
            ) : null}
            {days.length ? (
              <ul className="pjdc-plan">
                {days.map((day) => (
                  <li key={day} className={cn(day === todayKey && "is-today")}>
                    <strong>{DAY_NAMES[day].slice(0, 3)}</strong>
                    <span>{plan?.days[day]}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pjdc-muted">No daily plan yet.</p>
            )}
            <p className="pjdc-muted pjdc-small">Last check-in by their students: {shortDate(facilitator.students.map((s) => s.lastCheckIn).filter(Boolean).sort().pop() ?? null)}</p>
          </section>
        );
      })}
    </div>
  );
}
