import { CalendarCheck, CircleCheck, Clock, Flame, ListChecks, MessageCircle, PartyPopper, Sun } from "lucide-react";

import { markChecklistItemDoneAction } from "@/app/dashboard/project-jdc/actions";
import { ActionForm, ProofFields, SheetButton, SubmitButton } from "@/components/project-jdc/pjdc-client";
import { categoryLabel, CategoryIcon, DueTag, EmptyState, PillarBoard, ProgressBar } from "@/components/project-jdc/pjdc-ui";
import { countByPillar } from "@/lib/project-jdc-pillars";
import { addDaysIso, type ProjectJdcChecklistItem } from "@/lib/project-jdc-store";
import { isOverdue, PROGRAM_DAYS, type PjdcStudent } from "@/lib/project-jdc-view";
import { cn } from "@/lib/utils";

function TaskState({ item }: { item: ProjectJdcChecklistItem }) {
  if (item.facilitatorApproved) {
    return (
      <span className="pjdc-task-state is-approved">
        <CircleCheck aria-hidden size={18} />
        Checked!
      </span>
    );
  }
  if (item.studentDone) {
    return (
      <span className="pjdc-task-state is-waiting">
        <Clock aria-hidden size={18} />
        Waiting for check
      </span>
    );
  }
  return null;
}

function StudentTask({ item, today }: { item: ProjectJdcChecklistItem; today: string }) {
  return (
    <li className={cn("pjdc-task", item.studentDone && "is-done", isOverdue(item, today) && "is-late")}>
      <CategoryIcon category={item.category} />
      <span className="pjdc-task-text">
        <strong>{item.label}</strong>
        <em>
          {categoryLabel(item.category)}
          <DueTag dueDate={item.dueDate} today={today} done={item.studentDone} />
        </em>
      </span>
      {item.reviewNote && !item.studentDone ? (
        <p className="pjdc-review-note">
          <MessageCircle aria-hidden size={16} />
          <span>
            <b>Your facilitator says:</b> {item.reviewNote}
          </span>
        </p>
      ) : null}
      {item.studentDone ? (
        <TaskState item={item} />
      ) : (
        <SheetButton title="Show what you did" className="pjdc-btn is-primary is-big" label={item.reviewNote ? "Send again" : "I did it!"}>
          <div className="pjdc-sheet-task">
            <CategoryIcon category={item.category} />
            <strong>{item.label}</strong>
          </div>
          <ActionForm action={markChecklistItemDoneAction} success="Great job! Your facilitator will check it." className="pjdc-form">
            <input type="hidden" name="itemId" value={item.id} />
            <ProofFields />
            <SubmitButton className="pjdc-btn is-primary is-big is-wide" pendingLabel="Sending…">
              Send to my facilitator
            </SubmitButton>
          </ActionForm>
        </SheetButton>
      )}
    </li>
  );
}

export function StudentToday({
  student,
  items,
  today,
}: {
  student: PjdcStudent | null;
  items: ProjectJdcChecklistItem[];
  today: string;
}) {
  const todayItems = items.filter((item) => item.itemDate === today);
  // Earlier tasks still open because they have a deadline or were sent back.
  const carried = items
    .filter((item) => item.itemDate < today && !item.studentDone && (item.dueDate || item.reviewNote))
    .sort((a, b) => (a.dueDate ?? a.itemDate).localeCompare(b.dueDate ?? b.itemDate));
  const done = todayItems.filter((item) => item.studentDone).length;
  const allDone = todayItems.length > 0 && done === todayItems.length && carried.length === 0;

  return (
    <div className="pjdc-layout">
      <div className="pjdc-side">
        {student && student.day >= 1 ? (
          <section className="pjdc-panel pjdc-dayline">
            <h2>
              Day {Math.min(student.day, PROGRAM_DAYS)} <span>of {PROGRAM_DAYS}</span>
            </h2>
            <ProgressBar value={Math.min(student.day, PROGRAM_DAYS)} max={PROGRAM_DAYS} label="Program progress" />
            {student.streak > 0 ? (
              <p className="pjdc-streak">
                <Flame aria-hidden size={18} />
                {student.streak} day{student.streak === 1 ? "" : "s"} in a row. Don&apos;t break it!
              </p>
            ) : null}
          </section>
        ) : null}
        {student ? (
          <section className="pjdc-panel">
            <div className="pjdc-panel-head">
              <h2>Your 5 areas</h2>
            </div>
            <PillarBoard stats={student.pillars} compact />
          </section>
        ) : null}
      </div>

      <div className="pjdc-main">
        {allDone ? (
          <section className="pjdc-panel pjdc-celebrate">
            <PartyPopper aria-hidden size={36} />
            <h2>You finished everything today!</h2>
            <p>Amazing work. Come back tomorrow for new tasks.</p>
          </section>
        ) : null}

        {carried.length ? (
          <section className="pjdc-panel is-attention">
            <div className="pjdc-panel-head">
              <h2>Still to finish</h2>
              <span className="pjdc-count">{carried.length}</span>
            </div>
            <ul className="pjdc-tasks">
              {carried.map((item) => (
                <StudentTask key={item.id} item={item} today={today} />
              ))}
            </ul>
          </section>
        ) : null}

        <section className="pjdc-panel">
          <div className="pjdc-panel-head">
            <h2>Your tasks today</h2>
            {todayItems.length ? (
              <span className="pjdc-count">
                {done}/{todayItems.length}
              </span>
            ) : null}
          </div>
          {todayItems.length === 0 ? (
            <EmptyState icon={<Sun size={28} />} title="No tasks yet today">
              Your facilitator will add them soon. Check back later!
            </EmptyState>
          ) : (
            <ul className="pjdc-tasks">
              {todayItems.map((item) => (
                <StudentTask key={item.id} item={item} today={today} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

type DayState = "future" | "today" | "all" | "some" | "missed" | "rest";

export function StudentJourney({
  student,
  items,
  today,
}: {
  student: PjdcStudent | null;
  items: ProjectJdcChecklistItem[];
  today: string;
}) {
  if (!student) {
    return (
      <EmptyState icon={<CalendarCheck size={28} />} title="Your 30 days haven't started yet">
        Your coach will add you to a facilitator soon.
      </EmptyState>
    );
  }

  const byDate = new Map<string, ProjectJdcChecklistItem[]>();
  for (const item of items) {
    const list = byDate.get(item.itemDate) ?? [];
    list.push(item);
    byDate.set(item.itemDate, list);
  }

  const days = Array.from({ length: PROGRAM_DAYS }, (_, index) => {
    const date = addDaysIso(student.startDate, index);
    const list = byDate.get(date) ?? [];
    const done = list.filter((item) => item.studentDone).length;
    let state: DayState;
    if (date > today) state = "future";
    else if (list.length > 0 && done === list.length) state = "all";
    else if (done > 0) state = "some";
    else if (date === today) state = "today";
    else if (list.length > 0) state = "missed";
    else state = "rest";
    return { number: index + 1, date, state, isToday: date === today };
  });

  const approved = items.filter((item) => item.facilitatorApproved).length;
  const recent = items.filter((item) => item.itemDate <= today).slice(0, 12);
  const weekStats = countByPillar(items.filter((item) => item.itemDate <= today && item.itemDate > addDaysIso(today, -7)));

  return (
    <div className="pjdc-layout">
      <div className="pjdc-side">
        <section className="pjdc-panel pjdc-tally">
          <div>
            <Flame aria-hidden size={22} />
            <strong>{student.streak}</strong>
            <span>days in a row</span>
          </div>
          <div>
            <ListChecks aria-hidden size={22} />
            <strong>{student.tasksDone}</strong>
            <span>tasks done</span>
          </div>
          <div>
            <CircleCheck aria-hidden size={22} />
            <strong>{approved}</strong>
            <span>checked by facilitator</span>
          </div>
        </section>
      </div>

      <div className="pjdc-main">
        <section className="pjdc-panel">
          <div className="pjdc-panel-head">
            <h2>Your 5 areas this week</h2>
          </div>
          <PillarBoard stats={weekStats} />
        </section>

        <section className="pjdc-panel">
          <div className="pjdc-panel-head">
            <h2>Your 30 days</h2>
          </div>
          <ol className="pjdc-journey" aria-label="Your 30 days">
            {days.map((day) => (
              <li
                key={day.number}
                className={cn("pjdc-day", `is-${day.state}`, day.isToday && "is-now")}
                aria-label={`Day ${day.number}: ${
                  {
                    future: "coming up",
                    today: "today",
                    all: "all done",
                    some: "some done",
                    missed: "missed",
                    rest: "no tasks",
                  }[day.state]
                }`}
              >
                {day.state === "all" ? <CircleCheck aria-hidden size={16} /> : day.number}
              </li>
            ))}
          </ol>
          <ul className="pjdc-legend" aria-hidden>
            <li className="is-all">All done</li>
            <li className="is-some">Some done</li>
            <li className="is-missed">Missed</li>
            <li className="is-future">Coming up</li>
          </ul>
        </section>

        <section className="pjdc-panel">
          <div className="pjdc-panel-head">
            <h2>What you did</h2>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={<ListChecks size={28} />} title="Nothing yet">
              Your finished tasks will show up here.
            </EmptyState>
          ) : (
            <ul className="pjdc-tasks is-compact">
              {recent.map((item) => (
                <li key={item.id} className={cn("pjdc-task", item.studentDone && "is-done")}>
                  <CategoryIcon category={item.category} />
                  <span className="pjdc-task-text">
                    <strong>{item.label}</strong>
                    <em>
                      {item.itemDate === today
                        ? "Today"
                        : new Date(`${item.itemDate}T00:00:00Z`).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "UTC" })}
                      {" · "}
                      {categoryLabel(item.category)}
                    </em>
                  </span>
                  {item.studentDone ? <TaskState item={item} /> : <span className="pjdc-task-state">Not done</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
