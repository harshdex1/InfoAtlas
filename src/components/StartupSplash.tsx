import React, { useState, useEffect, useRef, useCallback } from "react";
import { safeStorage } from "../context/AuthContext";
import { Sparkles, Radio, Check, Globe } from "lucide-react";

interface StartupSplashProps {
  onComplete: () => void;
}

export const StartupSplash: React.FC<StartupSplashProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState<number>(0);
  const [stage, setStage] = useState<number>(0); // 0: Init, 1: Monogram & Core, 2: Gyro Orbits, 3: Wordmark & Telemetry, 4: Complete
  const [statusText, setStatusText] = useState<string>("Initializing Verified Knowledge Grid...");
  const [isWarpingOut, setIsWarpingOut] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const completedRef = useRef<boolean>(false);

  const finishSplash = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsWarpingOut(true);
    safeStorage.setItem("infoatlas_has_launched_before", "true");
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.setItem("infoatlas_session_splash_shown", "true");
      }
    } catch {}
    setTimeout(() => {
      onComplete();
    }, 450); // Cinematic expansion warp duration
  }, [onComplete]);

  // Stellar Network & Geospatial Sonar Background Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle nodes for constellation grid
    const nodeCount = Math.min(55, Math.floor((width * height) / 18000));
    const nodes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseAlpha: number;
      color: string;
      pulseSpeed: number;
      pulseOffset: number;
    }> = [];

    const colors = ["#00F5FF", "#3888FF", "#8A4BFF", "#38BDF8", "#C084FC"];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.8 + 0.8,
        baseAlpha: Math.random() * 0.5 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulseSpeed: Math.random() * 0.04 + 0.015,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    // Sonar ripples radiating from center
    const ripples: Array<{ r: number; maxR: number; alpha: number; speed: number }> = [
      { r: 20, maxR: Math.max(width, height) * 0.55, alpha: 0.35, speed: 1.2 },
      { r: 140, maxR: Math.max(width, height) * 0.55, alpha: 0.25, speed: 1.2 },
    ];

    let t = 0;
    const render = () => {
      t += 0.02;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // 1. Draw expanding geospatial sonar wave rings
      ripples.forEach((rip) => {
        rip.r += rip.speed;
        if (rip.r > rip.maxR) {
          rip.r = 10;
        }
        const currentAlpha = Math.max(0, rip.alpha * (1 - rip.r / rip.maxR));
        ctx.beginPath();
        ctx.arc(cx, cy, rip.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 245, 255, ${currentAlpha * 0.3})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 2. Connect nearby nodes with constellation beams
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const lineAlpha = (1 - dist / 100) * 0.18;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(56, 136, 255, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // 3. Draw particles
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        const pulse = Math.sin(t * n.pulseSpeed * 60 + n.pulseOffset);
        const alpha = Math.min(1, Math.max(0.1, n.baseAlpha + pulse * 0.25));

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Choreographed Timeline & Progress Counter
  useEffect(() => {
    // Reduced motion check
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      finishSplash();
      return;
    }

    const hasLaunched = safeStorage.getItem("infoatlas_has_launched_before");
    const isReturning = Boolean(hasLaunched);
    // Snappy: ~1.9s for returning users, ~2.5s for initial launch
    const totalDuration = isReturning ? 1900 : 2500;
    const intervalMs = 20;
    const stepCount = totalDuration / intervalMs;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const rawPct = Math.min(100, Math.round((currentStep / stepCount) * 100));
      // Non-linear acceleration curve
      const curvedPct = Math.min(100, Math.round(Math.pow(rawPct / 100, 0.95) * 100));
      setProgress(curvedPct);

      if (curvedPct >= 15 && stage < 1) {
        setStage(1);
        setStatusText("Calibrating 750+ District Intelligence Desks...");
      }
      if (curvedPct >= 42 && stage < 2) {
        setStage(2);
        setStatusText("Synchronizing Global News & Knowledge Feeds...");
      }
      if (curvedPct >= 72 && stage < 3) {
        setStage(3);
        setStatusText("Activating Neural Synthesis & Sports Engine...");
      }
      if (curvedPct >= 96 && stage < 4) {
        setStage(4);
        setStatusText("InfoAtlas Intelligence Grid Online");
      }

      if (currentStep >= stepCount) {
        clearInterval(timer);
        setTimeout(() => {
          finishSplash();
        }, 220);
      }
    }, intervalMs);

    // Keyboard dismissals (Space, Enter, Escape)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        clearInterval(timer);
        finishSplash();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Failsafe timeout to never block user
    const failsafe = setTimeout(() => {
      clearInterval(timer);
      finishSplash();
    }, totalDuration + 900);

    return () => {
      clearInterval(timer);
      clearTimeout(failsafe);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [finishSplash, stage]);

  return (
    <div
      onClick={finishSplash}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#020617] text-white transition-all duration-500 ease-out cursor-pointer select-none ${
        isWarpingOut
          ? "opacity-0 scale-110 blur-sm pointer-events-none"
          : "opacity-100 scale-100 blur-0"
      }`}
      aria-label="InfoAtlas Launch Screen"
      role="banner"
    >
      <style>{`
        @keyframes gyroRotateClockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes gyroRotateCounter {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes radarSweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes corePulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes beaconFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes textShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Atmospheric Radial Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0b1a3d_0%,#040a1c_65%,#01040d_100%)] pointer-events-none" />

      {/* Interactive Background Starfield Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full" />

      {/* Central Ambient Luminous Bloom */}
      <div
        className={`absolute w-[540px] h-[540px] rounded-full pointer-events-none transition-all duration-1000 ease-out ${
          stage >= 1 ? "opacity-60 scale-100" : "opacity-0 scale-50"
        }`}
        style={{
          background:
            "radial-gradient(circle, rgba(0, 245, 255, 0.28) 0%, rgba(56, 107, 255, 0.22) 35%, rgba(139, 92, 246, 0.12) 65%, transparent 78%)",
          filter: "blur(56px)",
        }}
      />

      {/* ========================================================= */}
      {/* CENTRAL VISUAL: HOLOGRAPHIC 3D GYRO-CORE & MONOGRAM */}
      {/* ========================================================= */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 max-w-lg w-full text-center">
        <div
          className={`relative flex items-center justify-center transition-all duration-700 ease-out ${
            stage >= 1 ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-75 translate-y-6"
          }`}
        >
          {/* Multi-layered Glowing Gyro-Rings SVG */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
            {/* Layer 1: Outer Celestial Gyro Orbit (Counter-Clockwise) */}
            <svg
              viewBox="0 0 160 160"
              className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
              style={{
                animation: "gyroRotateCounter 24s linear infinite",
              }}
            >
              <defs>
                <linearGradient id="gyro-outer" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00F5FF" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#6366F1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#A855F7" stopOpacity="0.85" />
                </linearGradient>
              </defs>
              <ellipse
                cx="80"
                cy="80"
                rx="72"
                ry="26"
                fill="none"
                stroke="url(#gyro-outer)"
                strokeWidth="1.6"
                strokeDasharray="4 8"
                opacity="0.75"
                transform="rotate(-22 80 80)"
              />
              {/* Orbital Satellite Node */}
              <g transform="rotate(-22 80 80)">
                <circle cx="152" cy="80" r="3.5" fill="#00F5FF" filter="drop-shadow(0 0 6px #00F5FF)" />
                <circle cx="152" cy="80" r="1.6" fill="#FFFFFF" />
              </g>
            </svg>

            {/* Layer 2: Inner Equatorial Orbit (Clockwise) */}
            <svg
              viewBox="0 0 160 160"
              className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
              style={{
                animation: "gyroRotateClockwise 16s linear infinite",
              }}
            >
              <defs>
                <linearGradient id="gyro-inner" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="45%" stopColor="#818CF8" />
                  <stop offset="100%" stopColor="#C084FC" />
                </linearGradient>
              </defs>
              <ellipse
                cx="80"
                cy="80"
                rx="62"
                ry="36"
                fill="none"
                stroke="url(#gyro-inner)"
                strokeWidth="2"
                strokeDasharray="3 5 9 5"
                opacity="0.85"
                transform="rotate(34 80 80)"
              />
              {/* Secondary Celestial Beacon */}
              <g transform="rotate(34 80 80)">
                <circle cx="142" cy="80" r="4" fill="#FFFFFF" filter="drop-shadow(0 0 8px #38BDF8)" />
                <circle cx="142" cy="80" r="2" fill="#00F5FF" />
                <circle cx="18" cy="80" r="2.5" fill="#C084FC" />
              </g>
            </svg>

            {/* Layer 3: Central High-Tech Monogram Core & Radar Scanner */}
            <svg
              viewBox="0 0 100 100"
              className="w-24 h-24 sm:w-28 sm:h-28 overflow-visible z-10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="core-iGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00F5FF" />
                  <stop offset="40%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#386BFF" />
                </linearGradient>

                <linearGradient id="core-aGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#386BFF" />
                  <stop offset="55%" stopColor="#7048FF" />
                  <stop offset="100%" stopColor="#C084FC" />
                </linearGradient>

                <radialGradient id="core-globeBase" cx="45%" cy="40%" r="65%">
                  <stop offset="0%" stopColor="#0D2E6E" />
                  <stop offset="45%" stopColor="#081E48" />
                  <stop offset="85%" stopColor="#030B1E" />
                  <stop offset="100%" stopColor="#020612" />
                </radialGradient>

                <linearGradient id="core-meridian" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00F5FF" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#3888FF" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#8A4BFF" stopOpacity="0.8" />
                </linearGradient>

                <clipPath id="core-globeClip">
                  <circle cx="56" cy="51" r="14.5" />
                </clipPath>
              </defs>

              {/* Glowing Aura behind globe */}
              <circle
                cx="56"
                cy="51"
                r="22"
                fill="#00F5FF"
                opacity="0.25"
                filter="blur(10px)"
                style={{ animation: "corePulse 3s ease-in-out infinite" }}
              />

              {/* Radar Scanner Sweep across globe */}
              <g
                clipPath="url(#core-globeClip)"
                style={{
                  transformOrigin: "56px 51px",
                  animation: "radarSweep 4s linear infinite",
                }}
              >
                <path d="M 56 51 L 70 37 A 14.5 14.5 0 0 1 70 65 Z" fill="rgba(0, 245, 255, 0.22)" />
                <line x1="56" y1="51" x2="70.5" y2="51" stroke="#00F5FF" strokeWidth="1.2" opacity="0.85" />
              </g>

              {/* Monogram Pillar "I" */}
              <g filter="drop-shadow(0 0 10px rgba(0,245,255,0.65))">
                <rect x="14" y="23" width="13" height="54" rx="4" fill="url(#core-iGrad)" />
                <path d="M 16 25 L 24 25 L 24 75 L 16 75 Z" fill="#FFFFFF" opacity="0.28" />
                <line x1="20.5" y1="27" x2="20.5" y2="73" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
              </g>

              {/* Monogram Structure "A" */}
              <g filter="drop-shadow(0 0 12px rgba(112,72,255,0.65))">
                <path d="M 56 23 L 36 77 L 48 77 L 56 53 Z" fill="url(#core-iGrad)" />
                <path d="M 56 23 L 56 53 L 64 77 L 76 77 Z" fill="url(#core-aGrad)" />
                <circle cx="56" cy="24" r="3.5" fill="#00F5FF" filter="drop-shadow(0 0 6px #00F5FF)" />
              </g>

              {/* The Central Globe Core */}
              <circle
                cx="56"
                cy="51"
                r="14.5"
                fill="url(#core-globeBase)"
                stroke="url(#core-meridian)"
                strokeWidth="1.6"
              />

              {/* Globe Latitudes and Meridians */}
              <g clipPath="url(#core-globeClip)">
                <ellipse cx="56" cy="51" rx="14.5" ry="4.8" stroke="url(#core-meridian)" strokeWidth="1" fill="none" opacity="0.85" />
                <ellipse cx="56" cy="45" rx="13" ry="3.8" stroke="url(#core-meridian)" strokeWidth="0.85" fill="none" opacity="0.7" />
                <ellipse cx="56" cy="57" rx="13" ry="3.8" stroke="url(#core-meridian)" strokeWidth="0.85" fill="none" opacity="0.7" />
                <ellipse cx="56" cy="51" rx="5.2" ry="14.5" stroke="url(#core-meridian)" strokeWidth="1.1" fill="none" opacity="0.85" />
                <line x1="56" y1="36.5" x2="56" y2="65.5" stroke="url(#core-meridian)" strokeWidth="1.2" opacity="0.9" />

                {/* Glowing Nucleus Node */}
                <circle cx="54" cy="49" r="6" fill="#00F5FF" opacity="0.35" />
                <circle cx="53" cy="48" r="2.8" fill="#FFFFFF" opacity="0.9" />
              </g>
              <circle cx="56" cy="51" r="14.5" fill="none" stroke="#00F5FF" strokeWidth="0.9" opacity="0.7" />
            </svg>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TYPOGRAPHY: "InfoAtlas" WITH METALLIC SHIMMER */}
        {/* ========================================================= */}
        <div
          className={`mt-6 transition-all duration-700 ease-out transform ${
            stage >= 2 ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
          }`}
        >
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-sans flex items-center justify-center gap-0.5">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #E0F2FE 0%, #00F5FF 40%, #3888FF 100%)",
                filter: "drop-shadow(0 0 20px rgba(0,245,255,0.45))",
              }}
            >
              Info
            </span>
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #3888FF 0%, #8A4BFF 50%, #E879F9 100%)",
                filter: "drop-shadow(0 0 20px rgba(138,75,255,0.45))",
              }}
            >
              Atlas
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ml-1.5 shadow-[0_0_10px_#00F5FF] animate-pulse"></span>
          </h1>
        </div>

        {/* SUBTITLE & NETWORK TELEMETRY BADGE */}
        <div
          className={`mt-3 transition-all duration-700 ease-out transform ${
            stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 shadow-inner backdrop-blur-md">
            <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-cyan-300 tracking-wider uppercase">
              <Globe className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} />
              Global Intelligence Grid
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[10px] sm:text-[11px] font-bold text-indigo-300 tracking-wider uppercase">
              750+ Districts
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-400 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PROGRESS LINE & REAL-TIME SYSTEM BOOT TICKER */}
        {/* ========================================================= */}
        <div className="mt-8 w-full max-w-xs sm:max-w-sm space-y-2.5">
          {/* Progress Bar Track */}
          <div className="relative w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden border border-slate-700/50 shadow-inner">
            <div
              className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-150 ease-out bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 shadow-[0_0_12px_rgba(0,245,255,0.7)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Status Label & Percentage Counter */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
            <div className="flex items-center gap-1.5 text-cyan-300 font-medium truncate max-w-[240px]">
              <Radio className="w-3 h-3 text-cyan-400 shrink-0 animate-pulse" />
              <span className="truncate">{statusText}</span>
            </div>
            <span className="font-mono text-xs font-bold text-white shrink-0 ml-2">
              {progress}%
            </span>
          </div>
        </div>

        {/* Minimal Interactive Skip Instruction */}
        <div
          className={`mt-6 transition-opacity duration-500 text-[11px] text-slate-500 hover:text-slate-300 ${
            stage >= 1 ? "opacity-75" : "opacity-0"
          }`}
        >
          <span>
            Click anywhere or press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">Space</kbd> to enter
          </span>
        </div>
      </div>
    </div>
  );
};
