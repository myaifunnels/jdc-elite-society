export type WebinarRecord = {
  id: string;
  episodeNumber: number;
  seasonLabel: string;
  title: string;
  tagline: string;
  description: string;
  hostName: string;
  hostTitle: string;
  scheduledAt: string;
  thumbnailUrl: string;
  /** Where "Join via Zoom" links once a registrant's seat is confirmed. */
  zoomLink: string;
  /** Replay video link (e.g. YouTube/Vimeo/Drive), shown once the live session is over —
   * on the public "All episodes" library card and on a registrant's My Webinars dashboard. */
  replayUrl: string;
  interestedCount: number;
  isFeatured: boolean;
  totalSeats: number;
  /** Whether a confirmed registrant for this webinar gets University/community access (the same
   * standing as a paid Mastermind buyer) alongside their registration-confirmed message. On by
   * default; an admin can turn it off per webinar — e.g. a broad lead-gen webinar where they
   * don't want to hand out full community access, versus a qualified one where they do. */
  grantsUniversityAccess: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WebinarInput = Partial<Omit<WebinarRecord, "id" | "createdAt" | "updatedAt">> & {
  id?: string;
};

/** Price (PHP) for an overflow seat once a webinar's free seats are gone. */
export const WEBINAR_OVERFLOW_PRICE = 499;

/** The recurring Zoom room every webinar uses — shown alongside "Join via Zoom" for anyone who
 * joins by dialing in or entering the meeting manually in the Zoom app instead of the link. */
export const WEBINAR_ZOOM_MEETING_ID = "838 2522 3200";
export const WEBINAR_ZOOM_PASSCODE = "CoachJDC";

/** Manila-time date/time labels shared by the public webinars page and the registration
 * confirmation/reminder messages, so a webinar's date always reads the same way everywhere. */
export function formatWebinarDateLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatWebinarTimeLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
