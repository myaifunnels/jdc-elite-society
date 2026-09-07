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
  ctaLabel: string;
  ctaHref: string;
  /** Where "Join via Zoom" links once a registrant's seat is confirmed — separate from ctaHref,
   * which is a more general (and for the seeded event, non-Zoom) external link. */
  zoomLink: string;
  interestedCount: number;
  isFeatured: boolean;
  totalSeats: number;
  createdAt: string;
  updatedAt: string;
};

export type WebinarInput = Partial<Omit<WebinarRecord, "id" | "createdAt" | "updatedAt">> & {
  id?: string;
};

/** Price (PHP) for an overflow seat once a webinar's free seats are gone. */
export const WEBINAR_OVERFLOW_PRICE = 499;
