export interface User {
  uid: string;
  email: string;
  displayName: string;
}

export interface SearchResult {
  title: string;
  snippet: string;
  pageid: number;
  url: string;
}

export interface AiKnowledgeSection {
  title: string;
  content: string;
}

export interface TopicImage {
  url: string;
  sourceType: "wikimedia-source" | "ai-generated" | "curated-asset" | "diagram";
  isAiGenerated: boolean;
  title: string;
  caption: string;
  attribution: string;
  aspectRatio: "16:9" | "4:3" | "1:1";
  prompt?: string;
  notice?: string;
  authorOrLicense?: string;
  category?: string;
}

export interface ImageGenerationStatus {
  available: boolean;
  reason?: string;
  message?: string;
  configurationGuide?: {
    service: string;
    models: string[];
    instructions: string;
  };
}

export interface AiKnowledgeArticle {
  title: string;
  tagline: string;
  category: string;
  summary: string;
  keyTakeaways: string[];
  sections: AiKnowledgeSection[];
  relatedTopics: string[];
  generatedAt: string;
  sourceType: "ai-synthesized";
  citationNote: string;
  heroImage?: TopicImage;
  sectionImages?: Record<string, TopicImage>;
}

export interface UnifiedSearchResponse {
  query: string;
  sourceUsed: "wikimedia" | "ai-fallback" | "ai-synthesized";
  isAiFallback: boolean;
  statusMessage: string;
  results: SearchResult[];
  aiArticle?: AiKnowledgeArticle;
  topicImage?: TopicImage;
  imageStatus?: ImageGenerationStatus;
}

export interface ArticleDetail {
  title: string;
  extract: string;
  description?: string;
  thumbnail?: string;
  content_urls: string;
  sourceImage?: TopicImage;
}

export interface Bookmark {
  id: string;
  userId: string;
  title: string;
  snippet: string;
  url: string;
  createdAt: string;
}

export interface SearchHistoryItem {
  id: string;
  userId: string;
  query: string;
  timestamp: string;
}

export interface RecentlyViewedItem {
  id: string;
  userId: string;
  title: string;
  url: string;
  viewedAt: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  category: string;
  thumbnail?: string;
  author?: string;
  isBreaking?: boolean;
}
