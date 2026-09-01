export const MANILA_TZ = "Asia/Manila";
export const DEFAULT_COMMISSION_RATE = 0.2;

export type PayCycle = {
  periodStart: string;
  periodEnd: string;
  scheduledPayDate: string;
  label: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function manilaYmd(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function parseYmd(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  return { year, month, day };
}

export function lastDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function secondCyclePayDay(year: number, month: number) {
  return Math.min(30, lastDayOfMonth(year, month));
}

export function formatYmd(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function cycleForYmd(ymd: string): PayCycle {
  const { year, month, day } = parseYmd(ymd);

  if (day <= 15) {
    return {
      periodStart: formatYmd(year, month, 1),
      periodEnd: formatYmd(year, month, 15),
      scheduledPayDate: formatYmd(year, month, 15),
      label: "1–15",
    };
  }

  const last = lastDayOfMonth(year, month);
  const payDay = secondCyclePayDay(year, month);
  return {
    periodStart: formatYmd(year, month, 16),
    periodEnd: formatYmd(year, month, last),
    scheduledPayDate: formatYmd(year, month, payDay),
    label: "16–end",
  };
}

export function nextPayDate(ymd = manilaYmd()) {
  const { year, month, day } = parseYmd(ymd);
  const second = secondCyclePayDay(year, month);

  if (day <= 15) {
    return formatYmd(year, month, 15);
  }

  if (day <= second) {
    return formatYmd(year, month, second);
  }

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return formatYmd(nextYear, nextMonth, 15);
}

export function followingPayDate(ymd = manilaYmd()) {
  const next = nextPayDate(ymd);
  const { year, month, day } = parseYmd(next);

  if (day === 15) {
    return formatYmd(year, month, secondCyclePayDay(year, month));
  }

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return formatYmd(nextYear, nextMonth, 15);
}

export function cycleForPayDate(scheduledPayDate: string): PayCycle {
  const { year, month, day } = parseYmd(scheduledPayDate);
  if (day <= 15) {
    return cycleForYmd(formatYmd(year, month, 1));
  }
  return cycleForYmd(formatYmd(year, month, 16));
}

export function formatManilaDate(ymd: string) {
  const { year, month, day } = parseYmd(ymd);
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatPhp(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(amount);
}

export const PAYOUT_COPY =
  "You earn 20% on recorded sales. Payouts are reviewed and released on the 15th and 30th of each month (last day of February). Nothing is deposited automatically.";
