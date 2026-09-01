"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useOptimistic, useState, useTransition } from "react";

import { movePipelineCard } from "@/app/dashboard/pipeline/actions";
import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import type { PipelineBoard, PipelineBoardStage, PipelineCard } from "@/lib/crm-store";
import { pipelineStageValue } from "@/lib/pipeline";
import { formatPhp } from "@/lib/pay-cycle";

type Props = {
  board: PipelineBoard;
};

export function PipelineWorkspace({ board }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [optimistic, setOptimistic] = useOptimistic(board.cards, (current, update: { id: string; stage: string }) =>
    current.map((card) => (card.id === update.id ? { ...card, stage: update.stage } : card)),
  );

  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), 20000);
    return () => window.clearInterval(timer);
  }, [router]);

  function move(id: string, stage: string) {
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
    return board.stages.map((stage) => ({
      ...stage,
      cards: optimistic.filter((card) => card.stage === stage.id),
    }));
  }, [board.stages, optimistic]);

  const totalValue = pipelineStageValue(optimistic);

  return (
    <div className="pipeline-workspace">
      <div className="pipeline-metrics">
        <article className="dashboard-metric-card">
          <p className="macos-kicker">{board.pipelineName}</p>
          <p className="dashboard-metric-value">{optimistic.length}</p>
          <p className="dashboard-metric-copy">Open records on this board</p>
        </article>
        <article className="dashboard-metric-card">
          <p className="macos-kicker">Pipeline value</p>
          <p className="dashboard-metric-value">{formatPhp(totalValue)}</p>
          <p className="dashboard-metric-copy">Sum of opportunity values</p>
        </article>
        {grouped
          .filter((column) => column.canonical === "payment")
          .map((column) => (
            <article key={column.id} className="dashboard-metric-card">
              <p className="macos-kicker">{column.label}</p>
              <p className="dashboard-metric-value">{column.cards.length}</p>
              <p className="dashboard-metric-copy">{formatPhp(pipelineStageValue(column.cards))} waiting</p>
            </article>
          ))}
      </div>
      {error ? <p className="auth-error">{error}</p> : null}
      <PipelineKanban stages={board.stages} grouped={grouped} onMove={move} />
    </div>
  );
}

function PipelineKanban({
  stages,
  grouped,
  onMove,
}: {
  stages: PipelineBoardStage[];
  grouped: Array<PipelineBoardStage & { cards: PipelineCard[] }>;
  onMove: (id: string, stage: string) => void;
}) {
  return (
    <div className="pipeline-kanban" style={{ ["--pipeline-cols" as string]: String(Math.max(grouped.length, 1)) }}>
      {grouped.map((column) => {
        const value = pipelineStageValue(column.cards);
        return (
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
              <p className="macos-kicker">{column.label}</p>
              <h2>{formatPhp(value)}</h2>
              <p>
                {column.cards.length} {column.cards.length === 1 ? "deal" : "deals"}
              </p>
            </header>
            <div className="pipeline-column-body">
              {column.cards.length === 0 ? <p className="pipeline-empty">No records in this stage.</p> : null}
              {column.cards.map((card) => (
                <PipelineCardItem key={card.id} card={card} stages={stages} onMove={onMove} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function PipelineCardItem({
  card,
  stages,
  onMove,
}: {
  card: PipelineCard;
  stages: PipelineBoardStage[];
  onMove: (id: string, stage: string) => void;
}) {
  const href = `/dashboard/contacts/${card.contactId}`;
  const secondary = card.email?.includes("@ghl.invalid") ? card.phone || card.email : card.email;
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
      <Link href={href} className="pipeline-card-link">
        <ContactAvatar name={card.name} photoUrl={card.photoUrl} size="sm" />
        <span>
          <strong>{card.name}</strong>
          <em>{card.city || secondary}</em>
        </span>
      </Link>
      <p className="pipeline-card-value">{formatPhp(card.monetaryValue)}</p>
      <p className="pipeline-card-meta">{secondary}</p>
      <label className="pipeline-stage-select is-compact">
        <span className="sr-only">Move {card.name}</span>
        <select value={card.stage} onChange={(event) => onMove(card.id, event.target.value)}>
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.label}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}
