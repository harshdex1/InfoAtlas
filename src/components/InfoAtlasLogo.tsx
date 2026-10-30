import React from "react";

export interface InfoAtlasLogoProps {
  variant?: "monogram" | "full" | "compact" | "icon-only";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | number;
  animated?: boolean;
  withBackground?: boolean;
  withTagline?: boolean;
  isDark?: boolean;
  className?: string;
  onClick?: () => void;
}

export const InfoAtlasLogo: React.FC<InfoAtlasLogoProps> = ({
  variant = "full",
  size = "md",
  animated = false,
  withBackground = false,
  withTagline = false,
  isDark = true,
  className = "",
  onClick,
}) => {
  // Determine dimensions
  const getDimensions = () => {
    if (typeof size === "number") {
      return { width: size, height: size };
    }
    switch (size) {
      case "xs":
        return variant === "full" ? { width: 110, height: 32 } : { width: 24, height: 24 };
      case "sm":
        return variant === "full" ? { width: 140, height: 40 } : { width: 32, height: 32 };
      case "md":
        return variant === "full" ? { width: 175, height: 48 } : { width: 44, height: 44 };
      case "lg":
        return variant === "full" ? { width: 230, height: 64 } : { width: 64, height: 64 };
      case "xl":
        return variant === "full" ? { width: 300, height: 84 } : { width: 96, height: 96 };
      case "2xl":
        return variant === "full" ? { width: 400, height: 112 } : { width: 140, height: 140 };
      default:
        return { width: 175, height: 48 };
    }
  };

  const { width, height } = getDimensions();
  const isMonogramOnly = variant === "monogram" || variant === "icon-only";
  const viewBox = isMonogramOnly ? "0 0 100 100" : withTagline ? "0 0 340 100" : "0 0 320 100";

  // Unique ID prefix to avoid SVG defs collision
  const uid = React.useId().replace(/:/g, "_");

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center justify-center select-none ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      style={{ width, height }}
    >
      <svg
        viewBox={viewBox}
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`overflow-visible ${animated ? "group" : ""}`}
      >
        <defs>
          {/* Deep Navy Background Gradient */}
          <linearGradient id={`${uid}-bgGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#050C24" />
            <stop offset="50%" stopColor="#030817" />
            <stop offset="100%" stopColor="#020510" />
          </linearGradient>

          {/* Letter I Gradient (Luminous Cyan to Electric Azure) */}
          <linearGradient id={`${uid}-iGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F5FF" />
            <stop offset="45%" stopColor="#00C8FF" />
            <stop offset="100%" stopColor="#386BFF" />
          </linearGradient>

          {/* Letter A Gradient (Electric Azure to Vivid Violet-Purple) */}
          <linearGradient id={`${uid}-aGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#386BFF" />
            <stop offset="55%" stopColor="#7048FF" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>

          {/* Globe Atmosphere Radial Gradient */}
          <radialGradient id={`${uid}-globeCore`} cx="45%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#0A2A66" />
            <stop offset="45%" stopColor="#061A42" />
            <stop offset="85%" stopColor="#030B1E" />
            <stop offset="100%" stopColor="#010612" />
          </radialGradient>

          {/* Globe Grid Meridian Gradient */}
          <linearGradient id={`${uid}-globeGrid`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F5FF" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#3888FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8A4BFF" stopOpacity="0.75" />
          </linearGradient>

          {/* Orbital Ring Gradient (Cyan - Blue - Violet - Purple) */}
          <linearGradient id={`${uid}-orbitGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F5FF" />
            <stop offset="35%" stopColor="#386BFF" />
            <stop offset="70%" stopColor="#8A3FFC" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>

          {/* Specular Light Sweep Gradient */}
          <linearGradient id={`${uid}-lightSweep`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.75" />
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Wordmark Info Gradient */}
          <linearGradient id={`${uid}-wordInfo`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#3875FF" />
          </linearGradient>

          {/* Wordmark Atlas Gradient */}
          <linearGradient id={`${uid}-wordAtlas`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3875FF" />
            <stop offset="50%" stopColor="#7E47FF" />
            <stop offset="100%" stopColor="#B366FF" />
          </linearGradient>

          {/* Soft Glow Filter */}
          <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Atmospheric Bloom Filter */}
          <filter id={`${uid}-bloom`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur1" />
            <feGaussianBlur stdDeviation="2" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Mask for Globe (clips elements inside the sphere) */}
          <clipPath id={`${uid}-globeClip`}>
            <circle cx="56" cy="51" r="14" />
          </clipPath>

          {/* Mask for Monogram Light Sweep */}
          <mask id={`${uid}-monogramMask`}>
            {/* The white shapes match the monogram letters */}
            <g fill="#FFFFFF">
              <rect x="14" y="23" width="13" height="54" rx="4" />
              <path d="M 56 23 L 37 77 L 50 77 L 56 58 L 62 77 L 75 77 Z" />
            </g>
          </mask>
        </defs>

        {/* Optional Dark Navy Background Tile */}
        {withBackground && (
          <rect
            x="0"
            y="0"
            width={isMonogramOnly ? "100" : withTagline ? "340" : "320"}
            height="100"
            rx={isMonogramOnly ? "24" : "20"}
            fill={`url(#${uid}-bgGrad)`}
            stroke="#16254E"
            strokeWidth="1.2"
          />
        )}

        {/* Ambient Glow behind Monogram */}
        <circle
          cx="50"
          cy="50"
          r="36"
          fill="#386BFF"
          opacity={isDark ? "0.22" : "0.14"}
          filter={`url(#${uid}-bloom)`}
        />
        <circle
          cx="56"
          cy="51"
          r="20"
          fill="#00F5FF"
          opacity={isDark ? "0.3" : "0.2"}
          filter={`url(#${uid}-glow)`}
        />

        {/* ========================================================== */}
        {/* REAR ORBITAL RING ARC (passes behind the globe and monogram) */}
        {/* ========================================================== */}
        <g transform="rotate(-28, 56, 51)">
          <path
            d="M 18 51 A 38 14 0 0 1 94 51"
            stroke={`url(#${uid}-orbitGrad)`}
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.65"
            strokeDasharray="1 3"
          />
        </g>

        {/* ========================================================== */}
        {/* THE "I" MONOGRAM PILLAR */}
        {/* ========================================================== */}
        <g filter={`url(#${uid}-glow)`}>
          {/* Main I Pillar */}
          <rect
            x="14"
            y="23"
            width="13"
            height="54"
            rx="4"
            fill={`url(#${uid}-iGrad)`}
          />
          {/* Inner Light Chamfer Highlight */}
          <path
            d="M 16 25 L 24 25 L 24 75 L 16 75 Z"
            fill="#FFFFFF"
            opacity="0.18"
          />
          {/* Neon Specular Core Line */}
          <line
            x1="20.5"
            y1="27"
            x2="20.5"
            y2="73"
            stroke="#FFFFFF"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.4"
          />
        </g>

        {/* ========================================================== */}
        {/* THE "A" MONOGRAM STRUCTURE */}
        {/* ========================================================== */}
        <g filter={`url(#${uid}-glow)`}>
          {/* Left leg of A */}
          <path
            d="M 56 23 L 36 77 L 48 77 L 56 53 Z"
            fill={`url(#${uid}-iGrad)`}
          />
          {/* Right leg of A */}
          <path
            d="M 56 23 L 56 53 L 64 77 L 76 77 Z"
            fill={`url(#${uid}-aGrad)`}
          />
          {/* Top Apex Crown Connection */}
          <circle cx="56" cy="24" r="3.5" fill="#00F5FF" />
        </g>

        {/* ========================================================== */}
        {/* THE GLOWING GLOBE SPHERE */}
        {/* ========================================================== */}
        <g>
          {/* Globe Atmosphere Base */}
          <circle
            cx="56"
            cy="51"
            r="14"
            fill={`url(#${uid}-globeCore)`}
            stroke={`url(#${uid}-globeGrid)`}
            strokeWidth="1.5"
            filter={`url(#${uid}-glow)`}
          />

          {/* Clipped Globe Grid Lines (Latitudes & Longitudes) */}
          <g clipPath={`url(#${uid}-globeClip)`}>
            {/* Latitude Equator */}
            <ellipse
              cx="56"
              cy="51"
              rx="14"
              ry="4.5"
              stroke={`url(#${uid}-globeGrid)`}
              strokeWidth="1"
              fill="none"
              opacity="0.8"
            />
            {/* Northern Latitude */}
            <ellipse
              cx="56"
              cy="45"
              rx="12.5"
              ry="3.5"
              stroke={`url(#${uid}-globeGrid)`}
              strokeWidth="0.85"
              fill="none"
              opacity="0.65"
            />
            {/* Southern Latitude */}
            <ellipse
              cx="56"
              cy="57"
              rx="12.5"
              ry="3.5"
              stroke={`url(#${uid}-globeGrid)`}
              strokeWidth="0.85"
              fill="none"
              opacity="0.65"
            />

            {/* Central Meridian */}
            <ellipse
              cx="56"
              cy="51"
              rx="5"
              ry="14"
              stroke={`url(#${uid}-globeGrid)`}
              strokeWidth="1"
              fill="none"
              opacity="0.8"
            />
            {/* Prime Longitude */}
            <line
              x1="56"
              y1="37"
              x2="56"
              y2="65"
              stroke={`url(#${uid}-globeGrid)`}
              strokeWidth="1.2"
              opacity="0.9"
            />

            {/* Glowing Core Radial Pulse */}
            <circle
              cx="54"
              cy="49"
              r="7"
              fill="#00F5FF"
              opacity="0.25"
              filter={`url(#${uid}-glow)`}
            />
            <circle
              cx="53"
              cy="48"
              r="2.5"
              fill="#FFFFFF"
              opacity="0.75"
            />
          </g>

          {/* Outer Atmospheric Radiant Rim */}
          <circle
            cx="56"
            cy="51"
            r="14"
            fill="none"
            stroke="#00F5FF"
            strokeWidth="0.8"
            opacity="0.6"
          />
        </g>

        {/* ========================================================== */}
        {/* FRONT ORBITAL RING ARC (sweeps across the front with intense glow) */}
        {/* ========================================================== */}
        <g transform="rotate(-28, 56, 51)" filter={`url(#${uid}-glow)`}>
          {/* Main Glowing Orbit Tube */}
          <path
            d="M 94 51 A 38 14 0 0 1 18 51"
            stroke={`url(#${uid}-orbitGrad)`}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Specular Core Streak */}
          <path
            d="M 88 51.5 A 35 12 0 0 1 24 51.5"
            stroke="#FFFFFF"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Orbit Satellite / Radiant Celestial Beacon */}
          <circle cx="85" cy="51" r="3.2" fill="#FFFFFF" filter={`url(#${uid}-glow)`} />
          <circle cx="85" cy="51" r="1.6" fill="#00F5FF" />
          {/* Secondary micro-beacon */}
          <circle cx="28" cy="50.5" r="1.8" fill="#C084FC" />
        </g>

        {/* Dynamic Light Sweep Highlight Overlay */}
        <rect
          x="10"
          y="20"
          width="70"
          height="60"
          fill={`url(#${uid}-lightSweep)`}
          mask={`url(#${uid}-monogramMask)`}
          className={animated ? "animate-pulse" : ""}
        />

        {/* ========================================================== */}
        {/* WORDMARK "InfoAtlas" AND TAGLINE */}
        {/* ========================================================== */}
        {!isMonogramOnly && (
          <g transform="translate(108, 0)">
            {/* "InfoAtlas" Wordmark */}
            <text
              x="0"
              y="58"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontSize="44"
              fontWeight="900"
              letterSpacing="-0.03em"
            >
              <tspan fill={`url(#${uid}-wordInfo)`} filter={`url(#${uid}-glow)`}>
                Info
              </tspan>
              <tspan fill={`url(#${uid}-wordAtlas)`} filter={`url(#${uid}-glow)`}>
                Atlas
              </tspan>
            </text>

            {/* Micro accent dot over Atlas */}
            <circle cx="196" cy="28" r="2.5" fill="#C084FC" filter={`url(#${uid}-glow)`} />

            {/* Tagline */}
            {withTagline && (
              <text
                x="2"
                y="77"
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                fontSize="8.5"
                fontWeight="700"
                letterSpacing="0.26em"
                fill={isDark ? "#8298BD" : "#506B99"}
                opacity="0.9"
              >
                EXPLORE • LEARN • STAY UPDATED
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};
