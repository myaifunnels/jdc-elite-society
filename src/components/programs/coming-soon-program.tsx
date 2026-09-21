import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export type CoachingMode = "online" | "face-to-face";

export const coachingModes: Record<CoachingMode, string> = {
  online: "Online Coaching",
  "face-to-face": "Face-to-Face Coaching",
};

export function isCoachingMode(value: string): value is CoachingMode {
  return value === "online" || value === "face-to-face";
}

/** Shared "Coming Soon" landing for the coaching tracks that aren't open yet, so each menu entry
 * (Group / 1-on-1, Online / Face-to-Face) lands on a real page. */
export function ComingSoonProgram({
  basePath,
  program,
  mode,
  headline,
  body,
}: {
  basePath: string;
  program: string;
  mode?: CoachingMode;
  headline: string;
  body: string;
}) {
  const allModes = Object.keys(coachingModes) as CoachingMode[];
  const links = mode ? allModes.filter((item) => item !== mode) : allModes;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <div className="section-space">
          <div className="container-shell text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-dark)]">
              {program}
              {mode ? ` · ${coachingModes[mode]}` : ""}
            </p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[color:var(--surface-elevated)]/70 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand-dark)]">
              Coming Soon
            </span>
            <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              {headline}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--muted)]">{body}</p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/duplication" className="button-primary pressable rounded-full px-6 py-3 font-semibold">
                Join JDC Mastermind
              </Link>
              <Link href="/programs" className="button-secondary pressable rounded-full px-6 py-3 font-semibold">
                See the other tracks
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
              {mode ? (
                <Link href={basePath} className="pressable underline underline-offset-4">
                  {program} overview
                </Link>
              ) : null}
              {links.map((item) => (
                <Link key={item} href={`${basePath}/${item}`} className="pressable underline underline-offset-4">
                  {coachingModes[item]}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
