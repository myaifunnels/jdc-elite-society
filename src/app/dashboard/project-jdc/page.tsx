import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { listAllUsers } from "@/lib/auth-store";
import {
  addChecklistItemAction,
  approveChecklistItemAction,
  assignStudentAction,
  markChecklistItemDoneAction,
} from "@/app/dashboard/project-jdc/actions";
import {
  dayNumberFor,
  getEnrollmentForStudent,
  listChecklistItemsForFacilitator,
  listChecklistItemsForStudent,
  listEnrollments,
  listStudentIdsForFacilitator,
} from "@/lib/project-jdc-store";
import { requireCapability } from "@/lib/session";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ProjectJdcPage() {
  const { user } = await requireCapability("projectJdc");

  if (user.role === "admin") {
    const [users, enrollments] = await Promise.all([listAllUsers(), listEnrollments()]);
    const facilitators = users.filter((item) => item.role === "facilitator");
    const students = users.filter((item) => item.role === "student");
    const nameById = new Map(users.map((item) => [item.id, item.name]));

    return (
      <DashboardShell title="Project JDC" description="Assign students to facilitators for the daily checklist.">
        <form action={assignStudentAction} style={{ display: "grid", gap: "0.75rem", maxWidth: "28rem", marginBottom: "2rem" }}>
          <label>
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
          <label>
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
          <label>
            Start date
            <input type="date" name="startDate" defaultValue={todayIso()} required />
          </label>
          <button type="submit" className="macos-btn macos-btn-primary">
            Assign
          </button>
        </form>

        <h2>Current enrollments</h2>
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
                <td colSpan={3}>No students assigned yet.</td>
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
        <form action={addChecklistItemAction} style={{ display: "grid", gap: "0.75rem", maxWidth: "28rem", marginBottom: "2rem" }}>
          <label>
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
          <label>
            Date
            <input type="date" name="itemDate" defaultValue={todayIso()} required />
          </label>
          <label>
            Category
            <select name="category" defaultValue="general">
              <option value="general">General</option>
              <option value="fitness">Fitness</option>
              <option value="learning">Learning / Training</option>
              <option value="meditation">Meditation / Prayer</option>
              <option value="planning">Planning</option>
            </select>
          </label>
          <label>
            Checklist item
            <input type="text" name="label" placeholder="e.g. 10K walk" required />
          </label>
          <button type="submit" className="macos-btn macos-btn-primary">
            Add checklist item
          </button>
        </form>

        <h2>Waiting on your check ({pendingApproval.length})</h2>
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
                <td colSpan={4}>Nothing waiting on you right now.</td>
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

        <h2>All checklist items</h2>
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
                <td colSpan={4}>No checklist items yet.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>{nameById.get(item.studentId) ?? item.studentId}</td>
                  <td>{item.itemDate}</td>
                  <td>{item.label}</td>
                  <td>
                    {item.facilitatorApproved ? "Approved" : item.studentDone ? "Done, pending check" : "Pending"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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

  return (
    <DashboardShell
      title="Project JDC"
      description={dayNumber ? `Day ${dayNumber} of your 30-day program.` : "Your daily checklist will appear here once your facilitator assigns one."}
    >
      <h2>Today's checklist</h2>
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
              <td colSpan={4}>Nothing on your checklist for today yet.</td>
            </tr>
          ) : (
            todayItems.map((item) => (
              <tr key={item.id}>
                <td>{item.label}</td>
                <td>{item.category}</td>
                <td>
                  {item.facilitatorApproved ? "Approved" : item.studentDone ? "Done, pending check" : "Pending"}
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

      <h2>History</h2>
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
              <td colSpan={3}>No checklist history yet.</td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id}>
                <td>{item.itemDate}</td>
                <td>{item.label}</td>
                <td>
                  {item.facilitatorApproved ? "Approved" : item.studentDone ? "Done, pending check" : "Pending"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </DashboardShell>
  );
}
