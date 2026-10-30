import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

export type BackHandler = () => boolean; // return true if handled, false to continue

interface RegisteredHandler {
  id: string;
  priority: number; // Higher numbers run first
  handler: BackHandler;
}

interface NavigationContextType {
  registerBackHandler: (priority: number, handler: BackHandler, id?: string) => () => void;
  triggerBack: () => boolean;
  isExitModalOpen: boolean;
  openExitModal: () => void;
  closeExitModal: () => void;
  confirmExit: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const handlersRef = useRef<RegisteredHandler[]>([]);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const isExitingRef = useRef(false);

  // Register a back action handler
  const registerBackHandler = useCallback((priority: number, handler: BackHandler, id?: string) => {
    const handlerId = id || `handler_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const reg: RegisteredHandler = { id: handlerId, priority, handler };

    handlersRef.current = [...handlersRef.current.filter((h) => h.id !== handlerId), reg].sort(
      (a, b) => b.priority - a.priority
    );

    return () => {
      handlersRef.current = handlersRef.current.filter((h) => h.id !== handlerId);
    };
  }, []);

  const openExitModal = useCallback(() => {
    setIsExitModalOpen(true);
  }, []);

  const closeExitModal = useCallback(() => {
    setIsExitModalOpen(false);
  }, []);

  const confirmExit = useCallback(() => {
    isExitingRef.current = true;
    setIsExitModalOpen(false);

    // 1. Capacitor exit
    const capApp = (window as any).Capacitor?.Plugins?.App;
    if (capApp && typeof capApp.exitApp === "function") {
      try {
        capApp.exitApp();
        return;
      } catch (err) {
        console.warn("Capacitor exit error:", err);
      }
    }

    // 2. Android wrapper or standard browser history back
    if (typeof window !== "undefined") {
      try {
        window.history.back();
      } catch {}
    }
  }, []);

  // Trigger back execution through the registered priority chain
  const triggerBack = useCallback((): boolean => {
    // If exit modal is already open, pressing back stays/closes it
    if (isExitModalOpen) {
      setIsExitModalOpen(false);
      return true;
    }

    // Iterate through registered handlers from highest priority to lowest
    const sorted = [...handlersRef.current].sort((a, b) => b.priority - a.priority);
    for (const item of sorted) {
      try {
        const handled = item.handler();
        if (handled) {
          return true;
        }
      } catch (err) {
        console.warn(`Back handler ${item.id} error:`, err);
      }
    }

    // Nothing handled it: we are at the root
    setIsExitModalOpen(true);
    return true;
  }, [isExitModalOpen]);

  // Hook into Capacitor backButton event and standard browser popstate
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Capacitor Android App Plugin listener
    let capListenerHandle: any = null;
    const capApp = (window as any).Capacitor?.Plugins?.App;
    if (capApp && typeof capApp.addListener === "function") {
      try {
        capListenerHandle = capApp.addListener("backButton", ({ canGoBack }: { canGoBack: boolean }) => {
          triggerBack();
        });
      } catch (err) {
        console.warn("Failed to attach Capacitor backButton listener:", err);
      }
    }

    // 2. Browser / WebView popstate listener
    // Ensure initial history state exists
    try {
      if (!window.history.state || !window.history.state.infoatlas) {
        window.history.replaceState({ infoatlas: true, depth: 0 }, "");
      }
    } catch {}

    const handlePopState = (e: PopStateEvent) => {
      if (isExitingRef.current) {
        // User confirmed exit; let the browser/system proceed
        return;
      }

      const handled = triggerBack();
      if (handled) {
        // Prevent default external navigation by pushing a dummy state to keep the user inside InfoAtlas
        try {
          window.history.pushState({ infoatlas: true, time: Date.now() }, "");
        } catch {}
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (capListenerHandle) {
        if (typeof capListenerHandle.remove === "function") {
          capListenerHandle.remove();
        } else if (capListenerHandle.then) {
          capListenerHandle.then((l: any) => l?.remove?.()).catch(() => {});
        }
      }
    };
  }, [triggerBack]);

  return (
    <NavigationContext.Provider
      value={{
        registerBackHandler,
        triggerBack,
        isExitModalOpen,
        openExitModal,
        closeExitModal,
        confirmExit,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};
