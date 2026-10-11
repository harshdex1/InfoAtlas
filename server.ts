import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "2mb" }));

// Initialize Gemini SDK on server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "InfoAtlas/1.0",
    },
  },
});

// API Routes: Gemini
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { prompt, systemInstruction, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const fullPrompt = context
      ? `Context / Article Content:\n${context}\n\nUser Question / Request:\n${prompt}`
      : prompt;

    const modelsToTry = ["gemini-2.5-flash", "gemini-3.8-flash", "gemini-3.1-flash-lite"];
    let generatedText = "";
    let lastError: any = null;

    for (const m of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: m,
          contents: fullPrompt,
          config: {
            systemInstruction:
              systemInstruction ||
              "You are InfoAtlas AI, an expert, rigorous, and clear knowledge and news assistant. Provide well-structured, accurate explanations, summaries, and journalistic insights grounded in the provided context.",
            temperature: 0.7,
          },
        });
        if (response && response.text) {
          generatedText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini API] Failed with ${m}:`, err?.message || err);
      }
    }

    if (generatedText) {
      res.json({ text: generatedText });
    } else {
      throw lastError || new Error("Failed to generate response across candidate models.");
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate AI response. Please ensure API key is configured.",
    });
  }
});

function parseStructuredAiArticle(rawText: string, query: string) {
  const getMatch = (tag: string) => {
    const r = new RegExp(`^${tag}:\\s*(.*?)$`, "im");
    const m = rawText.match(r);
    return m ? m[1].trim() : "";
  };

  const title = getMatch("TITLE") || query;
  const tagline = getMatch("TAGLINE") || `Encyclopedic exploration of ${query}`;
  const category = getMatch("CATEGORY") || "Science & Knowledge";

  let summary = "";
  const sumMatch = rawText.match(/SUMMARY:\s*([\s\S]*?)(?=KEY TAKEAWAYS:|SECTION:|$)/i);
  if (sumMatch) summary = sumMatch[1].trim();
  if (!summary) summary = `Detailed overview and structured analysis of ${query}.`;

  const keyTakeaways: string[] = [];
  const takeMatch = rawText.match(/KEY TAKEAWAYS:\s*([\s\S]*?)(?=SECTION:|$)/i);
  if (takeMatch) {
    const lines = takeMatch[1].split("\n");
    for (const l of lines) {
      const clean = l.replace(/^[-*•\d.]+\s*/, "").trim();
      if (clean) keyTakeaways.push(clean);
    }
  }
  if (keyTakeaways.length === 0) {
    keyTakeaways.push(`Core conceptual framework of ${query}`);
    keyTakeaways.push(`Key definitions, context, and applications`);
  }

  const sections: { title: string; content: string }[] = [];
  const secRegex = /SECTION:\s*([^\n]+)\n([\s\S]*?)(?=(?:SECTION:|RELATED:|$))/gi;
  let secM: RegExpExecArray | null;
  while ((secM = secRegex.exec(rawText)) !== null) {
    sections.push({
      title: secM[1].trim(),
      content: secM[2].trim(),
    });
  }
  if (sections.length === 0) {
    sections.push({
      title: "Comprehensive Overview",
      content: rawText.replace(/TITLE:.*|TAGLINE:.*|CATEGORY:.*|SUMMARY:.*|KEY TAKEAWAYS:.*|RELATED:.*/gi, "").trim() || `In-depth analysis for ${query}.`,
    });
  }

  let relatedTopics: string[] = [];
  const relMatch = rawText.match(/RELATED:\s*(.*)/i);
  if (relMatch) {
    relatedTopics = relMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (relatedTopics.length === 0) {
    relatedTopics = [query];
  }

  return {
    title,
    tagline,
    category,
    summary,
    keyTakeaways,
    sections,
    relatedTopics,
    generatedAt: new Date().toISOString(),
    sourceType: "ai-synthesized" as const,
    citationNote: "Synthesized with InfoAtlas AI Knowledge Engine.",
  };
}

// In-memory cache for resolved topic images (prevents redundant fetches/generation on refresh)
const TOPIC_IMAGE_CACHE = new Map<string, any>();

// Curated high-fidelity educational illustrations created with image generation
const CURATED_TOPIC_IMAGES: Record<string, any> = {
  "quantum computing": {
    url: "/src/assets/images/quantum_computing_1791725806649.jpg",
    sourceType: "curated-asset",
    isAiGenerated: true,
    title: "Quantum Computing & Superposition",
    caption: "AI-generated conceptual scientific illustration of quantum superposition, Bloch sphere, and quantum circuits.",
    attribution: "InfoAtlas AI Synthesis Engine (Google Imagen / Gemini)",
    aspectRatio: "16:9",
    prompt: "A high-clarity conceptual educational illustration of quantum computing with glowing qubits, Bloch sphere, quantum circuits and superposition.",
    notice: "Conceptual scientific visualization designed for educational clarity.",
  },
  "solar system": {
    url: "/src/assets/images/solar_system_1791725827463.jpg",
    sourceType: "curated-asset",
    isAiGenerated: true,
    title: "The Solar System & Planetary Orbits",
    caption: "AI-generated scientific illustration depicting the Sun and orbiting planets in the Solar System.",
    attribution: "InfoAtlas AI Synthesis Engine (Google Imagen / Gemini)",
    aspectRatio: "16:9",
    prompt: "An educational scientific illustration of the solar system showing the Sun and orbiting planets with orbit paths in deep space.",
    notice: "Astronomical educational illustration designed for scientific visualization.",
  },
  "photosynthesis": {
    url: "/src/assets/images/photosynthesis_1791725839910.jpg",
    sourceType: "curated-asset",
    isAiGenerated: true,
    title: "Photosynthesis Mechanism & Chloroplast Cycle",
    caption: "AI-generated educational diagram of photosynthesis showing light reactions, carbon fixation, and cellular chemistry.",
    attribution: "InfoAtlas AI Synthesis Engine (Google Imagen / Gemini)",
    aspectRatio: "16:9",
    prompt: "An educational scientific diagram of photosynthesis showing sunlight entering plant leaves, chloroplast structures, and molecular synthesis.",
    notice: "Educational conceptual diagram designed for scientific clarity.",
  },
  "black hole": {
    url: "/src/assets/images/black_hole_1791725857506.jpg",
    sourceType: "curated-asset",
    isAiGenerated: true,
    title: "Supermassive Black Hole & Accretion Disk",
    caption: "AI-generated visualization of a rotating black hole, relativistic jets, and gravitational lensing.",
    attribution: "InfoAtlas AI Synthesis Engine (Google Imagen / Gemini)",
    aspectRatio: "16:9",
    prompt: "A scientifically inspired astronomical visualization of a rotating supermassive black hole with glowing accretion disk and relativistic beaming.",
    notice: "Astrophysical simulation and conceptual model.",
  },
  "black holes": {
    url: "/src/assets/images/black_hole_1791725857506.jpg",
    sourceType: "curated-asset",
    isAiGenerated: true,
    title: "Supermassive Black Hole & Accretion Disk",
    caption: "AI-generated visualization of a rotating black hole, relativistic jets, and gravitational lensing.",
    attribution: "InfoAtlas AI Synthesis Engine (Google Imagen / Gemini)",
    aspectRatio: "16:9",
    prompt: "A scientifically inspired astronomical visualization of a rotating supermassive black hole with glowing accretion disk and relativistic beaming.",
    notice: "Astrophysical simulation and conceptual model.",
  },
  "artificial intelligence": {
    url: "/src/assets/images/artificial_intelligence_1791725869538.jpg",
    sourceType: "curated-asset",
    isAiGenerated: true,
    title: "Artificial Intelligence & Neural Architectures",
    caption: "AI-generated conceptual illustration of deep neural networks, synaptic graph connections, and cognitive algorithms.",
    attribution: "InfoAtlas AI Synthesis Engine (Google Imagen / Gemini)",
    aspectRatio: "16:9",
    prompt: "A modern conceptual educational illustration of artificial intelligence and deep neural networks with cognitive synaptic pathways.",
    notice: "Conceptual algorithmic illustration.",
  },
};

function normalizeTopicKey(str: string): string {
  return str
    .toLowerCase()
    .replace(/^(what is|what are|explain|who is|history of|how does|how do|definition of)\s+/i, "")
    .replace(/[?!.,;:]/g, "")
    .trim();
}

function constructEducationalImagePrompt(topic: string, context?: string, category?: string): string {
  const combined = `${topic} ${category || ""}`.toLowerCase();
  const isHistory = /history|ancient|empire|war|dynasty|century|king|queen|revolution|civilization|rome|greece|egypt/i.test(combined);
  const isScience = /quantum|physics|biology|chemistry|cell|atom|space|planet|star|astronomy|neuroscience|dna|molecule/i.test(combined);
  const isTech = /computing|algorithm|software|ai|robot|network|internet|crypto|chip|silicon|machine/i.test(combined);

  if (isHistory) {
    return `An authentic, museum-grade historical educational illustration depicting ${topic}. Period-accurate architecture, attire, and setting, respectful educational reconstruction, high clarity, 16:9 aspect ratio, no floating letters or unreadable text.`;
  } else if (isScience) {
    return `An authoritative educational scientific visualization of ${topic}. Showing clear physical principles and structures, clean modern infographic aesthetic, high resolution, 16:9 aspect ratio, no pseudo-text.`;
  } else if (isTech) {
    return `A sleek, modern educational conceptual illustration of ${topic} and its underlying mechanisms, balanced digital aesthetic, 16:9 aspect ratio, no unreadable pseudo-text.`;
  }
  return `A clear, high-quality educational illustration representing ${topic}${context ? ` in context of: ${context.substring(0, 80)}` : ""}, centered composition, encyclopedic clarity, 16:9 aspect ratio, no messy text.`;
}

// Intelligent image resolver implementing 5-step process
async function resolveTopicImage(
  topic: string,
  context?: string,
  category?: string,
  forceAi = false,
  preferredAspect: "16:9" | "4:3" | "1:1" = "16:9"
): Promise<{ image: any; status: any }> {
  const normKey = normalizeTopicKey(topic);
  const cacheKey = `${normKey}_${preferredAspect}_${forceAi ? "ai" : "auto"}`;

  // STEP 4 CHECK: Check cache first (avoids repeated requests/costs)
  if (TOPIC_IMAGE_CACHE.has(cacheKey)) {
    return TOPIC_IMAGE_CACHE.get(cacheKey);
  }

  // Check curated topic illustrations if not forcing external AI
  if (!forceAi) {
    for (const [key, asset] of Object.entries(CURATED_TOPIC_IMAGES)) {
      if (normKey === key || normKey.includes(key) || key.includes(normKey)) {
        const result = {
          image: {
            ...asset,
            title: topic,
            aspectRatio: preferredAspect,
          },
          status: { available: true },
        };
        TOPIC_IMAGE_CACHE.set(cacheKey, result);
        return result;
      }
    }
  }

  // STEP 1 & 2: Check whether a relevant image is available from verified source (Wikipedia / Wikimedia Commons)
  let verifiedImage: any = null;
  if (!forceAi) {
    try {
      // 1. Check Wikipedia REST summary
      const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
      const sumRes = await fetch(sumUrl, {
        headers: { "User-Agent": "InfoAtlas/1.0 (contact@infoatlas.app)" },
        signal: AbortSignal.timeout(4000),
      });
      if (sumRes.ok) {
        const sumData: any = await sumRes.json();
        const imgUrl = sumData.originalimage?.source || sumData.thumbnail?.source;
        if (imgUrl) {
          verifiedImage = {
            url: imgUrl,
            sourceType: "wikimedia-source",
            isAiGenerated: false,
            title: sumData.title || topic,
            caption: sumData.description ? `${sumData.title}: ${sumData.description}` : `Authentic knowledge reference image for ${sumData.title || topic}`,
            attribution: "Wikimedia Commons & Wikipedia Open Knowledge",
            aspectRatio: preferredAspect,
            authorOrLicense: "Creative Commons / Public Domain via Wikimedia",
          };
        }
      }

      // 2. If not found, search Wikimedia Commons for educational diagrams/photos
      if (!verifiedImage) {
        const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
          topic
        )}&gsrnamespace=6&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=1200&format=json&origin=*`;
        const commRes = await fetch(commonsUrl, {
          headers: { "User-Agent": "InfoAtlas/1.0 (contact@infoatlas.app)" },
          signal: AbortSignal.timeout(4000),
        });
        if (commRes.ok) {
          const commData: any = await commRes.json();
          const pages = commData?.query?.pages || {};
          const items = Object.values(pages) as any[];
          const validItem = items.find((p) => {
            const url = p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url;
            const mime = p.imageinfo?.[0]?.mime || "";
            return url && (mime.startsWith("image/jpeg") || mime.startsWith("image/png") || mime.startsWith("image/svg"));
          });

          if (validItem) {
            const info = validItem.imageinfo[0];
            const meta = info.extmetadata || {};
            const cleanTitle = (validItem.title || "").replace(/^File:/i, "").replace(/\.[^/.]+$/, "").replace(/_/g, " ");
            verifiedImage = {
              url: info.thumburl || info.url,
              sourceType: "wikimedia-source",
              isAiGenerated: false,
              title: cleanTitle || topic,
              caption: meta.ObjectName?.value || meta.ImageDescription?.value?.replace(/<\/?[^>]+(>|$)/g, "") || `Educational archive illustration for ${topic}`,
              attribution: meta.Artist?.value ? `By ${meta.Artist.value.replace(/<\/?[^>]+(>|$)/g, "")} (Wikimedia Commons)` : "Wikimedia Commons Open Educational Archive",
              aspectRatio: preferredAspect,
              authorOrLicense: meta.LicenseShortName?.value || "Open Educational License",
            };
          }
        }
      }
    } catch (wikiImgErr) {
      console.warn("Source image verification failed:", wikiImgErr);
    }
  }

  // STEP 3: If a suitable image exists, return it
  if (verifiedImage && !forceAi) {
    const result = {
      image: verifiedImage,
      status: { available: true },
    };
    TOPIC_IMAGE_CACHE.set(cacheKey, result);
    return result;
  }

  // STEP 4: If no suitable image exists (or forceAi), request AI-generated image
  const imagePrompt = constructEducationalImagePrompt(topic, context, category);
  const imageCandidateModels = ["gemini-3.1-flash-lite-image", "gemini-nano-banana-2.1", "gemini-3-pro-image"];
  let aiGeneratedImage: any = null;
  let lastImageError: any = null;

  for (const model of imageCandidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [{ text: imagePrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: preferredAspect,
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      const imgPart = parts.find((p: any) => p.inlineData);
      if (imgPart && imgPart.inlineData) {
        const mime = imgPart.inlineData.mimeType || "image/jpeg";
        const base64Data = imgPart.inlineData.data;
        const dataUrl = `data:${mime};base64,${base64Data}`;
        aiGeneratedImage = {
          url: dataUrl,
          sourceType: "ai-generated",
          isAiGenerated: true,
          title: topic,
          caption: `AI-generated conceptual illustration of ${topic}`,
          attribution: `InfoAtlas AI Image Engine (${model})`,
          aspectRatio: preferredAspect,
          prompt: imagePrompt,
          notice: "Artistic conceptual illustration generated by AI model. Not an authentic photograph.",
        };
        break;
      }
    } catch (err: any) {
      lastImageError = err;
      console.warn(`[ImageGen] Generation failed with ${model}:`, err?.status || err?.message);
    }
  }

  // STEP 5: Display generated image when generation succeeds
  if (aiGeneratedImage) {
    const result = {
      image: aiGeneratedImage,
      status: { available: true },
    };
    TOPIC_IMAGE_CACHE.set(cacheKey, result);
    return result;
  }

  // Fallback / explanation when model quota requires paid tier
  const isQuotaIssue = lastImageError?.status === 429 || (lastImageError?.message && lastImageError.message.includes("quota"));
  const imageStatus = {
    available: false,
    reason: isQuotaIssue ? "paid_tier_required" : "generation_unavailable",
    message: isQuotaIssue
      ? "Gemini image generation models (gemini-3.1-flash-lite-image / gemini-nano-banana-2.1) require an API key with billing enabled in Google AI Studio."
      : lastImageError?.message || "Image generation service temporarily unavailable.",
    configurationGuide: {
      service: "Google AI Studio / Gemini API",
      models: ["gemini-3.1-flash-lite-image", "gemini-nano-banana-2.1"],
      instructions: "To enable server-side Gemini image generation, configure a Gemini API key with billing enabled in Google AI Studio or Settings > Secrets.",
    },
  };

  // If a verified source image was previously found, use it as fallback
  if (verifiedImage) {
    const result = {
      image: verifiedImage,
      status: imageStatus,
    };
    TOPIC_IMAGE_CACHE.set(cacheKey, result);
    return result;
  }

  // Fallback: Return clean diagram metadata
  const fallbackResult = {
    image: {
      url: "",
      sourceType: "diagram" as const,
      isAiGenerated: false,
      title: topic,
      caption: `Educational topic concept: ${topic}`,
      attribution: "InfoAtlas Knowledge Repository",
      aspectRatio: preferredAspect,
      category: category || "General Knowledge",
    },
    status: imageStatus,
  };

  TOPIC_IMAGE_CACHE.set(cacheKey, fallbackResult);
  return fallbackResult;
}

// Helper function to synthesize a structured AI Knowledge Article using Gemini
async function generateAiKnowledgeArticle(query: string, hintContext?: string) {
  const structuredPrompt = `You are the InfoAtlas AI Knowledge Synthesizer. Synthesize a comprehensive, authoritative encyclopedic reference article for the query: "${query}".
${hintContext ? `Context details: ${hintContext}\n` : ""}
Provide your response strictly adhering to this format:

TITLE: <Authoritative Topic Title>
TAGLINE: <Crisp one-sentence definition or essence>
CATEGORY: <Domain, e.g. Space Exploration, Quantum Physics, World History, Computing, Medicine>
SUMMARY:
<2 thorough paragraphs providing definition, core foundation, and significance>

KEY TAKEAWAYS:
- <Key takeaway 1>
- <Key takeaway 2>
- <Key takeaway 3>
- <Key takeaway 4>

SECTION: Origins, Context & Background
<Detailed analytical paragraphs>

SECTION: Mechanism, Principles & Architecture
<Detailed analytical paragraphs>

SECTION: Real-World Applications & Modern Frontiers
<Detailed analytical paragraphs>

RELATED: <4 related topics separated by commas>`;

  const candidateModels = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash", "gemini-2.5-flash"];
  let parsedArticle: any = null;

  for (const modelName of candidateModels) {
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model: modelName,
          contents: structuredPrompt,
          config: {
            maxOutputTokens: 2200,
            temperature: 0.3,
          },
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout generating AI article")), 9000)),
      ]);

      const rawText = (response.text || "").trim();
      if (rawText.length > 50) {
        parsedArticle = parseStructuredAiArticle(rawText, query);
        break;
      }
    } catch (err: any) {
      console.warn(`[AI Article] Synthesis failed with ${modelName}:`, err?.message || err);
    }
  }

  if (!parsedArticle) {
    parsedArticle = {
      title: query,
      tagline: `Encyclopedic analysis for ${query}`,
      category: "Knowledge & Research",
      summary: `Comprehensive reference information on ${query} synthesized by InfoAtlas Knowledge Assistant.`,
      keyTakeaways: [
        `Key conceptual framework for ${query}`,
        `Synthesized knowledge from InfoAtlas AI Engine`,
      ],
      sections: [
        {
          title: "Overview & Conceptual Definition",
          content: `Comprehensive knowledge report for "${query}". Explore related concepts or ask the InfoAtlas AI Assistant for further specifics.`,
        },
        {
          title: "Key Context & Analysis",
          content: `Active discussions, research, and analysis surrounding ${query} continue across modern scientific and technological literature.`,
        },
      ],
      relatedTopics: [query],
      generatedAt: new Date().toISOString(),
      sourceType: "ai-synthesized" as const,
      citationNote: "InfoAtlas Knowledge Synthesis Engine.",
    };
  }

  // Automatically attach topic hero image (STEP 4 & STEP 5)
  try {
    const { image } = await resolveTopicImage(parsedArticle.title || query, hintContext, parsedArticle.category);
    if (image && image.url) {
      parsedArticle.heroImage = image;
    }
  } catch (imgErr) {
    console.warn("Failed to attach hero image to AI article:", imgErr);
  }

  return parsedArticle;
}

// Endpoint to resolve or generate topic images automatically
app.get("/api/knowledge/image", async (req, res) => {
  try {
    const topic = ((req.query.topic as string) || "").trim();
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }
    const context = req.query.context as string | undefined;
    const category = req.query.category as string | undefined;
    const forceAi = req.query.forceAi === "true";
    const aspect = ((req.query.aspect as string) || "16:9") as "16:9" | "4:3" | "1:1";

    const { image, status } = await resolveTopicImage(topic, context, category, forceAi, aspect);
    res.json({ image, status });
  } catch (err: any) {
    console.error("Knowledge image resolution error:", err);
    res.status(500).json({ error: err.message || "Failed to resolve image" });
  }
});

// Explicit on-demand image generation endpoint (e.g. user requests AI illustration)
app.post("/api/knowledge/generate-image", async (req, res) => {
  try {
    const { topic, context, category, aspect } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }
    const { image, status } = await resolveTopicImage(topic, context, category, true, aspect || "16:9");
    res.json({ image, status });
  } catch (err: any) {
    console.error("Knowledge image generation error:", err);
    res.status(500).json({ error: err.message || "Failed to generate image" });
  }
});

// Unified Knowledge Search with Automatic AI Fallback & Image Integration
app.get("/api/knowledge/search", async (req, res) => {
  try {
    const query = ((req.query.q as string) || "").trim();
    if (!query) {
      return res.json({
        query: "",
        sourceUsed: "wikimedia",
        isAiFallback: false,
        statusMessage: "Empty search query",
        results: [],
      });
    }

    // STEP 1: Search Wikipedia/Wikimedia API
    let wikiResults: any[] = [];
    let wikiSucceeded = false;
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        query
      )}&utf8=&format=json&origin=*`;
      const wikiRes = await fetch(url, {
        headers: { "User-Agent": "InfoAtlas/1.0 (contact@infoatlas.app)" },
        signal: AbortSignal.timeout(6000),
      });
      if (wikiRes.ok) {
        const data: any = await wikiRes.json();
        const searchList = data?.query?.search || [];
        wikiResults = searchList.map((item: any) => ({
          title: item.title,
          snippet: item.snippet ? item.snippet.replace(/<\/?[^>]+(>|$)/g, "") : "",
          pageid: item.pageid,
          url: `https://en.wikipedia.org/?curid=${item.pageid}`,
        }));
        wikiSucceeded = true;
      }
    } catch (wikiErr) {
      console.warn("Wikipedia search failed or timed out:", wikiErr);
    }

    // Resolve image in parallel for search result display
    const imagePromise = resolveTopicImage(query, undefined, undefined, false, "16:9");

    // STEP 2: Evaluate Results Relevance
    const queryLower = query.toLowerCase();
    const isQuestionOrExploration =
      /^(what|how|why|who|when|where|which|can|explain|tell me|is there|difference between)\b/i.test(query) ||
      query.includes("?") ||
      query.split(/\s+/).length >= 5;

    const hasMeaningfulMatch =
      wikiResults.length > 0 &&
      wikiResults.some((r) => {
        const titleLower = r.title.toLowerCase();
        if (titleLower === queryLower) return true;
        if (titleLower.includes(queryLower) || queryLower.includes(titleLower)) return true;
        const words = queryLower.split(/\s+/).filter((w) => w.length > 3);
        const matchCount = words.filter((w) => titleLower.includes(w)).length;
        return matchCount >= Math.min(2, words.length);
      });

    // STEP 3: If question or no strong direct match, synthesize full encyclopedic AI Article
    if (isQuestionOrExploration || !wikiSucceeded || wikiResults.length === 0 || !hasMeaningfulMatch) {
      console.log(`[KnowledgeSearch] Synthesizing AI encyclopedic article for query: "${query}"`);
      const hint = wikiResults.length > 0 ? wikiResults.slice(0, 3).map((w) => `${w.title}: ${w.snippet}`).join("; ") : undefined;
      const [aiArticle, { image, status: imgStatus }] = await Promise.all([
        generateAiKnowledgeArticle(query, hint),
        imagePromise,
      ]);

      return res.json({
        query,
        sourceUsed: wikiResults.length > 0 ? "ai-synthesized" : "ai-fallback",
        isAiFallback: true,
        statusMessage: wikiResults.length > 0
          ? "Synthesized comprehensive AI knowledge article and retrieved related Wikimedia records."
          : "No exact Wikimedia records found. Synthesized full encyclopedic article using InfoAtlas AI.",
        results: wikiResults,
        aiArticle,
        topicImage: image?.url ? image : undefined,
        imageStatus: imgStatus,
      });
    }

    // If verified Wikimedia articles exist, return them with topic image
    const { image, status: imgStatus } = await imagePromise;
    return res.json({
      query,
      sourceUsed: "wikimedia",
      isAiFallback: false,
      statusMessage: `Found ${wikiResults.length} verified articles from Wikimedia.`,
      results: wikiResults,
      topicImage: image?.url ? image : undefined,
      imageStatus: imgStatus,
    });
  } catch (error: any) {
    console.error("Knowledge search endpoint error:", error);
    const query = ((req.query.q as string) || "General Query").trim();
    const aiArticle = await generateAiKnowledgeArticle(query);
    return res.json({
      query,
      sourceUsed: "ai-fallback",
      isAiFallback: true,
      statusMessage: "Encyclopedic article synthesized by InfoAtlas AI.",
      results: [],
      aiArticle,
    });
  }
});

// Explicit endpoint to generate or deepen an AI Knowledge Article on demand
app.post("/api/knowledge/ai-article", async (req, res) => {
  try {
    const { query, context } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }
    const article = await generateAiKnowledgeArticle(query, context);
    res.json({ article });
  } catch (err: any) {
    console.error("AI article generation error:", err);
    res.status(500).json({ error: err.message || "Failed to generate AI article" });
  }
});

// Wikimedia Search API Proxy
app.get("/api/wikipedia/search", async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.json({ results: [] });
    }

    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&utf8=&format=json&origin=*`;

    const response = await fetch(url, {
      headers: { "User-Agent": "InfoAtlas/1.0 (contact@infoatlas.app)" },
    });
    const data: any = await response.json();

    const searchResults = data?.query?.search || [];
    const formatted = searchResults.map((item: any) => ({
      title: item.title,
      snippet: item.snippet ? item.snippet.replace(/<\/?[^>]+(>|$)/g, "") : "",
      pageid: item.pageid,
      url: `https://en.wikipedia.org/?curid=${item.pageid}`,
    }));

    res.json({ results: formatted });
  } catch (error: any) {
    console.error("Wikipedia Search Error:", error);
    res.status(500).json({ error: "Failed to fetch search results from Wikipedia." });
  }
});

// Wikimedia Article Summary Proxy
app.get("/api/wikipedia/article", async (req, res) => {
  try {
    const title = req.query.title as string;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const encodedTitle = encodeURIComponent(title);
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`;

    const response = await fetch(url, {
      headers: { "User-Agent": "InfoAtlas/1.0 (contact@infoatlas.app)" },
    });

    if (!response.ok) {
      return res.status(404).json({ error: "Article not found on Wikipedia." });
    }

    const data: any = await response.json();
    res.json({
      title: data.title,
      extract: data.extract,
      description: data.description,
      thumbnail: data.thumbnail?.source || null,
      content_urls: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodedTitle}`,
    });
  } catch (error: any) {
    console.error("Wikipedia Article Error:", error);
    res.status(500).json({ error: "Failed to fetch article details." });
  }
});

// In-memory news cache with 3-minute TTL to ensure fast responses and resilience
const newsCache = new Map<string, { articles: any[]; timestamp: number }>();
const CACHE_TTL_MS = 3 * 60 * 1000;

function cleanHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

// Helper to parse RSS items with robust media and image extraction
function parseRssItems(xmlText: string, sourceName: string, categoryName: string) {
  const items: any[] = [];
  const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>|<entry>([\s\S]*?)<\/entry>/gi) || [];
  
  for (let i = 0; i < itemMatches.length; i++) {
    const raw = itemMatches[i];
    const titleMatch = raw.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title[^>]*>([\s\S]*?)<\/title>/i);
    const linkMatch = raw.match(/<link[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/link>|<link[^>]+href=["']([^"']+)["']|<link[^>]*>([\s\S]*?)<\/link>/i);
    const descMatch = raw.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description[^>]*>([\s\S]*?)<\/description>|<summary[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/summary>|<summary[^>]*>([\s\S]*?)<\/summary>/i);
    const pubDateMatch = raw.match(/<pubDate>(.*?)<\/pubDate>|<published>(.*?)<\/published>|<updated>(.*?)<\/updated>/i);
    
    const mediaContentMatch = raw.match(/<media:content[^>]+url=["']([^"']+)["']/i);
    const mediaThumbMatch = raw.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
    const enclosureMatch = raw.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
    const imgTagMatch = raw.match(/<img[^>]+src=["']([^"']+)["']/i);

    const title = cleanHtml(titleMatch ? (titleMatch[1] || titleMatch[2] || "") : "");
    const link = (linkMatch ? (linkMatch[1] || linkMatch[2] || linkMatch[3] || "") : "").trim();
    let description = cleanHtml(descMatch ? (descMatch[1] || descMatch[2] || descMatch[3] || descMatch[4] || "") : "");

    let pubDate = new Date().toISOString();
    if (pubDateMatch) {
      const parsedDate = new Date((pubDateMatch[1] || pubDateMatch[2] || pubDateMatch[3] || "").trim());
      if (!isNaN(parsedDate.getTime())) {
        pubDate = parsedDate.toISOString();
      }
    }
    
    let thumbnail = 
      (mediaContentMatch ? mediaContentMatch[1] : null) ||
      (mediaThumbMatch ? mediaThumbMatch[1] : null) ||
      (enclosureMatch ? enclosureMatch[1] : null) ||
      (imgTagMatch ? imgTagMatch[1] : null);

    if (thumbnail) {
      thumbnail = thumbnail.replace(/&amp;/g, "&").trim();
      if (!thumbnail.startsWith("http")) thumbnail = null;
    }

    if (title && link) {
      const isBreaking =
        categoryName === "breaking" ||
        /breaking|urgent|alert:|live updates|live:/i.test(title);

      items.push({
        id: `rss_${sourceName.replace(/\s+/g, "_")}_${i}_${Date.now()}`,
        title,
        description: description || "Read full report on original publisher site.",
        url: link,
        source: sourceName,
        publishedAt: pubDate,
        category: categoryName === "breaking" ? "breaking" : categoryName,
        thumbnail: thumbnail || undefined,
        isBreaking,
      });
    }
  }
  return items;
}

// Category to verified feeds mapping
const CATEGORY_FEEDS: Record<string, { url: string; source: string; cat: string }[]> = {
  sports: [
    { url: "https://feeds.bbci.co.uk/sport/rss.xml", source: "BBC Sport", cat: "sports" },
    { url: "https://www.skysports.com/rss/12040", source: "Sky Sports", cat: "sports" },
    { url: "https://feeds.feedburner.com/ndtvsports-latest", source: "NDTV Sports", cat: "sports" },
    { url: "https://www.thehindu.com/sport/feeder/default.rss", source: "The Hindu Sport", cat: "sports" },
  ],
  cricket: [
    { url: "https://www.espncricinfo.com/rss/content/story/feeds/0.xml", source: "ESPNcricinfo", cat: "cricket" },
    { url: "https://feeds.bbci.co.uk/sport/cricket/rss.xml", source: "BBC Cricket", cat: "cricket" },
    { url: "https://feeds.feedburner.com/ndtvsports-latest", source: "NDTV Sports Cricket", cat: "cricket" },
  ],
  world: [
    { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC World News", cat: "world" },
    { url: "https://www.thehindu.com/news/international/feeder/default.rss", source: "The Hindu World", cat: "world" },
  ],
  india: [
    { url: "https://feeds.feedburner.com/ndtvnews-top-stories", source: "NDTV India", cat: "india" },
    { url: "https://www.thehindu.com/news/national/feeder/default.rss", source: "The Hindu National", cat: "india" },
  ],
  technology: [
    { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", source: "BBC Technology", cat: "technology" },
    { url: "https://feeds.arstechnica.com/arstechnica/index", source: "Ars Technica", cat: "technology" },
    { url: "https://techcrunch.com/feed/", source: "TechCrunch", cat: "technology" },
  ],
  business: [
    { url: "https://feeds.bbci.co.uk/news/business/rss.xml", source: "BBC Business", cat: "business" },
    { url: "https://www.cnbc.com/id/10001147/device/rss/rss.html", source: "CNBC Business", cat: "business" },
  ],
  science: [
    { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", source: "BBC Science", cat: "science" },
    { url: "https://feeds.feedburner.com/ScienceDaily", source: "ScienceDaily", cat: "science" },
  ],
  health: [
    { url: "https://feeds.bbci.co.uk/news/health/rss.xml", source: "BBC Health", cat: "health" },
  ],
  space: [
    { url: "https://phys.org/rss-feed/space-news/", source: "Phys.org Space", cat: "space" },
    { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", source: "BBC Science", cat: "space" },
  ],
  environment: [
    { url: "https://www.theguardian.com/environment/rss", source: "The Guardian Environment", cat: "environment" },
    { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", source: "BBC Environment", cat: "environment" },
  ],
  entertainment: [
    { url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", source: "BBC Entertainment", cat: "entertainment" },
  ],
  education: [
    { url: "https://feeds.bbci.co.uk/news/education/rss.xml", source: "BBC Education", cat: "education" },
  ],
  breaking: [
    { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC World News", cat: "breaking" },
    { url: "https://feeds.feedburner.com/ndtvnews-top-stories", source: "NDTV Breaking", cat: "breaking" },
    { url: "https://feeds.bbci.co.uk/sport/rss.xml", source: "BBC Sport", cat: "breaking" },
  ],
  all: [
    { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC World News", cat: "world" },
    { url: "https://feeds.bbci.co.uk/sport/rss.xml", source: "BBC Sport", cat: "sports" },
    { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", source: "BBC Technology", cat: "technology" },
    { url: "https://feeds.feedburner.com/ndtvnews-top-stories", source: "NDTV India", cat: "india" },
    { url: "https://feeds.bbci.co.uk/news/business/rss.xml", source: "BBC Business", cat: "business" },
    { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", source: "BBC Science", cat: "science" },
    { url: "https://feeds.bbci.co.uk/news/health/rss.xml", source: "BBC Health", cat: "health" },
  ],
};

// Real News Feed API with dedicated category routing, caching, and genuine image attribution
app.get("/api/news/feed", async (req, res) => {
  try {
    const rawCategory = (req.query.category as string) || "all";
    const category = rawCategory.toLowerCase().trim();
    const query = (req.query.q as string) || "";

    const cacheKey = `${category}_${query}`;
    const cached = newsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && !query) {
      return res.json({ articles: cached.articles });
    }

    let articles: any[] = [];

    const gnewsApiKey = process.env.GNEWS_API_KEY || process.env.VITE_GNEWS_API_KEY;
    const newsApiKey = process.env.NEWS_API_KEY || process.env.VITE_NEWS_API_KEY;

    if (gnewsApiKey) {
      try {
        const gnewsCat = category === "all" ? "general" : category;
        const gnewsUrl = `https://gnews.io/api/v4/top-headlines?category=${gnewsCat}&lang=en&max=20&apikey=${gnewsApiKey}`;
        const gRes = await fetch(gnewsUrl);
        if (gRes.ok) {
          const gData: any = await gRes.json();
          if (gData && Array.isArray(gData.articles) && gData.articles.length > 0) {
            articles = gData.articles.map((item: any, idx: number) => ({
              id: `gnews_${idx}_${Date.now()}`,
              title: item.title,
              description: item.description || "No description provided by source.",
              url: item.url,
              source: item.source?.name || "GNews",
              publishedAt: item.publishedAt || new Date().toISOString(),
              category: category,
              thumbnail: item.image || undefined,
              author: item.source?.name,
              isBreaking: category === "breaking",
            }));
          }
        }
      } catch (e) {
        console.warn("GNews fetch failed, falling back to verified RSS:", e);
      }
    } else if (newsApiKey) {
      try {
        const newsApiUrl = `https://newsapi.org/v2/top-headlines?country=us&category=${category === "all" ? "general" : category}&apiKey=${newsApiKey}`;
        const nRes = await fetch(newsApiUrl);
        if (nRes.ok) {
          const nData: any = await nRes.json();
          if (nData && Array.isArray(nData.articles) && nData.articles.length > 0) {
            articles = nData.articles.map((item: any, idx: number) => ({
              id: `newsapi_${idx}_${Date.now()}`,
              title: item.title,
              description: item.description || "No description provided by source.",
              url: item.url,
              source: item.source?.name || "NewsAPI",
              publishedAt: item.publishedAt || new Date().toISOString(),
              category: category,
              thumbnail: item.urlToImage || undefined,
              author: item.author,
              isBreaking: category === "breaking",
            }));
          }
        }
      } catch (e) {
        console.warn("NewsAPI fetch failed, falling back to verified RSS:", e);
      }
    }

    // If API returned no articles or no key provided, retrieve from verified publisher feeds
    if (articles.length === 0) {
      const targetFeeds = CATEGORY_FEEDS[category] || CATEGORY_FEEDS["all"];

      const rssPromises = targetFeeds.map(async (feed) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);
          const rRes = await fetch(feed.url, {
            headers: { "User-Agent": "InfoAtlas/1.0" },
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (!rRes.ok) return [];
          const xml = await rRes.text();
          return parseRssItems(xml, feed.source, feed.cat);
        } catch {
          return [];
        }
      });

      const rssResults = await Promise.all(rssPromises);
      articles = rssResults.flat();
    }

    // If still empty (e.g. specialized category), fallback to all feeds
    if (articles.length === 0 && category !== "all") {
      const fallbackFeeds = CATEGORY_FEEDS["all"];
      const rssPromises = fallbackFeeds.map(async (feed) => {
        try {
          const rRes = await fetch(feed.url, { headers: { "User-Agent": "InfoAtlas/1.0" } });
          if (!rRes.ok) return [];
          const xml = await rRes.text();
          return parseRssItems(xml, feed.source, feed.cat);
        } catch {
          return [];
        }
      });
      const rssResults = await Promise.all(rssPromises);
      articles = rssResults.flat();
    }

    // Sort newest first
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Deduplicate by URL
    const seenUrls = new Set<string>();
    const deduplicated: any[] = [];
    for (const item of articles) {
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        deduplicated.push(item);
      }
    }
    articles = deduplicated;

    // Filter by search query if supplied
    if (query) {
      const q = query.toLowerCase();
      articles = articles.filter(
        (a: any) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q)
      );
    }

    // Cache the result for this category
    if (!query && articles.length > 0) {
      newsCache.set(cacheKey, { articles, timestamp: Date.now() });
    }

    res.json({ articles });
  } catch (error: any) {
    console.error("News Feed Error:", error);
    res.status(500).json({ error: "Failed to fetch live news feed.", articles: [] });
  }
});

// Setup Vite middleware for development or serve static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`InfoAtlas server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
