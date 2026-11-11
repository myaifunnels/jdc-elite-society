import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProjectJdcPersonSearch } from "@/components/dashboard/project-jdc-person-search";
import { listAllUsers } from "@/lib/auth-store";
import {
  addChecklistItemAction,
  approveChecklistItemAction,
  assignStudentAction,
  createProjectJdcPersonAction,
  deleteProjectJdcPersonAction,
  markChecklistItemDoneAction,
  renameProjectJdcPersonAction,
  saveWeeklyPlanAction,
  setFacilitatorStatusAction,
  updateStudentProgressAction,
} from "@/app/dashboard/project-jdc/actions";
import {
  countNewEnrollmentsInWeek,
  dayNumberFor,
  getEnrollmentForStudent,
  getWeeklyPlan,
  listChecklistItemsForFacilitator,
  listChecklistItemsForStudent,
  listEnrollments,
  listFacilitatorStatuses,
  listLastCheckIns,
  listWeeklyPlansForWeek,
  PROJECT_JDC_STATUS_LABELS,
  PROJECT_JDC_STATUSES,
  weekStartIso,
  WEEK_DAYS,
  type ProjectJdcChecklistItem,
  type ProjectJdcEnrollment,
  type ProjectJdcStatus,
  type WeekDay,
} from "@/lib/project-jdc-store";
import { requireCapability } from "@/lib/session";
import type { AuthUser } from "@/lib/types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const PROGRAM_DAYS = 30;

function formatCheckIn(iso: string | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
}

function programDayLabel(startDate: string, today: string) {
  const day = dayNumberFor(startDate, today);
  if (day < 1) return `Starts ${startDate}`;
  if (day > PROGRAM_DAYS) return `Day ${PROGRAM_DAYS}+`;
  return `Day ${day} of ${PROGRAM_DAYS}`;
}

function StatusSelect({ value }: { value: ProjectJdcStatus }) {
  return (
    <select name="status" defaultValue={value} className={`pjdc-status-select is-${value}`}>
      {PROJECT_JDC_STATUSES.map((status) => (
        <option key={status} value={status}>
          {PROJECT_JDC_STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}

function RosterSummary({ enrollments }: { enrollments: ProjectJdcEnrollment[] }) {
  return (
    <div className="pjdc-stats">
      <div className="pjdc-stat">
        <span className="pjdc-stat-value">{enrollments.length}</span>
        <span className="pjdc-stat-label">Total students</span>
      </div>
      {PROJECT_JDC_STATUSES.map((status) => (
        <div className={`pjdc-stat is-${status}`} key={status}>
          <span className="pjdc-stat-value">{enrollments.filter((item) => item.status === status).length}</span>
          <span className="pjdc-stat-label">{PROJECT_JDC_STATUS_LABELS[status]}</span>
        </div>
      ))}
    </div>
  );
}

function StudentRoster({
  enrollments,
  userById,
  lastCheckIns,
  showFacilitator,
}: {
  enrollments: ProjectJdcEnrollment[];
  userById: Map<string, AuthUser>;
  lastCheckIns: Map<string, string>;
  showFacilitator: boolean;
}) {
  const today = todayIso();
  const columnCount = showFacilitator ? 7 : 6;

  return (
    <div className="pjdc-card">
      <div className="pjdc-card-header">
        <div>
          <h2 className="pjdc-card-title">Student roster &amp; progress</h2>
          <p className="pjdc-card-subtitle">Status drives the row color. Last check-in updates when a student marks an item done.</p>
        </div>
        <span className="pjdc-card-count">{enrollments.length}</span>
      </div>
      <RosterSummary enrollments={enrollments} />
      <div className="pjdc-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Student</th>
              {showFacilitator ? <th>Facilitator</th> : null}
              <th>Contact</th>
              <th>Start date</th>
              <th>Current day</th>
              <th>Last check-in</th>
              <th>Status &amp; notes</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.length === 0 ? (
              <tr>
                <td colSpan={columnCount}>
                  <div className="pjdc-empty">No students assigned yet.</div>
                </td>
              </tr>
            ) : (
              enrollments.map((enrollment) => {
                const student = userById.get(enrollment.studentId);
                return (
                  <tr key={enrollment.id} className={`pjdc-status-row is-${enrollment.status}`}>
                    <td>{student?.name ?? enrollment.studentId}</td>
                    {showFacilitator ? (
                      <td>{userById.get(enrollment.facilitatorId)?.name ?? enrollment.facilitatorId}</td>
                    ) : null}
                    <td>
                      <div className="pjdc-contact">
                        {student?.phone ? <span>{student.phone}</span> : null}
                        {student?.email && !student.email.endsWith("@ghl.invalid") ? <span>{student.email}</span> : null}
                      </div>
                    </td>
                    <td>{enrollment.startDate}</td>
                    <td>{programDayLabel(enrollment.startDate, today)}</td>
                    <td>{formatCheckIn(lastCheckIns.get(enrollment.studentId))}</td>
                    <td>
                      <form action={updateStudentProgressAction} className="pjdc-row-form">
                        <input type="hidden" name="studentId" value={enrollment.studentId} />
                        <StatusSelect value={enrollment.status} />
                        <input type="text" name="notes" defaultValue={enrollment.notes} placeholder="Notes" maxLength={500} />
                        <button type="submit" className="macos-btn macos-btn-secondary">
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const DAY_LABELS: Record<WeekDay, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function StatusPill({ item }: { item: Pick<ProjectJdcChecklistItem, "studentDone" | "facilitatorApproved"> }) {
  if (item.facilitatorApproved) return <span className="pjdc-pill is-approved">Approved</span>;
  if (item.studentDone) return <span className="pjdc-pill is-waiting">Waiting on check</span>;
  return <span className="pjdc-pill is-pending">Pending</span>;
}

function PersonSection({
  title,
  role,
  people,
  candidates,
}: {
  title: string;
  role: "facilitator" | "student";
  people: Array<{ id: string; name: string; email: string }>;
  candidates: Array<{ id: string; name: string; email: string }>;
}) {
  return (
    <div className="pjdc-card">
      <div className="pjdc-card-header">
        <div>
          <h2 className="pjdc-card-title">{title}</h2>
          <p className="pjdc-card-subtitle">Create, rename, or remove {title.toLowerCase()}.</p>
        </div>
        <span className="pjdc-card-count">{people.length}</span>
      </div>

      <form action={createProjectJdcPersonAction} className="pjdc-toolbar" style={{ alignItems: "flex-start" }}>
        <input type="hidden" name="role" value={role} />
        <ProjectJdcPersonSearch namePlaceholder={`New ${role} name`} candidates={candidates} />
        <button type="submit" className="macos-btn macos-btn-primary" style={{ marginTop: "1.6rem" }}>
          Add {title.slice(0, -1).toLowerCase()}
        </button>
      </form>

      <div className="pjdc-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {people.length === 0 ? (
              <tr>
                <td colSpan={3}>
                  <div className="pjdc-empty">No {title.toLowerCase()} yet.</div>
                </td>
              </tr>
            ) : (
              people.map((person) => (
                <tr key={person.id}>
                  <td>
                    <form action={renameProjectJdcPersonAction} className="pjdc-row-form">
                      <input type="hidden" name="userId" value={person.id} />
                      <input type="text" name="name" defaultValue={person.name} />
                      <button type="submit" className="macos-btn macos-btn-secondary">
                        Save
                      </button>
                    </form>
                  </td>
                  <td>{person.email}</td>
                  <td>
                    <form action={deleteProjectJdcPersonAction}>
                      <input type="hidden" name="userId" value={person.id} />
                      <button type="submit" className="macos-btn macos-btn-danger">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function ProjectJdcPage() {
  const { user } = await requireCapability("projectJdc");

  if (user.role === "admin") {
    const thisWeekStart = weekStartIso(todayIso());
    const [users, enrollments, weeklyPlans, facilitatorStatuses, lastCheckIns] = await Promise.all([
      listAllUsers(),
      listEnrollments(),
      listWeeklyPlansForWeek(thisWeekStart),
      listFacilitatorStatuses(),
      listLastCheckIns(),
    ]);
    const facilitators = users.filter((item) => item.role === "facilitator");
    const students = users.filter((item) => item.role === "student");
    const userById = new Map(users.map((item) => [item.id, item]));
    const googleUsers = users.filter((item) => item.googleId && item.role !== "admin");
    const facilitatorCandidates = googleUsers.filter((item) => item.role !== "facilitator");
    const studentCandidates = googleUsers.filter((item) => item.role !== "student");
    const planByFacilitatorId = new Map(weeklyPlans.map((plan) => [plan.facilitatorId, plan]));
    const weeklyProgress = await Promise.all(
      facilitators.map(async (facilitator) => ({
        facilitator,
        plan: planByFacilitatorId.get(facilitator.id) ?? null,
        actual: await countNewEnrollmentsInWeek(facilitator.id, thisWeekStart),
        status: facilitatorStatuses.get(facilitator.id) ?? ("active" as ProjectJdcStatus),
      })),
    );

    return (
      <DashboardShell title="Project JDC" description="Manage facilitators and students, and assign students to a facilitator.">
        <div className="pjdc-page">
          <div className="pjdc-grid">
            <PersonSection title="Facilitators" role="facilitator" people={facilitators} candidates={facilitatorCandidates} />
            <PersonSection title="Students" role="student" people={students} candidates={studentCandidates} />
          </div>

          <div className="pjdc-card">
            <div className="pjdc-card-header">
              <div>
                <h2 className="pjdc-card-title">Assign a student to a facilitator</h2>
                <p className="pjdc-card-subtitle">Sets the student's Day 1 and who checks their daily checklist.</p>
              </div>
            </div>
            <form action={assignStudentAction} className="pjdc-toolbar">
              <label className="pjdc-field">
                Student
                <select name="studentId" required>
                  <option value="">Choose a student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="pjdc-field">
                Facilitator
                <select name="facilitatorId" required>
                  <option value="">Choose a facilitator</option>
                  {facilitators.map((facilitator) => (
                    <option key={facilitator.id} value={facilitator.id}>
                      {facilitator.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="pjdc-field">
                Start date
                <input type="date" name="startDate" defaultValue={todayIso()} required />
              </label>
              <button type="submit" className="macos-btn macos-btn-primary">
                Assign
              </button>
            </form>
          </div>

          <StudentRoster enrollments={enrollments} userById={userById} lastCheckIns={lastCheckIns} showFacilitator />

          <div className="pjdc-card">
            <div className="pjdc-card-header">
              <div>
                <h2 className="pjdc-card-title">Facilitator weekly commitments</h2>
                <p className="pjdc-card-subtitle">Week of {thisWeekStart} — daily commitments and progress toward each weekly target.</p>
              </div>
              <span className="pjdc-card-count">{weeklyProgress.length}</span>
            </div>
            <div className="pjdc-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Facilitator</th>
                    <th>Daily commitments</th>
                    <th>Target</th>
                    <th>Progress</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyProgress.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="pjdc-empty">No facilitators yet.</div>
                      </td>
                    </tr>
                  ) : (
                    weeklyProgress.map(({ facilitator, plan, actual, status }) => (
                      <tr key={facilitator.id} className={`pjdc-status-row is-${status}`}>
                        <td>{facilitator.name}</td>
                        <td>
                          {plan ? (
                            <ul className="pjdc-week-summary">
                              {WEEK_DAYS.filter((day) => plan.days[day]).map((day) => (
                                <li key={day}>
                                  <strong>{DAY_LABELS[day]}:</strong> {plan.days[day]}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="pjdc-empty-inline">Not set yet</span>
                          )}
                        </td>
                        <td>{plan && plan.targetCount > 0 ? `${plan.targetCount} ${plan.targetLabel || ""}`.trim() : "—"}</td>
                        <td>
                          {plan && plan.targetCount > 0 ? (
                            <span className="pjdc-pill is-waiting">{actual} / {plan.targetCount}</span>
                          ) : (
                            <span className="pjdc-empty-inline">{actual} new this week</span>
                          )}
                        </td>
                        <td>
                          <form action={setFacilitatorStatusAction} className="pjdc-row-form">
                            <input type="hidden" name="facilitatorId" value={facilitator.id} />
                            <StatusSelect value={status} />
                            <button type="submit" className="macos-btn macos-btn-secondary">
                              Save
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (user.role === "facilitator") {
    const thisWeekStart = weekStartIso(todayIso());
    const [users, enrollments, items, myPlan, myActual, lastCheckIns] = await Promise.all([
      listAllUsers(),
      listEnrollments(),
      listChecklistItemsForFacilitator(user.id),
      getWeeklyPlan(user.id, thisWeekStart),
      countNewEnrollmentsInWeek(user.id, thisWeekStart),
      listLastCheckIns(),
    ]);
    const myEnrollments = enrollments.filter((item) => item.facilitatorId === user.id);
    const studentIds = myEnrollments.map((item) => item.studentId);
    const myStudents = users.filter((item) => studentIds.includes(item.id));
    const nameById = new Map(users.map((item) => [item.id, item.name]));
    const userById = new Map(users.map((item) => [item.id, item]));
    const pendingApproval = items.filter((item) => item.studentDone && !item.facilitatorApproved);

    return (
      <DashboardShell title="Project JDC" description="Add today's checklist for your students and check their progress.">
        <div className="pjdc-page">
          <div className="pjdc-card">
            <div className="pjdc-card-header">
              <div>
                <h2 className="pjdc-card-title">Your weekly commitment &amp; target</h2>
                <p className="pjdc-card-subtitle">Week of {thisWeekStart} — set your daily commitment and this week&apos;s target.</p>
              </div>
              {myPlan && myPlan.targetCount > 0 ? (
                <span className="pjdc-pill is-waiting">{myActual} / {myPlan.targetCount}</span>
              ) : null}
            </div>
            <form action={saveWeeklyPlanAction} className="pjdc-page" style={{ gap: "1rem" }}>
              <input type="hidden" name="weekStart" value={thisWeekStart} />
              <div className="pjdc-week-grid">
                {WEEK_DAYS.map((day) => (
                  <label className="pjdc-field" key={day}>
                    {DAY_LABELS[day]}
                    <input type="text" name={`day_${day}`} defaultValue={myPlan?.days[day] ?? ""} placeholder="e.g. 10K steps / FB postings" />
                  </label>
                ))}
              </div>
              <div className="pjdc-toolbar" style={{ marginBottom: 0 }}>
                <label className="pjdc-field" style={{ minWidth: "8rem", flex: "0 1 8rem" }}>
                  Target count
                  <input type="number" min={0} name="targetCount" defaultValue={myPlan?.targetCount ?? 0} />
                </label>
                <label className="pjdc-field" style={{ flex: "2 1 16rem" }}>
                  Target description
                  <input type="text" name="targetLabel" defaultValue={myPlan?.targetLabel ?? ""} placeholder="e.g. New JDC Elite Members" />
                </label>
                <button type="submit" className="macos-btn macos-btn-primary">
                  Save this week&apos;s plan
                </button>
              </div>
            </form>
          </div>

          <StudentRoster enrollments={myEnrollments} userById={userById} lastCheckIns={lastCheckIns} showFacilitator={false} />

          <div className="pjdc-card">
            <div className="pjdc-card-header">
              <div>
                <h2 className="pjdc-card-title">Add a checklist item</h2>
                <p className="pjdc-card-subtitle">Fitness, learning, meditation, planning — whatever today calls for.</p>
              </div>
            </div>
            <form action={addChecklistItemAction} className="pjdc-toolbar">
              <label className="pjdc-field">
                Student
                <select name="studentId" required>
                  <option value="">Choose a student</option>
                  {myStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="pjdc-field">
                Date
                <input type="date" name="itemDate" defaultValue={todayIso()} required />
              </label>
              <label className="pjdc-field">
                Category
                <select name="category" defaultValue="general">
                  <option value="general">General</option>
                  <option value="fitness">Fitness</option>
                  <option value="learning">Learning / Training</option>
                  <option value="meditation">Meditation / Prayer</option>
                  <option value="planning">Planning</option>
                </select>
              </label>
              <label className="pjdc-field" style={{ flex: "2 1 16rem" }}>
                Checklist item
                <input type="text" name="label" placeholder="e.g. 10K walk" required />
              </label>
              <button type="submit" className="macos-btn macos-btn-primary">
                Add
              </button>
            </form>
          </div>

          <div className="pjdc-card">
            <div className="pjdc-card-header">
              <div>
                <h2 className="pjdc-card-title">Waiting on your check</h2>
                <p className="pjdc-card-subtitle">Students marked these done — review and approve.</p>
              </div>
              <span className="pjdc-card-count">{pendingApproval.length}</span>
            </div>
            <div className="pjdc-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Date</th>
                    <th>Item</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApproval.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="pjdc-empty">Nothing waiting on you right now.</div>
                      </td>
                    </tr>
                  ) : (
                    pendingApproval.map((item) => (
                      <tr key={item.id}>
                        <td>{nameById.get(item.studentId) ?? item.studentId}</td>
                        <td>{item.itemDate}</td>
                        <td>{item.label}</td>
                        <td>
                          <form action={approveChecklistItemAction}>
                            <input type="hidden" name="itemId" value={item.id} />
                            <button type="submit" className="macos-btn macos-btn-secondary">
                              Approve
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pjdc-card">
            <div className="pjdc-card-header">
              <div>
                <h2 className="pjdc-card-title">All checklist items</h2>
              </div>
              <span className="pjdc-card-count">{items.length}</span>
            </div>
            <div className="pjdc-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Date</th>
                    <th>Item</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="pjdc-empty">No checklist items yet.</div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id}>
                        <td>{nameById.get(item.studentId) ?? item.studentId}</td>
                        <td>{item.itemDate}</td>
                        <td>{item.label}</td>
                        <td>
                          <StatusPill item={item} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  // student
  const [enrollment, items] = await Promise.all([
    getEnrollmentForStudent(user.id),
    listChecklistItemsForStudent(user.id),
  ]);
  const today = todayIso();
  const todayItems = items.filter((item) => item.itemDate === today);
  const dayNumber = enrollment ? dayNumberFor(enrollment.startDate, today) : null;
  const doneToday = todayItems.filter((item) => item.studentDone).length;
  const pct = todayItems.length ? Math.round((doneToday / todayItems.length) * 100) : 0;

  return (
    <DashboardShell
      title="Project JDC"
      description={dayNumber ? `Day ${dayNumber} of your 30-day program.` : "Your daily checklist will appear here once your facilitator assigns one."}
    >
      <div className="pjdc-page">
        {dayNumber ? (
          <div className="pjdc-card pjdc-hero">
            <div>
              <p className="pjdc-day-label">Today</p>
              <p className="pjdc-day-value">Day {dayNumber} of 30</p>
            </div>
            <div className="pjdc-hero-progress">
              <div className="pjdc-ring" style={{ "--pjdc-pct": pct } as React.CSSProperties}>
                <span>{pct}%</span>
              </div>
              <p className="pjdc-day-label" style={{ margin: 0 }}>
                {doneToday} of {todayItems.length} done
              </p>
            </div>
          </div>
        ) : null}

        <div className="pjdc-card">
          <div className="pjdc-card-header">
            <div>
              <h2 className="pjdc-card-title">Today&apos;s checklist</h2>
            </div>
          </div>
          <div className="pjdc-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {todayItems.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="pjdc-empty">Nothing on your checklist for today yet.</div>
                    </td>
                  </tr>
                ) : (
                  todayItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.label}</td>
                      <td>{item.category}</td>
                      <td>
                        <StatusPill item={item} />
                      </td>
                      <td>
                        {!item.studentDone ? (
                          <form action={markChecklistItemDoneAction}>
                            <input type="hidden" name="itemId" value={item.id} />
                            <button type="submit" className="macos-btn macos-btn-primary">
                              Mark done
                            </button>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pjdc-card">
          <div className="pjdc-card-header">
            <div>
              <h2 className="pjdc-card-title">History</h2>
            </div>
            <span className="pjdc-card-count">{items.length}</span>
          </div>
          <div className="pjdc-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <div className="pjdc-empty">No checklist history yet.</div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.itemDate}</td>
                      <td>{item.label}</td>
                      <td>
                        <StatusPill item={item} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
