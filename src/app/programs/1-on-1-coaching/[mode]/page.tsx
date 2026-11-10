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
  return { title: `1-on-1 ${coachingModes[mode]} — Coming Soon` };
}

export default async function OneOnOneCoachingModePage({ params }: Props) {
  const { mode } = await params;
  if (!isCoachingMode(mode)) notFound();

  return (
    <ComingSoonProgram
      basePath="/programs/1-on-1-coaching"
      program="1-on-1 Coaching"
      mode={mode}
      headline={
        mode === "online" ? "Private time with Coach JDC, online." : "Private time with Coach JDC, face to face."
      }
      body="Private 1-on-1 coaching isn't open yet. Join the JDC Mastermind now, and we'll let you know the moment it launches."
    />
  );
}
