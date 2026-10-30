import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AppDynamicConfig } from "../types";
import { useAuth } from "./AuthContext";

const DEFAULT_CONFIG: AppDynamicConfig = {
  appTagline: "Global Knowledge & Real-Time Intelligence",
  announcementBanner: {
    enabled: true,
    text: "Welcome to InfoAtlas — Verified Global, National & District Intelligence Network.",
    badgeText: "Live Feed",
    variant: "primary",
    linkUrl: "",
  },
  accentColor: "indigo",
  featureToggles: {
    cricket: true,
    sports: true,
    gmail: true,
    localNews: true,
    knowledge: true,
    aiAssistant: true,
    breakingTicker: true,
  },
  breakingAlerts: [
    "InfoAtlas verified intelligence network active across 750+ Indian districts.",
    "Global technology, science, and market feeds streaming in real time.",
  ],
  customCategories: ["Technology", "Markets", "Geopolitics", "Science", "Defence", "Space"],
  aiSettings: {
    modelPreference: "gemini-3.8-flash",
    temperature: 0.7,
    searchFallbackPriority: "ai-first",
  },
  updatedAt: new Date().toISOString(),
  updatedBy: "system",
  changeLog: [],
};

interface AppConfigContextType {
  config: AppDynamicConfig;
  isLoading: boolean;
  refreshConfig: () => Promise<void>;
  updateConfig: (newConfig: Partial<AppDynamicConfig>) => Promise<boolean>;
  executeDeveloperAi: (
    instruction: string
  ) => Promise<{ success: boolean; summary?: string; explanation?: string; error?: string }>;
  isFeatureEnabled: (feature: keyof AppDynamicConfig["featureToggles"]) => boolean;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export const AppConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<AppDynamicConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/app/config");
      if (res.ok) {
        const data = await res.json();
        if (data && data.config) {
          setConfig(data.config);
        }
      }
    } catch (err) {
      console.warn("Could not load dynamic app config:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  // Sync theme accent class or attribute on root HTML element
  useEffect(() => {
    if (typeof document !== "undefined" && config.accentColor) {
      document.documentElement.setAttribute("data-accent", config.accentColor);
    }
  }, [config.accentColor]);

  const updateConfig = async (partialConfig: Partial<AppDynamicConfig>): Promise<boolean> => {
    try {
      const merged = { ...config, ...partialConfig };
      const res = await fetch("/api/app/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: merged,
          userEmail: user?.email || "developer@infoatlas.app",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error("Error updating config:", err);
      return false;
    }
  };

  const executeDeveloperAi = async (
    instruction: string
  ): Promise<{ success: boolean; summary?: string; explanation?: string; error?: string }> => {
    try {
      const res = await fetch("/api/developer/ai-execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction,
          currentConfig: config,
          userRole: user?.role || "developer",
          userEmail: user?.email || "developer@infoatlas.app",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Failed to execute developer AI instruction.",
        };
      }

      if (data.config) {
        setConfig(data.config);
      }
      return {
        success: true,
        summary: data.summary,
        explanation: data.explanation,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Network error while connecting to Developer AI.",
      };
    }
  };

  const isFeatureEnabled = useCallback(
    (feature: keyof AppDynamicConfig["featureToggles"]): boolean => {
      if (!config.featureToggles) return true;
      return config.featureToggles[feature] !== false;
    },
    [config.featureToggles]
  );

  return (
    <AppConfigContext.Provider
      value={{
        config,
        isLoading,
        refreshConfig,
        updateConfig,
        executeDeveloperAi,
        isFeatureEnabled,
      }}
    >
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error("useAppConfig must be used within an AppConfigProvider");
  }
  return context;
};
