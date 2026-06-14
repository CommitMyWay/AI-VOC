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

export interface AppState {
  phase: "search" | "confirm" | "loading" | "report";
  query: string;
  companies: string[];
  activeBlocks: BlockId[];
  filters: AppFilters;
  data: {
    [companyName: string]: CompanyData;
  };
  chatHistory: ChatMessage[];
  customBlocks?: CustomBlock[];
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
