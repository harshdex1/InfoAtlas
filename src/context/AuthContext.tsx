import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Bookmark, SearchHistoryItem, RecentlyViewedItem } from "../types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  bookmarks: Bookmark[];
  addBookmark: (bookmark: Omit<Bookmark, "id" | "userId" | "createdAt">) => void;
  removeBookmark: (url: string) => void;
  isBookmarked: (url: string) => boolean;
  history: SearchHistoryItem[];
  addHistory: (query: string) => void;
  clearHistory: () => void;
  recentlyViewed: RecentlyViewedItem[];
  addRecentlyViewed: (item: Omit<RecentlyViewedItem, "id" | "userId" | "viewedAt">) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("infoatlas_current_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem("infoatlas_bookmarks");
    return saved ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState<SearchHistoryItem[]>(() => {
    const saved = localStorage.getItem("infoatlas_history");
    return saved ? JSON.parse(saved) : [];
  });

  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>(() => {
    const saved = localStorage.getItem("infoatlas_recent");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("infoatlas_current_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("infoatlas_current_user");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("infoatlas_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem("infoatlas_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("infoatlas_recent", JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600)); // simulate secure auth delay
    setIsLoading(false);

    if (!email || !pass) {
      return { success: false, error: "Please enter both email and password." };
    }

    if (pass.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    const registeredUsers = JSON.parse(localStorage.getItem("infoatlas_users") || "[]");
    const found = registeredUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (found) {
      if (found.password !== pass) {
        return { success: false, error: "Incorrect password. Please try again." };
      }
      const loggedUser = { uid: found.uid, email: found.email, displayName: found.displayName };
      setUser(loggedUser);
      return { success: true };
    } else {
      // Auto-create for convenience if not found, or demo account
      const newUser = {
        uid: "user_" + Math.random().toString(36).substring(2, 9),
        email,
        displayName: email.split("@")[0],
        password: pass,
      };
      registeredUsers.push(newUser);
      localStorage.setItem("infoatlas_users", JSON.stringify(registeredUsers));
      const loggedUser = { uid: newUser.uid, email: newUser.email, displayName: newUser.displayName };
      setUser(loggedUser);
      return { success: true };
    }
  };

  const register = async (name: string, email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(false);

    if (!name || !email || !pass) {
      return { success: false, error: "All fields are required." };
    }
    if (pass.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    const registeredUsers = JSON.parse(localStorage.getItem("infoatlas_users") || "[]");
    const exists = registeredUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return { success: false, error: "An account with this email already exists." };
    }

    const newUser = {
      uid: "user_" + Math.random().toString(36).substring(2, 9),
      email,
      displayName: name,
      password: pass,
    };
    registeredUsers.push(newUser);
    localStorage.setItem("infoatlas_users", JSON.stringify(registeredUsers));

    const loggedUser = { uid: newUser.uid, email: newUser.email, displayName: newUser.displayName };
    setUser(loggedUser);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("infoatlas_current_user");
  };

  const addBookmark = (bm: Omit<Bookmark, "id" | "userId" | "createdAt">) => {
    if (!user) return;
    if (bookmarks.some((b) => b.url === bm.url && b.userId === user.uid)) return;
    const newBm: Bookmark = {
      ...bm,
      id: "bm_" + Math.random().toString(36).substring(2, 9),
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };
    setBookmarks([newBm, ...bookmarks]);
  };

  const removeBookmark = (url: string) => {
    if (!user) return;
    setBookmarks(bookmarks.filter((b) => !(b.url === url && b.userId === user.uid)));
  };

  const isBookmarked = (url: string): boolean => {
    if (!user) return false;
    return bookmarks.some((b) => b.url === url && b.userId === user.uid);
  };

  const addHistory = (query: string) => {
    if (!user || !query.trim()) return;
    const newItem: SearchHistoryItem = {
      id: "hist_" + Math.random().toString(36).substring(2, 9),
      userId: user.uid,
      query: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + new Date().toLocaleDateString(),
    };
    setHistory([newItem, ...history.filter(h => h.query.toLowerCase() !== query.toLowerCase())].slice(0, 50));
  };

  const clearHistory = () => {
    if (!user) return;
    setHistory(history.filter(h => h.userId !== user.uid));
  };

  const addRecentlyViewed = (item: Omit<RecentlyViewedItem, "id" | "userId" | "viewedAt">) => {
    if (!user) return;
    const newItem: RecentlyViewedItem = {
      ...item,
      id: "rec_" + Math.random().toString(36).substring(2, 9),
      userId: user.uid,
      viewedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setRecentlyViewed([newItem, ...recentlyViewed.filter(r => r.url !== item.url)].slice(0, 20));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        bookmarks: bookmarks.filter(b => user && b.userId === user.uid),
        addBookmark,
        removeBookmark,
        isBookmarked,
        history: history.filter(h => user && h.userId === user.uid),
        addHistory,
        clearHistory,
        recentlyViewed: recentlyViewed.filter(r => user && r.userId === user.uid),
        addRecentlyViewed,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
