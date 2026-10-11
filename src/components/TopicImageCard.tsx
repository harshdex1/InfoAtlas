import React, { useState } from "react";
import { TopicImage, ImageGenerationStatus } from "../types";
import { Sparkles, Globe, Maximize2, X, RefreshCw, Info, Download, ExternalLink, ShieldAlert } from "lucide-react";
import { generateTopicImageOnDemand } from "../services/api";

interface TopicImageCardProps {
  image?: TopicImage | null;
  topic: string;
  context?: string;
  category?: string;
  isDark: boolean;
  aspectRatio?: "16:9" | "4:3" | "1:1";
  className?: string;
  showRegenerateOption?: boolean;
  onImageUpdated?: (newImage: TopicImage) => void;
  status?: ImageGenerationStatus;
}

export const TopicImageCard: React.FC<TopicImageCardProps> = ({
  image: initialImage,
  topic,
  context,
  category,
  isDark,
  aspectRatio = "16:9",
  className = "",
  showRegenerateOption = true,
  onImageUpdated,
  status,
}) => {
  const [currentImage, setCurrentImage] = useState<TopicImage | null>(initialImage || null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [showPromptDetails, setShowPromptDetails] = useState<boolean>(false);
  const [showConfigNotice, setShowConfigNotice] = useState<boolean>(false);
  const [hasImageError, setHasImageError] = useState<boolean>(false);

  // Sync with prop updates
  React.useEffect(() => {
    if (initialImage) {
      setCurrentImage(initialImage);
      setHasImageError(false);
    }
  }, [initialImage]);

  const handleRegenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGenerating(true);
    setHasImageError(false);
    try {
      const res = await generateTopicImageOnDemand(topic, {
        context,
        category,
        aspect: aspectRatio,
      });
      if (res.image && res.image.url) {
        setCurrentImage(res.image);
        if (onImageUpdated) onImageUpdated(res.image);
      } else if (res.status && !res.status.available) {
        setShowConfigNotice(true);
      }
    } catch (err) {
      console.error("Failed to generate topic image:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const aspectClass =
    aspectRatio === "16:9" ? "aspect-video" : aspectRatio === "4:3" ? "aspect-[4/3]" : "aspect-square";

  // If no image or image error, render high-fidelity topic diagram container
  if (!currentImage || !currentImage.url || hasImageError) {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl border p-6 flex flex-col justify-between transition-all ${aspectClass} ${className} ${
          isDark
            ? "bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border-slate-800 text-slate-200"
            : "bg-gradient-to-br from-[#F5F8FF] via-indigo-50/50 to-blue-50 border-[#E0E9FA] text-[#102B59]"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#386BFF]/10 text-[#386BFF] text-xs font-semibold border border-[#386BFF]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Knowledge Visualization</span>
          </div>

          {showRegenerateOption && (
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#386BFF] text-white hover:bg-[#2e5beb] transition-all cursor-pointer disabled:opacity-60 shadow-sm"
              title="Synthesize conceptual educational illustration"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
              <span>{isGenerating ? "Synthesizing..." : "Generate AI Illustration"}</span>
            </button>
          )}
        </div>

        {/* Center Conceptual Diagram Visual */}
        <div className="my-auto text-center py-4 px-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#386BFF]/20 to-purple-500/20 text-[#386BFF] mx-auto flex items-center justify-center mb-3 border border-[#386BFF]/30">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <h4 className="text-base sm:text-lg font-bold tracking-tight">{topic}</h4>
          <p className="text-xs text-[#60769A] max-w-md mx-auto mt-1 line-clamp-2">
            {context || `Authoritative educational overview and conceptual foundation for ${topic}.`}
          </p>
        </div>

        {/* Bottom Status / Configuration Notice */}
        <div className="flex items-center justify-between text-[11px] text-[#60769A] pt-2 border-t border-slate-200 dark:border-slate-800">
          <span>{category || "Knowledge & Exploration"}</span>
          {status && !status.available && (
            <button
              onClick={() => setShowConfigNotice(true)}
              className="text-[#386BFF] hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <Info className="w-3 h-3" />
              <span>Model info</span>
            </button>
          )}
        </div>

        {/* Configuration Modal if clicked */}
        {showConfigNotice && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div
              className={`max-w-md w-full p-6 rounded-3xl border shadow-2xl relative ${
                isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-[#E0E9FA] text-[#102B59]"
              }`}
            >
              <button
                onClick={() => setShowConfigNotice(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-3 text-amber-500">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-bold text-sm">AI Image Model Configuration</h3>
              </div>
              <p className="text-xs leading-relaxed text-[#60769A] mb-3">
                {status?.message ||
                  "Direct server-side image generation with Gemini image models requires an API key with billing enabled in Google AI Studio."}
              </p>
              <div className={`p-3 rounded-xl text-xs font-mono mb-4 ${isDark ? "bg-slate-950 text-indigo-300" : "bg-slate-100 text-indigo-700"}`}>
                Models: gemini-3.1-flash-lite-image / gemini-nano-banana-2.1
              </div>
              <p className="text-xs text-[#60769A] mb-4">
                Verified educational source images from Wikimedia Commons are automatically used when available.
              </p>
              <button
                onClick={() => setShowConfigNotice(false)}
                className="w-full py-2.5 rounded-xl bg-[#386BFF] text-white text-xs font-bold hover:bg-[#2d58d9] transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const isHistorical = /history|ancient|empire|war|dynasty|century|king|queen|civilization|rome|greece|egypt/i.test(
    `${topic} ${category || ""}`
  );
  const isScientific = /quantum|physics|biology|chemistry|cell|space|planet|star|astronomy|dna|black hole|photosynthesis/i.test(
    `${topic} ${category || ""}`
  );

  return (
    <>
      <div className={`group relative rounded-3xl overflow-hidden border transition-all ${className} ${
        isDark ? "bg-slate-900/80 border-slate-800 shadow-xl" : "bg-white border-[#E0E9FA] shadow-md"
      }`}>
        {/* Main Image Container */}
        <div className={`relative w-full overflow-hidden bg-slate-950 ${aspectClass}`}>
          <img
            src={currentImage.url}
            alt={currentImage.title || topic}
            referrerPolicy="no-referrer"
            onError={() => setHasImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />

          {/* Top Badges Overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-1.5">
              {currentImage.isAiGenerated ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-violet-300 text-[11px] font-bold border border-violet-500/30 shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span>
                    {isHistorical
                      ? "AI Historical Reconstruction"
                      : isScientific
                      ? "AI Scientific Visualization"
                      : "AI Conceptual Illustration"}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-blue-300 text-[11px] font-bold border border-blue-500/30 shadow-lg">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Verified Knowledge Source</span>
                </span>
              )}
            </div>

            {/* Quick Actions (Lightbox & Prompt/Source) */}
            <div className="pointer-events-auto flex items-center gap-1.5">
              {currentImage.prompt && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPromptDetails(true);
                  }}
                  className="p-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md text-slate-200 hover:text-white border border-slate-700/60 shadow-lg transition-all cursor-pointer"
                  title="View Image Synthesis Prompt"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLightboxOpen(true);
                }}
                className="p-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md text-slate-200 hover:text-white border border-slate-700/60 shadow-lg transition-all cursor-pointer"
                title="Expand Full View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {showRegenerateOption && (
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md text-slate-200 hover:text-white border border-slate-700/60 shadow-lg transition-all cursor-pointer disabled:opacity-50 text-[11px] font-semibold"
                  title="Generate alternative AI illustration"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin text-[#386BFF]" : ""}`} />
                  <span className="hidden sm:inline">{isGenerating ? "Generating..." : "Alternative"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Caption & Attribution Bar */}
        <div className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          isDark ? "bg-slate-900/90 text-slate-300" : "bg-white text-[#102B59]"
        }`}>
          <div className="space-y-1 min-w-0">
            <p className="font-semibold text-sm truncate">{currentImage.title || topic}</p>
            <p className="text-xs text-[#60769A] line-clamp-1 leading-relaxed">
              {currentImage.caption || `High-clarity illustration representing ${topic}`}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-[11px] text-[#60769A]">
            <span className="font-medium">{currentImage.attribution}</span>
            {currentImage.authorOrLicense && (
              <span className="hidden md:inline px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px]">
                {currentImage.authorOrLicense}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl flex items-center justify-between text-white mb-4">
            <div className="space-y-0.5">
              <h3 className="font-bold text-lg">{currentImage.title || topic}</h3>
              <p className="text-xs text-slate-400">{currentImage.caption}</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={currentImage.url}
                target="_blank"
                rel="noreferrer"
                download={`${topic.replace(/\s+/g, "_")}.jpg`}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer"
                title="Open/Download Original"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative max-w-5xl max-h-[80vh] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center bg-black">
            <img
              src={currentImage.url}
              alt={currentImage.title || topic}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>

          <div className="mt-4 text-center text-xs text-slate-400">
            {currentImage.isAiGenerated
              ? "Artistic conceptual illustration synthesized for InfoAtlas Knowledge Engine."
              : "Authentic educational archive media from Wikimedia Commons."}
          </div>
        </div>
      )}

      {/* AI Synthesis Prompt Details Modal */}
      {showPromptDetails && currentImage.prompt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`max-w-lg w-full p-6 sm:p-8 rounded-3xl border shadow-2xl relative ${
              isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-[#E0E9FA] text-[#102B59]"
            }`}
          >
            <button
              onClick={() => setShowPromptDetails(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 text-[#386BFF]">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold text-base">AI Image Generation Prompt</h3>
            </div>

            <p className="text-xs text-[#60769A] mb-3">
              Constructed according to InfoAtlas educational specifications for accurate visual synthesis:
            </p>

            <div className={`p-4 rounded-2xl text-xs leading-relaxed font-mono mb-4 border ${
              isDark ? "bg-slate-950 border-slate-800 text-indigo-300" : "bg-slate-50 border-slate-200 text-indigo-900"
            }`}>
              "{currentImage.prompt}"
            </div>

            <div className="text-[11px] text-[#60769A] space-y-1 mb-6">
              <p>• Model: {currentImage.attribution}</p>
              <p>• Aspect Ratio: {currentImage.aspectRatio}</p>
              <p>• Visual Purpose: Authoritative educational and conceptual illustration</p>
            </div>

            <button
              onClick={() => setShowPromptDetails(false)}
              className="w-full py-2.5 rounded-xl bg-[#386BFF] text-white text-xs font-bold hover:bg-[#2d58d9] transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
