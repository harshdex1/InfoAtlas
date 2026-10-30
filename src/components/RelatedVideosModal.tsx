import React, { useState, useEffect } from "react";
import { SocialVideoItem, RelatedVideosResponse } from "../types";
import { fetchRelatedVideos } from "../services/api";
import {
  X,
  Play,
  ExternalLink,
  Eye,
  Clock,
  Sparkles,
  CheckCircle,
  Share2,
  Film,
  RefreshCw,
} from "lucide-react";

interface RelatedVideosModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  isDark: boolean;
}

export const RelatedVideosModal: React.FC<RelatedVideosModalProps> = ({
  isOpen,
  onClose,
  query,
  isDark,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [videoData, setVideoData] = useState<RelatedVideosResponse | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [activeTheaterVideo, setActiveTheaterVideo] = useState<SocialVideoItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveTheaterVideo(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchRelatedVideos(query)
      .then((data) => {
        if (isMounted) {
          setVideoData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load related videos:", err);
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, query]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeTheaterVideo) {
          setActiveTheaterVideo(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeTheaterVideo, onClose]);

  if (!isOpen) return null;

  const videos = videoData?.videos || [];
  const quickLinks = videoData?.platformQuickLinks || {
    youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    instagram: `https://www.instagram.com/explore/tags/${encodeURIComponent(query.replace(/\s+/g, ""))}/`,
    tiktok: `https://www.tiktok.com/search?q=${encodeURIComponent(query)}`,
    x: `https://x.com/search?q=${encodeURIComponent(query)}&f=video`,
    reddit: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}&type=link`,
  };

  const filteredVideos =
    selectedPlatform === "all"
      ? videos
      : videos.filter((v) => v.platform.toLowerCase() === selectedPlatform.toLowerCase());

  const platformCounts = {
    all: videos.length,
    youtube: videos.filter((v) => v.platform === "youtube").length,
    instagram: videos.filter((v) => v.platform === "instagram").length,
    tiktok: videos.filter((v) => v.platform === "tiktok").length,
    x: videos.filter((v) => v.platform === "x").length,
    reddit: videos.filter((v) => v.platform === "reddit").length,
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPlatformBadge = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return {
          label: "YouTube",
          bg: "bg-red-600 text-white shadow-red-500/30",
          ring: "ring-red-500/30",
          icon: (
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          ),
        };
      case "instagram":
        return {
          label: "Instagram Reels",
          bg: "bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white shadow-pink-500/30",
          ring: "ring-pink-500/30",
          icon: (
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          ),
        };
      case "tiktok":
        return {
          label: "TikTok",
          bg: "bg-black text-white border border-cyan-500/40 shadow-cyan-500/20",
          ring: "ring-cyan-500/30",
          icon: (
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.87-4.49V8.62a8.28 8.28 0 0 0 4.9 1.6v-3.53h-.01z" />
            </svg>
          ),
        };
      case "x":
        return {
          label: "X (Twitter)",
          bg: "bg-slate-900 text-white border border-slate-700 shadow-slate-700/30",
          ring: "ring-slate-500/30",
          icon: (
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          ),
        };
      case "reddit":
        return {
          label: "Reddit",
          bg: "bg-orange-600 text-white shadow-orange-500/30",
          ring: "ring-orange-500/30",
          icon: (
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.702zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-4.466 3.99a.327.327 0 0 0-.231.096.35.35 0 0 0 0 .486c.749.75 1.909.75 2.658 0a.35.35 0 0 0 0-.486.33.33 0 0 0-.462 0c-.505.503-1.41.503-1.915 0a.336.336 0 0 0-.05-.096z" />
            </svg>
          ),
        };
      default:
        return {
          label: "Video",
          bg: "bg-blue-600 text-white shadow-blue-500/30",
          ring: "ring-blue-500/30",
          icon: <Film className="w-3.5 h-3.5" />,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Dialog Container */}
      <div
        className={`relative w-full max-w-5xl rounded-3xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden transition-all duration-300 z-10 ${
          isDark
            ? "bg-slate-900/95 border-slate-800 text-slate-100 shadow-purple-900/10"
            : "bg-white/95 border-slate-200 text-slate-800 shadow-blue-900/15"
        }`}
      >
        {/* Modal Top Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between gap-4 shrink-0 ${
            isDark ? "border-slate-800 bg-slate-900/80" : "border-slate-100 bg-slate-50/80"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-500 via-pink-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight">Related Videos on Social Media</h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#386BFF]/10 text-[#386BFF] border border-[#386BFF]/20">
                  <Sparkles className="w-3 h-3" />
                  Live Discovery
                </span>
              </div>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Curated videos and direct feeds for <span className="font-semibold text-[#386BFF]">"{query}"</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark
                  ? "bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
                  : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Launch Search Links on Social Medias */}
        <div
          className={`px-6 py-3 border-b shrink-0 flex flex-wrap items-center gap-2 text-xs ${
            isDark ? "border-slate-800/80 bg-slate-950/40" : "border-slate-100 bg-blue-50/40"
          }`}
        >
          <span className="font-semibold text-slate-400 mr-1 flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5 text-[#386BFF]" />
            Search Direct on:
          </span>

          {/* YouTube */}
          <a
            href={quickLinks.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs bg-red-600 hover:bg-red-700 text-white transition-all shadow-sm hover:scale-105"
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <span>YouTube</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-80" />
          </a>

          {/* Instagram */}
          <a
            href={quickLinks.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-90 text-white transition-all shadow-sm hover:scale-105"
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
            </svg>
            <span>Instagram Reels</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-80" />
          </a>

          {/* TikTok */}
          <a
            href={quickLinks.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs bg-black hover:bg-neutral-800 text-white border border-cyan-500/40 transition-all shadow-sm hover:scale-105"
          >
            <svg className="w-3 h-3 fill-current text-cyan-400" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.87-4.49V8.62a8.28 8.28 0 0 0 4.9 1.6v-3.53h-.01z" />
            </svg>
            <span>TikTok</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-80" />
          </a>

          {/* X */}
          <a
            href={quickLinks.x}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs bg-slate-900 hover:bg-black text-white border border-slate-700 transition-all shadow-sm hover:scale-105"
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>X (Twitter)</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-80" />
          </a>

          {/* Reddit */}
          <a
            href={quickLinks.reddit}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs bg-orange-600 hover:bg-orange-700 text-white transition-all shadow-sm hover:scale-105"
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.702z" />
            </svg>
            <span>Reddit</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-80" />
          </a>
        </div>

        {/* Platform Filter Tabs */}
        <div
          className={`px-6 py-2.5 border-b shrink-0 flex items-center gap-2 overflow-x-auto no-scrollbar ${
            isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-100 bg-slate-50/50"
          }`}
        >
          {[
            { id: "all", label: "All Platforms", count: platformCounts.all },
            { id: "youtube", label: "YouTube", count: platformCounts.youtube },
            { id: "instagram", label: "Instagram Reels", count: platformCounts.instagram },
            { id: "tiktok", label: "TikTok", count: platformCounts.tiktok },
            { id: "x", label: "X / Twitter", count: platformCounts.x },
            { id: "reddit", label: "Reddit", count: platformCounts.reddit },
          ].map((tab) => {
            const isActive = selectedPlatform === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedPlatform(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#386BFF] text-white shadow-md shadow-blue-500/20"
                    : isDark
                    ? "bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? "bg-white/20 text-white" : isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body / Videos Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Theater Video (Inline Player for YouTube) */}
          {activeTheaterVideo && (
            <div
              className={`p-4 rounded-3xl border ${
                isDark ? "bg-slate-950 border-indigo-500/40" : "bg-slate-900 border-indigo-200"
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Now Playing Theater Preview
                  </span>
                </div>
                <button
                  onClick={() => setActiveTheaterVideo(null)}
                  className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 transition-all cursor-pointer"
                >
                  Close Theater
                </button>
              </div>

              {activeTheaterVideo.embedUrl ? (
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl">
                  <iframe
                    src={`${activeTheaterVideo.embedUrl}?autoplay=1`}
                    title={activeTheaterVideo.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="p-8 text-center bg-black/60 rounded-2xl">
                  <p className="text-sm text-slate-300 mb-3">
                    Direct embed unavailable for this clip. Watch directly on {activeTheaterVideo.platform}:
                  </p>
                  <a
                    href={activeTheaterVideo.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#386BFF] text-white font-semibold text-xs shadow-lg hover:bg-blue-600 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open on {activeTheaterVideo.platform.toUpperCase()}
                  </a>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                <span className="font-semibold text-white">{activeTheaterVideo.title}</span>
                <a
                  href={activeTheaterVideo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium"
                >
                  <span>Open on Platform</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl border p-4 space-y-3 animate-pulse ${
                    isDark ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="aspect-video rounded-xl bg-slate-700/30 w-full"></div>
                  <div className="h-4 bg-slate-700/30 rounded w-4/5"></div>
                  <div className="h-3 bg-slate-700/30 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredVideos.length === 0 ? (
            /* Empty State */
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#386BFF]/10 text-[#386BFF] mx-auto flex items-center justify-center">
                <Film className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold">No social videos found for this filter</h4>
                <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Try selecting "All Platforms" or jump directly to social media search below.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <a
                  href={quickLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  Search on YouTube
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={quickLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  Search Instagram
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={quickLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  Search TikTok
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            /* Videos Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredVideos.map((video) => {
                const badge = getPlatformBadge(video.platform);
                const isYouTube = video.platform === "youtube";

                return (
                  <div
                    key={video.id}
                    className={`group rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                      isDark
                        ? "bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-slate-950/40"
                        : "bg-white border-slate-200 hover:border-blue-300 shadow-sm"
                    }`}
                  >
                    {/* Thumbnail Container */}
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          // Fallback to high quality abstract topic image
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80";
                        }}
                      />

                      {/* Dark Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                      {/* Platform Badge on top-left */}
                      <div className="absolute top-2.5 left-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-md ${badge.bg}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      {/* Duration Pill on bottom-right */}
                      {video.duration && (
                        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-sm text-[10px] font-mono font-bold text-white flex items-center gap-1 border border-white/10">
                          <Clock className="w-2.5 h-2.5 text-slate-300" />
                          <span>{video.duration}</span>
                        </div>
                      )}

                      {/* Big Play Button Overlay on Hover */}
                      <button
                        onClick={() => {
                          if (isYouTube && video.embedUrl) {
                            setActiveTheaterVideo(video);
                          } else {
                            window.open(video.videoUrl, "_blank", "noopener,noreferrer");
                          }
                        }}
                        className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-2xl transition-all duration-300 scale-90 opacity-90 group-hover:scale-105 group-hover:opacity-100 cursor-pointer"
                        title={isYouTube ? "Play preview" : `Watch on ${badge.label}`}
                      >
                        <Play className="w-5 h-5 fill-current ml-0.5 text-slate-900" />
                      </button>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        {/* Title */}
                        <h4
                          className="font-bold text-sm line-clamp-2 leading-snug group-hover:text-[#386BFF] transition-colors cursor-pointer"
                          onClick={() => {
                            if (isYouTube && video.embedUrl) {
                              setActiveTheaterVideo(video);
                            } else {
                              window.open(video.videoUrl, "_blank", "noopener,noreferrer");
                            }
                          }}
                        >
                          {video.title}
                        </h4>

                        {/* Channel / Creator */}
                        <div className="flex items-center gap-2 mt-2">
                          {video.channelAvatar ? (
                            <img
                              src={video.channelAvatar}
                              alt={video.channelName}
                              className="w-5 h-5 rounded-full object-cover border border-slate-700/50"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-700 text-white text-[10px] font-bold flex items-center justify-center">
                              {video.channelName.charAt(0)}
                            </div>
                          )}

                          <span className={`text-xs font-semibold truncate ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                            {video.channelName}
                          </span>

                          {video.isVerified && (
                            <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          )}
                        </div>

                        {/* Description snippet if available */}
                        {video.description && (
                          <p
                            className={`text-xs mt-1.5 line-clamp-2 ${
                              isDark ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {video.description}
                          </p>
                        )}
                      </div>

                      {/* Footer Stats & Actions */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2 text-slate-400">
                          {video.viewCount && (
                            <span className="flex items-center gap-1 font-medium">
                              <Eye className="w-3 h-3" />
                              {video.viewCount}
                            </span>
                          )}
                          {video.publishedTimeAgo && (
                            <span>• {video.publishedTimeAgo}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyLink(video.videoUrl, video.id)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              copiedId === video.id
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : isDark
                                ? "border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                                : "border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                            title="Copy video link"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={video.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold bg-[#386BFF] hover:bg-blue-600 text-white transition-all shadow-sm"
                          >
                            <span>Watch</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info strip */}
        <div
          className={`px-6 py-3 border-t text-[11px] flex flex-wrap items-center justify-between gap-2 shrink-0 ${
            isDark ? "border-slate-800 bg-slate-900/60 text-slate-400" : "border-slate-100 bg-slate-50/60 text-slate-500"
          }`}
        >
          <span>
            Showing <strong className="text-[#386BFF]">{filteredVideos.length}</strong> videos across social medias.
          </span>
          <span className="text-slate-400">
            Click "Watch" or a card to stream video on official platform.
          </span>
        </div>
      </div>
    </div>
  );
};
