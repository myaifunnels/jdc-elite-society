import Link from "next/link";

import { UNIVERSITY_COMMUNITY_URL } from "@/data/university";

export function UniversityCommunityEmbed({
  unlocked,
  verifyHref,
}: {
  unlocked: boolean;
  verifyHref: string;
}) {
  return (
    <section className="macos-window macos-app-window dashboard-span-2 university-community-window">
      <header className="macos-titlebar">
        <h2 className="macos-title">{unlocked ? "JDC Elite Society community" : "University locked"}</h2>
      </header>
      {unlocked ? (
        <>
          <div className="university-community-frame-wrap">
            <iframe
              title="JDC Elite Society community"
              src={UNIVERSITY_COMMUNITY_URL}
              className="university-community-frame"
              allow="clipboard-read; clipboard-write; fullscreen; autoplay"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <p className="university-community-open">
            <a href={UNIVERSITY_COMMUNITY_URL} target="_blank" rel="noreferrer">
              Open community.coachjdc.org in a new tab
            </a>
          </p>
        </>
      ) : (
        <div className="macos-body">
          <p className="macos-lead" style={{ textAlign: "left" }}>
            University is the membership community at community.coachjdc.org. The lock stays on until your account is
            verified.
          </p>
          <div className="macos-actions">
            <Link href={verifyHref} className="macos-btn macos-btn-primary">
              Verify my account
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
