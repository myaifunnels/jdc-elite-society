import type { Metadata } from "next";

import { ComingSoonProgram } from "@/components/programs/coming-soon-program";

export const metadata: Metadata = {
  title: "1-on-1 Coaching — Coming Soon",
  description: "Private coaching with Coach Jayson Dela Cruz, online or face to face. Coming soon.",
};

export default function OneOnOneCoachingPage() {
  return (
    <ComingSoonProgram
      basePath="/programs/1-on-1-coaching"
      program="1-on-1 Coaching"
      headline="Direct time with Coach JDC — online or face to face."
      body="Private 1-on-1 coaching isn't open yet. Join the JDC Mastermind now, and we'll let you know the moment it launches."
    />
  );
}
