import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { coachingModes, ComingSoonProgram, isCoachingMode } from "@/components/programs/coming-soon-program";

type Props = { params: Promise<{ mode: string }> };

export function generateStaticParams() {
  return Object.keys(coachingModes).map((mode) => ({ mode }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mode } = await params;
  if (!isCoachingMode(mode)) return {};
  return { title: `Group ${coachingModes[mode]} — Coming Soon` };
}

export default async function GroupCoachingModePage({ params }: Props) {
  const { mode } = await params;
  if (!isCoachingMode(mode)) notFound();

  return (
    <ComingSoonProgram
      basePath="/programs/group-coaching"
      program="Group Coaching"
      mode={mode}
      headline={
        mode === "online"
          ? "Group coaching with Coach JDC, from wherever you are."
          : "Group coaching with Coach JDC, in the room."
      }
      body="This format isn't open yet. Join the JDC Mastermind now, and we'll let you know the moment it launches."
    />
  );
}
