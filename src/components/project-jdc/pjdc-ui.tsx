// Small display pieces shared by the server screens and the client widgets.

import { Brain, Dumbbell, ExternalLink, Heart, ListChecks, Sparkles, Wallet, type LucideIcon } from "lucide-react";

import { ContactAvatar } from "@/components/dashboard/contact-avatar";
import { mediaSrc } from "@/lib/media";
import {
  PILLAR_HINTS,
  PILLAR_LABELS,
  PILLARS,
  pillarOf,
  type Pillar,
  type PillarStats,
} from "@/lib/project-jdc-pillars";
import { PROJECT_JDC_STATUS_LABELS, type ProjectJdcStatus } from "@/lib/project-jdc-status";
import type { ProjectJdcProof } from "@/lib/project-jdc-store";
import { cn } from "@/lib/utils";

export const PILLAR_ICONS: Record<Pillar, LucideIcon> = {
  physical: Dumbbell,
  emotional: Heart,
  financial: Wallet,
  mental: Brain,
  spiritual: Sparkles,
};

/** The colored tile for a task's area of life. */
export function CategoryIcon({ category, size = 22 }: { category: string; size?: number }) {
  const pillar = pillarOf(category);
  const Icon = pillar ? PILLAR_ICONS[pillar] : ListChecks;
  return (
    <span className={cn("pjdc-cat", `is-${pillar ?? "general"}`)} aria-hidden>
      <Icon size={size} aria-hidden />
    </span>
  );
}

export function categoryLabel(category: string) {
  const pillar = pillarOf(category);
  return pillar ? PILLAR_LABELS[pillar] : "Task";
}

/**
 * How each of the 5 areas of life is going: tasks done out of tasks given.
 * Points out the area that needs the most attention.
 */
export function PillarBoard({ stats, compact = false }: { stats: PillarStats; compact?: boolean }) {
  const given = PILLARS.reduce((sum, pillar) => sum + stats[pillar].given, 0);
  if (given === 0) {
    return <p className="pjdc-muted">No tasks yet. Give a task in each area to see the balance.</p>;
  }
  const rate = (pillar: Pillar) => (stats[pillar].given ? stats[pillar].done / stats[pillar].given : 0);
  const weakest = PILLARS.filter((pillar) => stats[pillar].given > 0).sort((a, b) => rate(a) - rate(b))[0];
  const missing = PILLARS.filter((pillar) => stats[pillar].given === 0);

  return (
    <div className={cn("pjdc-pillars", compact && "is-compact")}>
      <ul>
        {PILLARS.map((pillar) => {
          const { given: count, done, checked } = stats[pillar];
          const pct = count ? Math.round((done / count) * 100) : 0;
          return (
            <li key={pillar} className={cn(`is-${pillar}`, pillar === weakest && missing.length === 0 && "is-weakest")}>
              <CategoryIcon category={pillar} size={compact ? 18 : 20} />
              <span className="pjdc-pillar-text">
                <strong>{PILLAR_LABELS[pillar]}</strong>
                {compact ? null : <em>{PILLAR_HINTS[pillar]}</em>}
              </span>
              <span className="pjdc-pillar-num">
                <b>{count ? `${pct}%` : "–"}</b>
                <small>
                  {done}/{count} done{compact || !count ? "" : ` · ${checked} checked`}
                </small>
              </span>
              <span className="pjdc-pillar-bar" role="progressbar" aria-label={`${PILLAR_LABELS[pillar]}: ${pct}% done`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                <span style={{ width: `${pct}%` }} />
              </span>
            </li>
          );
        })}
      </ul>
      {compact ? null : missing.length ? (
        <p className="pjdc-pillar-tip">
          No tasks yet for <strong>{missing.map((pillar) => PILLAR_LABELS[pillar]).join(", ")}</strong>. Add one to keep life balanced.
        </p>
      ) : weakest ? (
        <p className="pjdc-pillar-tip">
          <strong>{PILLAR_LABELS[weakest]}</strong> needs the most attention right now.
        </p>
      ) : null}
    </div>
  );
}

function linkText(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname.length > 1 ? parsed.pathname : ""}`;
  } catch {
    return url;
  }
}

/** The screenshots, links and words a student sent to show they did the task. */
export function ProofView({ proof }: { proof: ProjectJdcProof }) {
  if (!proof.note && proof.links.length === 0 && proof.images.length === 0) {
    return <p className="pjdc-proof is-empty">No proof added</p>;
  }
  return (
    <div className="pjdc-proof">
      {proof.note ? <p className="pjdc-proof-note">“{proof.note}”</p> : null}
      {proof.images.length ? (
        <div className="pjdc-proof-images">
          {proof.images.map((image, index) => {
            const src = mediaSrc(image);
            return src ? (
              <a key={index} href={src} target="_blank" rel="noopener noreferrer" aria-label={`Open picture ${index + 1}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- proof pictures can be data URLs or the private media proxy */}
                <img src={src} alt={`Proof picture ${index + 1}`} loading="lazy" />
              </a>
            ) : null;
          })}
        </div>
      ) : null}
      {proof.links.map((link) => (
        <a key={link} className="pjdc-proof-link" href={link} target="_blank" rel="noopener noreferrer nofollow">
          <ExternalLink aria-hidden size={15} />
          <span>{linkText(link)}</span>
        </a>
      ))}
    </div>
  );
}

export function PjdcAvatar({
  name,
  photoUrl,
  status,
  size = "md",
}: {
  name: string;
  photoUrl?: string;
  status?: ProjectJdcStatus;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <span className={cn("pjdc-avatar", status && `is-${status}`, `is-${size}`)}>
      <ContactAvatar name={name} photoUrl={photoUrl} size={size} />
    </span>
  );
}

export function StatusPill({ status }: { status: ProjectJdcStatus }) {
  return <span className={cn("pjdc-status", `is-${status}`)}>{PROJECT_JDC_STATUS_LABELS[status]}</span>;
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className={cn("pjdc-bar", pct >= 100 && "is-full")}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
    >
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

function points(values: number[], width: number, height: number, pad = 4) {
  const max = Math.max(1, ...values);
  const stepX = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  return values.map((value, index) => {
    const x = pad + index * stepX;
    const y = pad + (1 - value / max) * (height - pad * 2);
    return [x, y] as const;
  });
}

/** A tiny trend line for a stat card, no axes or labels. */
export function Sparkline({ values, tone = "brand" }: { values: number[]; tone?: "brand" | "good" }) {
  const width = 108;
  const height = 36;
  const pts = points(values, width, height);
  const path = pts.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg className={cn("pjdc-spark", `is-${tone}`)} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <path d={path} fill="none" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      {last ? <circle cx={last[0]} cy={last[1]} r={2.6} /> : null}
    </svg>
  );
}

/** A small bar chart for a stat card, e.g. one bar per day of the week. */
export function MiniBars({ values, tone = "brand" }: { values: number[]; tone?: "brand" | "good" }) {
  const max = Math.max(1, ...values);
  return (
    <svg className={cn("pjdc-minibars", `is-${tone}`)} viewBox="0 0 108 36" aria-hidden>
      {values.map((value, index) => {
        const barWidth = 108 / values.length;
        const h = Math.max(2, (value / max) * 30);
        return <rect key={index} x={index * barWidth + barWidth * 0.2} y={34 - h} width={barWidth * 0.6} height={h} rx={1.5} />;
      })}
    </svg>
  );
}

/** A circular progress ring with the percentage in the middle, for one headline stat. */
export function DonutRing({ pct, size = 72 }: { pct: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  return (
    <svg className="pjdc-donut" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(clamped)} percent`}>
      <circle className="pjdc-donut-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" />
      <circle
        className="pjdc-donut-value"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" className="pjdc-donut-text">
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}

/** A filled line chart with day labels, for one week of activity. */
export function WeekLineChart({ values, labels }: { values: number[]; labels: string[] }) {
  const width = 560;
  const height = 140;
  const pts = points(values, width, height, 10);
  const linePath = pts.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1][0].toFixed(1)},${height - 10} L${pts[0][0].toFixed(1)},${height - 10} Z`;
  return (
    <svg className="pjdc-linechart" viewBox={`0 0 ${width} ${height + 20}`} preserveAspectRatio="none" aria-hidden>
      <path d={areaPath} className="pjdc-linechart-fill" />
      <path d={linePath} className="pjdc-linechart-line" fill="none" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], index) => (
        <circle key={index} cx={x} cy={y} r={3} className="pjdc-linechart-dot" />
      ))}
      {labels.map((label, index) => (
        <text key={label} x={pts[index][0]} y={height + 16} textAnchor="middle" className="pjdc-linechart-label">
          {label}
        </text>
      ))}
    </svg>
  );
}

/** A stepped progress bar with named milestones, e.g. the 30-day program broken into phases. */
export function MilestoneTrack({ pct, markers }: { pct: number; markers: Array<{ label: string; at: number }> }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="pjdc-milestones">
      <div className="pjdc-milestones-track">
        <span className="pjdc-milestones-fill" style={{ width: `${clamped}%` }} />
        {markers.map((marker) => (
          <span key={marker.label} className={cn("pjdc-milestones-dot", marker.at <= clamped && "is-reached")} style={{ left: `${marker.at}%` }} />
        ))}
      </div>
      <div className="pjdc-milestones-labels">
        {markers.map((marker) => (
          <span key={marker.label} className={cn(marker.at <= clamped && "is-reached")} style={{ left: `${marker.at}%` }}>
            {marker.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="pjdc-empty">
      <span className="pjdc-empty-icon" aria-hidden>
        {icon}
      </span>
      <p className="pjdc-empty-title">{title}</p>
      {children ? <div className="pjdc-empty-text">{children}</div> : null}
    </div>
  );
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

export function shortDate(iso: string | null | undefined) {
  if (!iso) return "Not yet";
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
}

function dayGap(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** "Due today", "Due in 3 days", "2 days late" for a deadline. */
export function dueText(dueDate: string, today: string) {
  const gap = dayGap(today, dueDate);
  if (gap === 0) return "Due today";
  if (gap === 1) return "Due tomorrow";
  if (gap > 1 && gap < 7) {
    return `Due ${new Date(`${dueDate}T00:00:00Z`).toLocaleDateString("en-PH", { weekday: "long", timeZone: "UTC" })}`;
  }
  if (gap >= 7) return `Due ${new Date(`${dueDate}T00:00:00Z`).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "UTC" })}`;
  return gap === -1 ? "1 day late" : `${-gap} days late`;
}

export function DueTag({ dueDate, today, done = false }: { dueDate: string | null; today: string; done?: boolean }) {
  if (!dueDate) return null;
  const late = !done && dueDate < today;
  const soon = !done && !late && dayGap(today, dueDate) <= 1;
  return <span className={cn("pjdc-due", late && "is-late", soon && "is-soon")}>{dueText(dueDate, today)}</span>;
}
