"use client";

import { Crown, Trophy } from "lucide-react";
import { useState } from "react";

import { EmptyState, firstName, PjdcAvatar } from "@/components/project-jdc/pjdc-ui";
import type { PjdcLeader, PjdcLeaderboards } from "@/lib/project-jdc-view";
import { cn } from "@/lib/utils";

type Board = "students" | "facilitators";
type Period = "week" | "all";

const BOARD_LABELS: Record<Board, string> = { students: "Students", facilitators: "Facilitators" };
const PERIOD_LABELS: Record<Period, string> = { week: "This week", all: "All time" };
const SCORE_WORDS: Record<Board, Record<Period, string>> = {
  students: { week: "Most tasks done this week", all: "Most tasks done since day 1" },
  facilitators: { week: "Most new students this week", all: "Biggest teams" },
};

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Record<T, string>;
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div className="pjdc-segmented" role="group" aria-label={label}>
      {(Object.keys(options) as T[]).map((key) => (
        <button key={key} type="button" aria-pressed={value === key} className={cn(value === key && "is-on")} onClick={() => onChange(key)}>
          {options[key]}
        </button>
      ))}
    </div>
  );
}

export function PjdcLeaderboard({
  boards,
  viewerId,
  initialBoard = "students",
}: {
  boards: PjdcLeaderboards;
  viewerId: string;
  initialBoard?: Board;
}) {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [period, setPeriod] = useState<Period>("week");
  const entries = boards[board][period];
  const top = entries[0]?.score ?? 0;
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const myRank = entries.findIndex((entry) => entry.id === viewerId);

  return (
    <div className="pjdc-leaders">
      <div className="pjdc-leaders-tools">
        <Segmented value={board} options={BOARD_LABELS} onChange={setBoard} label="Which leaderboard" />
        <Segmented value={period} options={PERIOD_LABELS} onChange={setPeriod} label="Time period" />
      </div>
      <p className="pjdc-leaders-caption">{SCORE_WORDS[board][period]}</p>

      {entries.length === 0 ? (
        <EmptyState icon={<Trophy size={28} />} title="No one is on the board yet">
          {board === "students" ? "Finish a task to be the first!" : "Bring in a new student to be the first!"}
        </EmptyState>
      ) : (
        // Keyed so the bars grow again whenever the board changes.
        <div key={`${board}-${period}`} className="pjdc-leaders-body">
          <ol className="pjdc-podium" aria-label="Top 3">
            {podium.map((entry, index) => (
              <PodiumSpot key={entry.id} entry={entry} place={index + 1} isYou={entry.id === viewerId} />
            ))}
          </ol>

          {rest.length > 0 ? (
            <ol className="pjdc-ranks" start={4}>
              {rest.map((entry, index) => (
                <li key={entry.id} className={cn("pjdc-rank", entry.id === viewerId && "is-you")}>
                  <span className="pjdc-rank-num">{index + 4}</span>
                  <PjdcAvatar name={entry.name} photoUrl={entry.photoUrl} size="md" />
                  <span className="pjdc-rank-text">
                    <strong>{entry.id === viewerId ? "You" : entry.name}</strong>
                    <span className="pjdc-rank-bar" aria-hidden>
                      <span style={{ width: `${top ? Math.max(6, Math.round((entry.score / top) * 100)) : 0}%` }} />
                    </span>
                    <em>{entry.detail}</em>
                  </span>
                </li>
              ))}
            </ol>
          ) : null}

          {myRank > 2 ? (
            <p className="pjdc-leaders-you">
              You are number {myRank + 1}. Keep going!
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function PodiumSpot({ entry, place, isYou }: { entry: PjdcLeader; place: number; isYou: boolean }) {
  return (
    <li className={cn("pjdc-spot", `is-${place}`, isYou && "is-you")}>
      {place === 1 ? <Crown className="pjdc-spot-crown" aria-hidden size={26} /> : null}
      <PjdcAvatar name={entry.name} photoUrl={entry.photoUrl} size={place === 1 ? "xl" : "lg"} />
      <strong>{isYou ? "You" : firstName(entry.name)}</strong>
      <em>{entry.detail}</em>
      <span className="pjdc-spot-step" aria-label={`Number ${place}`}>
        {place}
      </span>
    </li>
  );
}
