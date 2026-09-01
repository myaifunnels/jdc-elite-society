"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useOptimistic, useState, useTransition } from "react";

import { movePipelineCard } from "@/app/dashboard/pipeline/actions";
import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import type { PipelineCard } from "@/lib/crm-store";
import { PIPELINE_STAGES, type PipelineStageId } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

type Props = {
  cards: PipelineCard[];
  view: "kanban" | "list";
};

export function PipelineWorkspace({ cards, view }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [optimistic, setOptimistic] = useOptimistic(cards, (current, update: { id: string; stage: PipelineStageId }) =>
    current.map((card) => (card.id === update.id ? { ...card, stage: update.stage } : card)),
  );

  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), 20000);
    return () => window.clearInterval(timer);
  }, [router]);

  function move(id: string, stage: PipelineStageId) {
    const current = optimistic.find((card) => card.id === id);
    if (!current || current.stage === stage) {
      return;
    }
    setError("");
    startTransition(async () => {
      setOptimistic({ id, stage });
      const result = await movePipelineCard(id, stage);
      if (result.error) {
        setError(result.error);
      }
      router.refresh();
    });
  }

  const grouped = useMemo(() => {
    return PIPELINE_STAGES.map((stage) => ({
      ...stage,
      cards: optimistic.filter((card) => card.stage === stage.id),
    }));
  }, [optimistic]);

  return (
    <div className="pipeline-workspace">
      {error ? <p className="auth-error">{error}</p> : null}
      {view === "list" ? (
        <PipelineList grouped={grouped} onMove={move} />
      ) : (
        <PipelineKanban grouped={grouped} onMove={move} />
      )}
    </div>
  );
}

function PipelineKanban({
  grouped,
  onMove,
}: {
  grouped: Array<(typeof PIPELINE_STAGES)[number] & { cards: PipelineCard[] }>;
  onMove: (id: string, stage: PipelineStageId) => void;
}) {
  return (
    <div className="pipeline-kanban">
      {grouped.map((column) => (
        <section
          key={column.id}
          className="pipeline-column"
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
          onDrop={(event) => {
            event.preventDefault();
            const id =
              event.dataTransfer.getData("text/pipeline-card") || event.dataTransfer.getData("text/plain");
            if (id) {
              onMove(id, column.id);
            }
          }}
        >
          <header className="pipeline-column-head">
            <div>
              <p className="macos-kicker">{column.label}</p>
              <h2>{column.cards.length}</h2>
            </div>
            <p>{column.detail}</p>
          </header>
          <div className="pipeline-column-body">
            {column.cards.length === 0 ? <p className="pipeline-empty">No people in this stage.</p> : null}
            {column.cards.map((card) => (
              <PipelineCardItem key={card.id} card={card} onMove={onMove} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function PipelineList({
  grouped,
  onMove,
}: {
  grouped: Array<(typeof PIPELINE_STAGES)[number] & { cards: PipelineCard[] }>;
  onMove: (id: string, stage: PipelineStageId) => void;
}) {
  return (
    <div className="pipeline-list">
      {grouped.map((group) => (
        <section key={group.id} className="macos-window macos-app-window">
          <header className="macos-titlebar">
            <h2 className="macos-title">
              {group.label} · {group.cards.length}
            </h2>
          </header>
          <div className="macos-body pipeline-list-body">
            {group.cards.length === 0 ? (
              <p className="macos-lead" style={{ textAlign: "left" }}>
                No people in this stage.
              </p>
            ) : null}
            {group.cards.map((card) => (
              <div key={card.id} className="pipeline-list-row">
                <Link href={`/dashboard/contacts/${card.id}`} className="dashboard-contact-row">
                  <ContactAvatar name={card.name} photoUrl={card.photoUrl} size="sm" />
                  <span>
                    <strong>{card.name}</strong>
                    <em>
                      {card.email.includes("@ghl.invalid") ? card.phone || "GHL contact" : card.email}
                      {card.city ? ` · ${card.city}` : ""}
                    </em>
                  </span>
                </Link>
                <StageSelect name={card.name} value={group.id} onMove={(stage) => onMove(card.id, stage)} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function PipelineCardItem({
  card,
  onMove,
}: {
  card: PipelineCard;
  onMove: (id: string, stage: PipelineStageId) => void;
}) {
  return (
    <article
      className="pipeline-card"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/pipeline-card", card.id);
        event.dataTransfer.setData("text/plain", card.id);
        event.dataTransfer.effectAllowed = "move";
      }}
    >
      <Link href={`/dashboard/contacts/${card.id}`} className="pipeline-card-link">
        <ContactAvatar name={card.name} photoUrl={card.photoUrl} size="sm" />
        <span>
          <strong>{card.name}</strong>
          <em>{card.city || (card.email.includes("@ghl.invalid") ? card.phone : card.email)}</em>
        </span>
      </Link>
      <p className="pipeline-card-meta">{card.email.includes("@ghl.invalid") ? card.phone || card.email : card.email}</p>
      <StageSelect name={card.name} value={card.stage} onMove={(stage) => onMove(card.id, stage)} compact />
    </article>
  );
}

function StageSelect({
  name,
  value,
  onMove,
  compact = false,
}: {
  name: string;
  value: PipelineStageId;
  onMove: (stage: PipelineStageId) => void;
  compact?: boolean;
}) {
  return (
    <label className={cn("pipeline-stage-select", compact && "is-compact")}>
      <span className="sr-only">Move {name}</span>
      <select value={value} onChange={(event) => onMove(event.target.value as PipelineStageId)}>
        {PIPELINE_STAGES.map((stage) => (
          <option key={stage.id} value={stage.id}>
            {stage.label}
          </option>
        ))}
      </select>
    </label>
  );
}
