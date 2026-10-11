import { SearchResult, ArticleDetail, NewsArticle, UnifiedSearchResponse, AiKnowledgeArticle, TopicImage, ImageGenerationStatus } from "../types";

export async function fetchTopicImage(
  topic: string,
  options?: { context?: string; category?: string; forceAi?: boolean; aspect?: "16:9" | "4:3" | "1:1" }
): Promise<{ image: TopicImage | null; status?: ImageGenerationStatus }> {
  try {
    const params = new URLSearchParams({ topic });
    if (options?.context) params.append("context", options.context);
    if (options?.category) params.append("category", options.category);
    if (options?.forceAi) params.append("forceAi", "true");
    if (options?.aspect) params.append("aspect", options.aspect);

    const res = await fetch(`/api/knowledge/image?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to resolve topic image");
    const data = await res.json();
    return { image: data.image, status: data.status };
  } catch (err) {
    console.error("fetchTopicImage error:", err);
    return { image: null };
  }
}

export async function generateTopicImageOnDemand(
  topic: string,
  options?: { context?: string; category?: string; aspect?: "16:9" | "4:3" | "1:1" }
): Promise<{ image: TopicImage | null; status?: ImageGenerationStatus }> {
  try {
    const res = await fetch("/api/knowledge/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        context: options?.context,
        category: options?.category,
        aspect: options?.aspect || "16:9",
      }),
    });
    if (!res.ok) throw new Error("Failed to generate AI image");
    const data = await res.json();
    return { image: data.image, status: data.status };
  } catch (err) {
    console.error("generateTopicImageOnDemand error:", err);
    return { image: null };
  }
}

export async function searchKnowledge(query: string): Promise<UnifiedSearchResponse> {
  try {
    const res = await fetch(`/api/knowledge/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Failed to search knowledge");
    const data: UnifiedSearchResponse = await res.json();
    return data;
  } catch (err) {
    console.error("Unified knowledge search error:", err);
    return {
      query,
      sourceUsed: "ai-fallback",
      isAiFallback: true,
      statusMessage: "Encountered search connectivity error. Querying AI knowledge synthesizer.",
      results: [],
    };
  }
}

export async function generateAiKnowledgeArticleApi(query: string, context?: string): Promise<AiKnowledgeArticle | null> {
  try {
    const res = await fetch("/api/knowledge/ai-article", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, context }),
    });
    if (!res.ok) throw new Error("Failed to synthesize AI article");
    const data = await res.json();
    return data.article;
  } catch (err) {
    console.error("AI article generation error:", err);
    return null;
  }
}

export async function searchWikipedia(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(`/api/wikipedia/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Failed to search Wikipedia");
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error("Search error:", err);
    return [];
  }
}

export async function getWikipediaArticle(title: string): Promise<ArticleDetail | null> {
  try {
    const res = await fetch(`/api/wikipedia/article?title=${encodeURIComponent(title)}`);
    if (!res.ok) throw new Error("Failed to fetch article");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Article fetch error:", err);
    return null;
  }
}

export async function fetchNewsArticles(category: string = "all", query: string = ""): Promise<NewsArticle[]> {
  try {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (query) params.append("q", query);

    const res = await fetch(`/api/news/feed?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch news feed");
    const data = await res.json();
    return data.articles || [];
  } catch (err) {
    console.error("News fetch error:", err);
    return [];
  }
}

export async function askGemini(prompt: string, context?: string, systemInstruction?: string): Promise<string> {
  try {
    const res = await fetch("/api/gemini/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, context, systemInstruction }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to generate AI response");
    return data.text;
  } catch (err: any) {
    console.error("AI Error:", err);
    return `Error: ${err.message || "Unable to reach AI assistant."}`;
  }
}
