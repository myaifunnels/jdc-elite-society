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
  syncGhlStudentsAction,
} from "@/app/dashboard/project-jdc/actions";
import {
  dayNumberFor,
  getEnrollmentForStudent,
  listChecklistItemsForFacilitator,
  listChecklistItemsForStudent,
  listEnrollments,
  listStudentIdsForFacilitator,
  type ProjectJdcChecklistItem,
} from "@/lib/project-jdc-store";
import { requireCapability } from "@/lib/session";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function StatusPill({ item }: { item: Pick<ProjectJdcChecklistItem, "studentDone" | "facilitatorApproved"> }) {
  if (item.facilitatorApproved) return <span className="pjdc-pill is-approved">Approved</span>;
  if (item.studentDone) return <span className="pjdc-pill is-waiting">Waiting on check</span>;
  return <span className="pjdc-pill is-pending">Pending</span>;
}

function PersonSection({
  title,
  role,
  people,
  extraAction,
}: {
  title: string;
  role: "facilitator" | "student";
  people: Array<{ id: string; name: string; email: string }>;
  extraAction?: React.ReactNode;
}) {
  return (
    <div className="pjdc-card">
      <div className="pjdc-card-header">
        <div>
          <h2 className="pjdc-card-title">{title}</h2>
          <p className="pjdc-card-subtitle">Create, rename, or remove {title.toLowerCase()}.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {extraAction}
          <span className="pjdc-card-count">{people.length}</span>
        </div>
      </div>

      <form action={createProjectJdcPersonAction} className="pjdc-toolbar" style={{ alignItems: "flex-start" }}>
        <input type="hidden" name="role" value={role} />
        <ProjectJdcPersonSearch namePlaceholder={`New ${role} name`} />
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
    const [users, enrollments] = await Promise.all([listAllUsers(), listEnrollments()]);
    const facilitators = users.filter((item) => item.role === "facilitator");
    const students = users.filter((item) => item.role === "student");
    const nameById = new Map(users.map((item) => [item.id, item.name]));

    return (
      <DashboardShell title="Project JDC" description="Manage facilitators and students, and assign students to a facilitator.">
        <div className="pjdc-page">
          <div className="pjdc-grid">
            <PersonSection title="Facilitators" role="facilitator" people={facilitators} />
            <PersonSection
              title="Students"
              role="student"
              people={students}
              extraAction={
                <form action={syncGhlStudentsAction}>
                  <button type="submit" className="macos-btn macos-btn-secondary">
                    Sync from GHL
                  </button>
                </form>
              }
            />
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

            <div className="pjdc-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Facilitator</th>
                    <th>Start date</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.length === 0 ? (
                    <tr>
                      <td colSpan={3}>
                        <div className="pjdc-empty">No students assigned yet.</div>
                      </td>
                    </tr>
                  ) : (
                    enrollments.map((enrollment) => (
                      <tr key={enrollment.id}>
                        <td>{nameById.get(enrollment.studentId) ?? enrollment.studentId}</td>
                        <td>{nameById.get(enrollment.facilitatorId) ?? enrollment.facilitatorId}</td>
                        <td>{enrollment.startDate}</td>
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
    const [users, studentIds, items] = await Promise.all([
      listAllUsers(),
      listStudentIdsForFacilitator(user.id),
      listChecklistItemsForFacilitator(user.id),
    ]);
    const myStudents = users.filter((item) => studentIds.includes(item.id));
    const nameById = new Map(users.map((item) => [item.id, item.name]));
    const pendingApproval = items.filter((item) => item.studentDone && !item.facilitatorApproved);

    return (
      <DashboardShell title="Project JDC" description="Add today's checklist for your students and check their progress.">
        <div className="pjdc-page">
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
