export type ReviewSource = "google_play" | "app_store" | "youtube" | "reddit" | "tinhte" | "voz";
export type ReviewSentiment = "positive" | "neutral" | "negative";

export type RawReview = {
  id: string;
  source: ReviewSource;
  app: string;
  author: string | null;
  rating: number | null;
  content: string;
  publishedAt: number | null;
  sourceUrl: string;
  rawJson?: unknown;
};

export type Classification = {
  reviewId: string;
  topic: string;
  sentiment: ReviewSentiment;
  confidence: number;
  modelUsed: string;
};

export type CrawlRequest = {
  apps: string[];
  goal: string;
  focus_area?: string;
  cutoffDays: number;
};

export type ResolvedApp = {
  name: string;
  playId: string | null;
  appStoreId: string | null;
  iconUrl: string | null;
  verified: boolean;
};

export type FetchResult = {
  reviews: RawReview[];
  sourcesUsed: ReviewSource[];
  failed: { source: ReviewSource; reason: string }[];
};

export type TopicMetrics = {
  topic: string;
  count: number;
};

export type CompanyData = {
  rating: number;
  reviewCount: number;
  sentimentBreakdown: {
    pos: number;
    neu: number;
    neg: number;
  };
  topicCounts: Record<string, number>;
  trendData: number[];
  insights: { topic: string; severity: "high" | "medium" | "low"; text: string }[];
  actions: { PO: string[]; QA: string[]; Marketing: string[] };
};

export type MarketView = {
  totalApps: number;
  totalReviews: number;
  sentimentBreakdown: {
    pos: number;
    neu: number;
    neg: number;
  };
  topTopics: TopicMetrics[];
};
