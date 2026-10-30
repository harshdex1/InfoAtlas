import React from "react";
import { InfoAtlasLogo } from "./InfoAtlasLogo";

interface InfoAtlasLoaderProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  isDark?: boolean;
  className?: string;
}

export const InfoAtlasLoader: React.FC<InfoAtlasLoaderProps> = ({
  size = "md",
  message,
  isDark = true,
  className = "",
}) => {
  const logoSize = size === "sm" ? "xs" : size === "lg" ? "md" : "sm";

  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-8 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Subtle breathing glow ring */}
        <div
          className="absolute w-12 h-12 rounded-full animate-ping opacity-25 pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(0,245,255,0.6) 0%, rgba(56,107,255,0.2) 60%, transparent 80%)",
          }}
        />
        <div className="relative transform hover:scale-105 transition-transform duration-300">
          <InfoAtlasLogo
            variant="monogram"
            size={logoSize}
            animated
            withBackground={false}
            isDark={isDark}
          />
        </div>
      </div>
      {message && (
        <p
          className={`text-xs font-semibold tracking-wide transition-colors ${
            isDark ? "text-[#8EA5CB]" : "text-[#60769A]"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};
