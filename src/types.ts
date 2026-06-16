export interface Insight {
  topic: string;
  severity: "high" | "medium" | "low";
  text: string;
}

export interface CompanyData {
  rating: number;
  reviewCount: number;
  sentimentBreakdown: {
    pos: number;
    neu: number;
    neg: number;
  };
  topicCounts: {
    [topic: string]: number;
  };
  trendData: number[]; // 30 values (e.g. daily negative sentiment % values)
  insights: Insight[];
  actions: {
    PO: string[];
    QA: string[];
    Marketing: string[];
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: number;
  citations?: { source: string; text: string }[];
}

// Allowed Block IDs
export type BlockId = "metrics" | "insights" | "sentiment_pie" | "topic_bar" | "trend" | "actions";

export interface AppFilters {
  sentiment: "all" | "positive" | "neutral" | "negative";
  dateRange: "7d" | "30d" | "90d";
  sources: string[];
}

export interface CustomBlock {
  id: string;
  title: string;
  data: {
    [companyName: string]: {
      rating: number;
      severity: "high" | "medium" | "low";
      summary: string;
      points: string[];
    };
  };
}

export interface ClarifyQuestion {
  key: string;
  type: "single_select" | "multi_select" | "text" | "boolean";
  question: string;
  choices: string[];
  recommended: string | null;
  allow_other: boolean;
}

export interface ClarifyStep {
  step_id: string;
  title: string;
  question: ClarifyQuestion;
}

export interface ResolvedApp {
  name: string;
  playId: string | null;
  appStoreId: string | null;
  iconUrl: string | null;
  verified: boolean;
}

export type ReportStatus = "pending" | "running" | "ready" | "error";

export interface MarketView {
  totalApps: number;
  totalReviews: number;
  sentimentBreakdown: {
    pos: number;
    neu: number;
    neg: number;
  };
  topTopics: Array<{
    topic: string;
    count: number;
  }>;
}

export interface UnderstandIntent {
  subject: string;
  market: string;
  competitors: string[];
  audience: string;
  objective: string;
  focus: string;
  data_sources: string[];
  filters: {
    time_range: string;
    sentiment: string;
    keywords: string[];
  };
}

export interface SetupState {
  sessionId: string | null;
  currentStep: number;
  reason: string | null;
  steps: ClarifyStep[];
  answers: Record<string, string | string[] | boolean>;
  intent: UnderstandIntent | null;
  apps: ResolvedApp[];
  summary: string;
}

export interface AppState {
  phase: "search" | "clarify" | "confirm" | "loading" | "report";
  query: string;
  companies: string[];
  activeBlocks: BlockId[];
  filters: AppFilters;
  data: {
    [companyName: string]: CompanyData;
  };
  chatHistory: ChatMessage[];
  customBlocks?: CustomBlock[];
  setup?: SetupState;
  reportId?: string | null;
  reportStatus?: ReportStatus;
  market?: MarketView | null;
}

export interface ClassificationAction {
  type: "ASK" | "ADD_BLOCK" | "REMOVE_BLOCK" | "ADD_COMPANY" | "REMOVE_COMPANY" | "FILTER" | "ADD_CUSTOM_BLOCK";
  payload: {
    block_id?: BlockId;
    company_name?: string;
    filter_key?: "sentiment" | "dateRange" | "sources";
    filter_value?: string;
    answer?: string;
    custom_block_title?: string;
    custom_block_prompt?: string;
    citations?: { source: string; text: string }[];
  };
}
