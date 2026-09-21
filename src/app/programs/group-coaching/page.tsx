import type { Metadata } from "next";

import { ComingSoonProgram } from "@/components/programs/coming-soon-program";

export const metadata: Metadata = {
  title: "Group Coaching — Coming Soon",
  description: "Group coaching with Coach Jayson Dela Cruz, online or face to face. Coming soon.",
};

export default function GroupCoachingPage() {
  return (
    <ComingSoonProgram
      basePath="/programs/group-coaching"
      program="Group Coaching"
      headline="Grow alongside builders who take action — online or face to face."
      body="Group coaching isn't open yet. Join the JDC Mastermind now, and we'll let you know the moment it launches."
    />
  );
}
