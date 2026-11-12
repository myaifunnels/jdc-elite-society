// Shared by server and client code, so it must not import the database store.

export const PROJECT_JDC_STATUSES = ["active", "at_risk", "inactive", "completed"] as const;
export type ProjectJdcStatus = (typeof PROJECT_JDC_STATUSES)[number];

export const PROJECT_JDC_STATUS_LABELS: Record<ProjectJdcStatus, string> = {
  active: "Active",
  at_risk: "At Risk",
  inactive: "Inactive",
  completed: "Completed",
};

/** One plain sentence per status, for people who need it spelled out. */
export const PROJECT_JDC_STATUS_HINTS: Record<ProjectJdcStatus, string> = {
  active: "Doing the work",
  at_risk: "Needs a little help",
  inactive: "Stopped for now",
  completed: "Finished the program",
};

export function isProjectJdcStatus(value: string): value is ProjectJdcStatus {
  return (PROJECT_JDC_STATUSES as readonly string[]).includes(value);
}
