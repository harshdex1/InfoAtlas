export type UserRole = "admin" | "developer" | "editor" | "user";
export type AuthProviderType = "google" | "password" | "guest";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role?: UserRole;
  photoURL?: string;
  provider?: AuthProviderType;
  isEmailVerified?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface StoredUserAccount extends User {
  password?: string;
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
  newsArticles?: NewsArticle[];
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

export interface NewsArticleSection {
  heading: string;
  content: string;
}

export interface NewsArticleDetail {
  id: string;
  title: string;
  subtitle?: string;
  overview: string;
  description?: string;
  url: string;
  source: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  thumbnail?: string;
  author?: string;
  fullTextAvailable: boolean;
  isSummary?: boolean;
  sections: NewsArticleSection[];
  keyFacts: string[];
  relatedStories?: NewsArticle[];
  sourceCitations?: { title: string; url: string }[];
}

export interface CricketInnings {
  teamName: string;
  inningsNumber: number;
  runs: number | string;
  wickets: number | string;
  overs: string;
  declared?: boolean;
  batting?: {
    playerName: string;
    runs: number | string;
    balls: number | string;
    fours?: number | string;
    sixes?: number | string;
    strikeRate?: string;
    dismissal?: string;
  }[];
  bowling?: {
    bowlerName: string;
    overs: string;
    maidens?: number | string;
    runs: number | string;
    wickets: number | string;
    economy?: string;
  }[];
  fallOfWickets?: string[];
  extras?: string;
}

export interface CricketMatch {
  id: string;
  title: string;
  team1: {
    name: string;
    shortName?: string;
    flagEmoji?: string;
    score?: string;
    overs?: string;
  };
  team2: {
    name: string;
    shortName?: string;
    flagEmoji?: string;
    score?: string;
    overs?: string;
  };
  competition: string;
  series?: string;
  format: "Test" | "ODI" | "T20" | "First-Class" | "List-A";
  scope: "International" | "Domestic";
  gender: "Men" | "Women";
  status: "LIVE" | "UPCOMING" | "COMPLETED" | "POSTPONED" | "ABANDONED";
  statusNote?: string;
  venue?: string;
  dateTime?: string;
  result?: string;
  winningMargin?: string;
  toss?: string;
  playerOfTheMatch?: string;
  currentInnings?: string;
  battingFiguresSummary?: string;
  bowlingFiguresSummary?: string;
  timeline?: string[];
  innings?: CricketInnings[];
  keyPartnerships?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  lastUpdated?: string;
}

export interface CricketSeries {
  id: string;
  name: string;
  format: string;
  scope: "International" | "Domestic";
  gender: "Men" | "Women";
  dates: string;
  teams: string[];
  status: "Ongoing" | "Upcoming" | "Completed";
  summary: string;
  sourceUrl?: string;
}

export interface CricketTeam {
  name: string;
  shortName: string;
  scope: "International" | "Domestic";
  captain?: string;
  coach?: string;
  recentForm?: string;
  ranking?: string;
}

export interface CricketGroundedReport {
  query: string;
  headline: string;
  overview: string;
  matches: CricketMatch[];
  seriesList?: CricketSeries[];
  teamsList?: CricketTeam[];
  sources: { title: string; url: string }[];
  updatedAt: string;
  disclaimer: string;
}

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  historyId?: string;
  internalDate?: string;
  from?: string;
  fromName?: string;
  to?: string;
  subject?: string;
  date?: string;
  isUnread?: boolean;
  isStarred?: boolean;
  labelIds?: string[];
  bodyHtml?: string;
  bodyText?: string;
}

export interface GmailUserProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailLabel {
  id: string;
  name: string;
  type?: "system" | "user";
  messagesTotal?: number;
  messagesUnread?: number;
}

export interface AppDynamicConfig {
  appTagline: string;
  announcementBanner: {
    enabled: boolean;
    text: string;
    linkUrl?: string;
    badgeText?: string;
    variant?: "primary" | "amber" | "emerald" | "rose" | "indigo" | "cyan";
  };
  accentColor: "indigo" | "emerald" | "cyan" | "violet" | "rose" | "amber";
  featureToggles: {
    cricket: boolean;
    sports: boolean;
    gmail: boolean;
    localNews: boolean;
    knowledge: boolean;
    aiAssistant: boolean;
    breakingTicker: boolean;
  };
  breakingAlerts: string[];
  customCategories: string[];
  aiSettings: {
    modelPreference: string;
    temperature: number;
    searchFallbackPriority: "ai-first" | "wikimedia-first";
  };
  updatedAt: string;
  updatedBy?: string;
  changeLog?: { timestamp: string; summary: string; changedBy: string }[];
}

export interface PublishedNewsArticle extends NewsArticle {
  subtitle?: string;
  overview?: string;
  fullContent?: string;
  sections?: { heading: string; content: string }[];
  keyFacts?: string[];
  targetTab: "home" | "news" | "local-news" | "sports" | "cricket" | "knowledge";
  targetState?: string;
  targetDistrict?: string;
  authorRole?: "editor" | "developer" | "admin";
  publishedByEmail?: string;
  publishedByName?: string;
  isEditorialExclusive?: boolean;
}

export interface SocialVideoItem {
  id: string;
  title: string;
  description?: string;
  platform: "youtube" | "instagram" | "tiktok" | "x" | "reddit";
  channelName: string;
  channelHandle?: string;
  channelAvatar?: string;
  thumbnailUrl: string;
  videoUrl: string;
  embedUrl?: string;
  youtubeId?: string;
  duration?: string;
  viewCount?: string;
  publishedTimeAgo?: string;
  tags?: string[];
  isVerified?: boolean;
}

export interface RelatedVideosResponse {
  query: string;
  videos: SocialVideoItem[];
  platformQuickLinks: {
    youtube: string;
    instagram: string;
    tiktok: string;
    x: string;
    reddit: string;
  };
}

