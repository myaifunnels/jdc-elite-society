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
    <section className={unlocked ? "university-community-window is-live" : "university-community-window"}>
      <h2 className="sr-only">{unlocked ? "JDC Elite Society community" : "University locked"}</h2>
      {unlocked ? (
        <>
          <iframe
            title="JDC Elite Society community"
            src={UNIVERSITY_COMMUNITY_URL}
            className="university-community-frame"
            allow="clipboard-read; clipboard-write; fullscreen; autoplay"
            referrerPolicy="strict-origin-when-cross-origin"
          />
          <a
            className="university-community-open"
            href={UNIVERSITY_COMMUNITY_URL}
            target="_blank"
            rel="noreferrer"
          >
            Open in a new tab
          </a>
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
