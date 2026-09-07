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
  interestedCount: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WebinarInput = Partial<Omit<WebinarRecord, "id" | "createdAt" | "updatedAt">> & {
  id?: string;
};
