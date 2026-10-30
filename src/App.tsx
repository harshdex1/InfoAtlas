import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth, safeStorage } from "./context/AuthContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { NavigationProvider, useNavigation } from "./context/NavigationContext";
import { AuthPage } from "./components/AuthPage";
import { StartupSplash } from "./components/StartupSplash";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { TopNavbar } from "./components/TopNavbar";
import { Sidebar } from "./components/Sidebar";
import { LatestNewsFeed } from "./components/LatestNewsFeed";
import { RightPanel } from "./components/RightPanel";
import { SearchResults } from "./components/SearchResults";
import { ArticleReader } from "./components/ArticleReader";
import { NewsArticleReader } from "./components/NewsArticleReader";
import { SportsPage } from "./components/SportsPage";
import { CricketPage } from "./components/CricketPage";
import { KnowledgePage } from "./components/KnowledgePage";
import { BookmarksView } from "./components/BookmarksView";
import { HistoryView } from "./components/HistoryView";
import { ProfileModal } from "./components/ProfileModal";
import { AiAssistantModal } from "./components/AiAssistantModal";
import { DeveloperStudioModal } from "./components/DeveloperStudioModal";
import { EditorNewsroomModal } from "./components/EditorNewsroomModal";
import { AppConfigProvider, useAppConfig } from "./context/AppConfigContext";
import { AiKnowledgeArticleReader } from "./components/AiKnowledgeArticleReader";
import { ContactDeveloperPage } from "./components/ContactDeveloperPage";
import { LocalDistrictNewsPage } from "./components/LocalDistrictNewsPage";
import { ExitConfirmModal } from "./components/ExitConfirmModal";
import { GmailView } from "./components/GmailView";
import { searchKnowledge, fetchNewsArticles } from "./services/api";
import { SearchResult, NewsArticle, AiKnowledgeArticle, TopicImage } from "./types";

type ViewType =
  | "home"
  | "news"
  | "local-news"
  | "news-article"
  | "sports"
  | "cricket"
  | "gmail"
  | "knowledge"
  | "search"
  | "article"
  | "ai-article"
  | "bookmarks"
  | "history"
  | "contact";

interface NavStackItem {
  view: ViewType;
  selectedNewsArticle?: NewsArticle | null;
  selectedArticleTitle?: string;
  selectedAiArticle?: AiKnowledgeArticle | null;
  searchQuery?: string;
  selectedNewsCategory?: string;
}

const MainApp: React.FC = () => {
  const { addHistory, isDeveloper, isEditor } = useAuth();
  const { config } = useAppConfig();
  const { t } = useLanguage();
  const {
    registerBackHandler,
    isExitModalOpen,
    openExitModal,
    closeExitModal,
    confirmExit,
  } = useNavigation();

  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [navStack, setNavStack] = useState<NavStackItem[]>([{ view: "home" }]);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchNewsArticles, setSearchNewsArticles] = useState<NewsArticle[]>([]);
  const [searchAiArticle, setSearchAiArticle] = useState<AiKnowledgeArticle | undefined>(undefined);
  const [searchTopicImage, setSearchTopicImage] = useState<TopicImage | undefined>(undefined);
  const [searchSourceUsed, setSearchSourceUsed] = useState<"wikimedia" | "ai-fallback" | "ai-synthesized">("wikimedia");
  const [searchIsAiFallback, setSearchIsAiFallback] = useState<boolean>(false);
  const [searchStatusMessage, setSearchStatusMessage] = useState<string>("");
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);

  const [selectedArticleTitle, setSelectedArticleTitle] = useState<string>("");
  const [selectedAiArticle, setSelectedAiArticle] = useState<AiKnowledgeArticle | null>(null);
  const [selectedNewsArticle, setSelectedNewsArticle] = useState<NewsArticle | null>(null);
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>("all");
  const [returnNewsView, setReturnNewsView] = useState<"home" | "news" | "local-news" | "sports" | "cricket" | "search">("news");

  const [breakingArticles, setBreakingArticles] = useState<NewsArticle[]>([]);
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState<boolean>(false);

  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showAI, setShowAI] = useState<boolean>(false);
  const [showDeveloperStudio, setShowDeveloperStudio] = useState<boolean>(false);
  const [showEditorNewsroom, setShowEditorNewsroom] = useState<boolean>(false);

  // Default to light mode
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = safeStorage.getItem("infoatlas_theme");
    return saved ? saved === "dark" : false;
  });

  useEffect(() => {
    safeStorage.setItem("infoatlas_theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    let isMounted = true;
    async function fetchBreaking() {
      try {
        const data = await fetchNewsArticles("breaking");
        if (isMounted && Array.isArray(data)) {
          setBreakingArticles(data);
        }
      } catch (err) {
        console.warn("Breaking news initial fetch handled gracefully:", err);
      }
    }
    fetchBreaking();
    return () => {
      isMounted = false;
    };
  }, []);

  // Safe navigation push
  const pushView = useCallback(
    (
      newView: ViewType,
      options?: {
        selectedNewsArticle?: NewsArticle | null;
        selectedArticleTitle?: string;
        selectedAiArticle?: AiKnowledgeArticle | null;
        searchQuery?: string;
        selectedNewsCategory?: string;
      }
    ) => {
      setCurrentView(newView);
      setNavStack((prev) => {
        // Prevent duplicate consecutive entries
        const last = prev[prev.length - 1];
        if (last && last.view === newView && !options?.selectedNewsArticle && !options?.selectedArticleTitle) {
          return prev;
        }
        return [...prev, { view: newView, ...options }];
      });

      if (typeof window !== "undefined") {
        try {
          window.history.pushState({ infoatlas: true, view: newView }, "");
        } catch {}
      }
    },
    []
  );

  // Register high-priority Back handler for open root modals/drawers
  useEffect(() => {
    const unregister = registerBackHandler(
      95,
      () => {
        if (showDeveloperStudio) {
          setShowDeveloperStudio(false);
          return true;
        }
        if (showEditorNewsroom) {
          setShowEditorNewsroom(false);
          return true;
        }
        if (showProfile) {
          setShowProfile(false);
          return true;
        }
        if (showAI) {
          setShowAI(false);
          return true;
        }
        if (isOpenMobileSidebar) {
          setIsOpenMobileSidebar(false);
          return true;
        }
        return false;
      },
      "main_app_modals"
    );

    return () => unregister();
  }, [showProfile, showAI, showDeveloperStudio, showEditorNewsroom, isOpenMobileSidebar, registerBackHandler]);

  // Register view navigation Back handler
  useEffect(() => {
    const unregister = registerBackHandler(
      30,
      () => {
        // 1. Nested article views return to feed or search
        if (currentView === "news-article") {
          setCurrentView(returnNewsView || "news");
          setSelectedNewsArticle(null);
          return true;
        }
        if (currentView === "article" || currentView === "ai-article") {
          setCurrentView("search");
          setSelectedArticleTitle("");
          setSelectedAiArticle(null);
          return true;
        }
        if (currentView === "search") {
          setCurrentView("home");
          return true;
        }

        // 2. Previous in-app navigation history stack
        if (navStack.length > 1) {
          const newStack = [...navStack];
          newStack.pop(); // pop current
          const previous = newStack[newStack.length - 1];
          setNavStack(newStack);
          setCurrentView(previous.view);
          if (previous.selectedNewsArticle !== undefined) setSelectedNewsArticle(previous.selectedNewsArticle);
          if (previous.selectedArticleTitle !== undefined) setSelectedArticleTitle(previous.selectedArticleTitle);
          if (previous.selectedAiArticle !== undefined) setSelectedAiArticle(previous.selectedAiArticle);
          if (previous.searchQuery !== undefined) setSearchQuery(previous.searchQuery);
          return true;
        }

        // 3. Section main page with no history goes to home
        if (currentView !== "home") {
          setCurrentView("home");
          setNavStack([{ view: "home" }]);
          return true;
        }

        // 4. At main Home screen with no previous navigation: show Exit confirmation dialog!
        openExitModal();
        return true;
      },
      "main_app_views"
    );

    return () => unregister();
  }, [currentView, returnNewsView, navStack, registerBackHandler, openExitModal]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    pushView("search", { searchQuery: query });
    setIsSearchLoading(true);
    addHistory(query);

    const searchResponse = await searchKnowledge(query);
    setSearchResults(searchResponse.results || []);
    setSearchNewsArticles(searchResponse.newsArticles || []);
    setSearchAiArticle(searchResponse.aiArticle);
    setSearchTopicImage(searchResponse.topicImage);
    setSearchSourceUsed(searchResponse.sourceUsed);
    setSearchIsAiFallback(searchResponse.isAiFallback);
    setSearchStatusMessage(searchResponse.statusMessage);
    setIsSearchLoading(false);
  };

  const handleSelectArticle = (title: string) => {
    setSelectedArticleTitle(title);
    pushView("article", { selectedArticleTitle: title });
  };

  const handleSelectAiArticle = (article: AiKnowledgeArticle) => {
    setSelectedAiArticle(article);
    pushView("ai-article", { selectedAiArticle: article });
  };

  const handleSelectNewsArticle = (article: NewsArticle) => {
    if (
      currentView === "sports" ||
      currentView === "cricket" ||
      currentView === "news" ||
      currentView === "local-news" ||
      currentView === "home" ||
      currentView === "search"
    ) {
      setReturnNewsView(currentView);
    }
    setSelectedNewsArticle(article);
    pushView("news-article", { selectedNewsArticle: article });
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedNewsCategory(cat);
    pushView("news", { selectedNewsCategory: cat });
  };

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden transition-colors ${isDark ? "bg-slate-950 text-slate-100" : "bg-[#F5F8FF] text-[#102B59]"}`}>
      <TopNavbar
        onSearchSubmit={handleSearch}
        onOpenProfile={() => setShowProfile(true)}
        onOpenAI={() => setShowAI(true)}
        onOpenDeveloperStudio={() => setShowDeveloperStudio(true)}
        onOpenEditorNewsroom={() => setShowEditorNewsroom(true)}
        isDark={isDark}
        isAiOpen={showAI}
        toggleTheme={() => setIsDark(!isDark)}
        onToggleMobileSidebar={() => setIsOpenMobileSidebar(!isOpenMobileSidebar)}
        onNavigateHome={() => pushView("home")}
        onNavigateContact={() => pushView("contact")}
        currentView={currentView}
        onNavigate={(v) => pushView(v)}
        selectedNewsCategory={selectedNewsCategory}
        onCategorySelect={handleCategorySelect}
      />

      <div className="flex w-full max-w-full overflow-x-hidden min-w-0">
        <Sidebar
          currentView={currentView}
          onNavigate={(v) => pushView(v)}
          onCategorySelect={handleCategorySelect}
          isDark={isDark}
          isOpenMobile={isOpenMobileSidebar}
          onCloseMobile={() => setIsOpenMobileSidebar(false)}
          onOpenAI={() => setShowAI(true)}
          onOpenProfile={() => setShowProfile(true)}
          onOpenDeveloperStudio={() => setShowDeveloperStudio(true)}
          onOpenEditorNewsroom={() => setShowEditorNewsroom(true)}
        />

        <main className="flex-1 min-w-0 w-full max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {/* Global Dynamic Announcement Banner */}
          {config?.announcementBanner?.enabled && config.announcementBanner.text && (
            <div
              className={`mb-5 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold shadow-md border transition-all ${
                config.announcementBanner.variant === "amber"
                  ? "bg-amber-950/40 border-amber-600/50 text-amber-200"
                  : config.announcementBanner.variant === "emerald"
                  ? "bg-emerald-950/40 border-emerald-600/50 text-emerald-200"
                  : config.announcementBanner.variant === "rose"
                  ? "bg-rose-950/40 border-rose-600/50 text-rose-200"
                  : config.announcementBanner.variant === "cyan"
                  ? "bg-cyan-950/40 border-cyan-600/50 text-cyan-200"
                  : "bg-indigo-950/40 border-indigo-600/50 text-indigo-200"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider bg-white/10 shrink-0 border border-white/10">
                  {config.announcementBanner.badgeText || "Live Feed"}
                </span>
                <span className="truncate">{config.announcementBanner.text}</span>
              </div>
              {isDeveloper && (
                <button
                  type="button"
                  onClick={() => setShowDeveloperStudio(true)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] shrink-0 font-bold cursor-pointer transition-colors"
                >
                  Edit Live
                </button>
              )}
            </div>
          )}
          {currentView === "home" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full min-w-0">
              <div className="lg:col-span-8 space-y-6 min-w-0 w-full">
                <LatestNewsFeed
                  selectedCategory={selectedNewsCategory}
                  onCategoryChange={setSelectedNewsCategory}
                  onSelectArticle={handleSelectNewsArticle}
                  onNavigateToLocal={() => pushView("local-news")}
                  isDark={isDark}
                />
              </div>
              <div className="lg:col-span-4 min-w-0 w-full">
                <RightPanel
                  breakingArticles={breakingArticles}
                  onCategorySelect={handleCategorySelect}
                  onTopicSearch={handleSearch}
                  isDark={isDark}
                />
              </div>
            </div>
          )}

          {currentView === "news" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full min-w-0">
              <div className="lg:col-span-8 min-w-0 w-full">
                <LatestNewsFeed
                  selectedCategory={selectedNewsCategory}
                  onCategoryChange={setSelectedNewsCategory}
                  onSelectArticle={handleSelectNewsArticle}
                  onNavigateToLocal={() => pushView("local-news")}
                  isDark={isDark}
                />
              </div>
              <div className="lg:col-span-4 min-w-0 w-full">
                <RightPanel
                  breakingArticles={breakingArticles}
                  onCategorySelect={handleCategorySelect}
                  onTopicSearch={handleSearch}
                  isDark={isDark}
                />
              </div>
            </div>
          )}

          {currentView === "local-news" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full min-w-0">
              <div className="lg:col-span-8 min-w-0 w-full">
                <LocalDistrictNewsPage
                  onSelectArticle={handleSelectNewsArticle}
                  isDark={isDark}
                />
              </div>
              <div className="lg:col-span-4 min-w-0 w-full">
                <RightPanel
                  breakingArticles={breakingArticles}
                  onCategorySelect={handleCategorySelect}
                  onTopicSearch={handleSearch}
                  isDark={isDark}
                />
              </div>
            </div>
          )}

          {currentView === "news-article" && selectedNewsArticle && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full min-w-0">
              <div className="lg:col-span-8 min-w-0 w-full">
                <NewsArticleReader
                  article={selectedNewsArticle}
                  onBack={() => {
                    setCurrentView(returnNewsView as any);
                    setSelectedNewsArticle(null);
                  }}
                  onSelectArticle={handleSelectNewsArticle}
                  isDark={isDark}
                />
              </div>
              <div className="lg:col-span-4 min-w-0 w-full">
                <RightPanel
                  breakingArticles={breakingArticles}
                  onCategorySelect={handleCategorySelect}
                  onTopicSearch={handleSearch}
                  isDark={isDark}
                />
              </div>
            </div>
          )}

          {currentView === "sports" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full min-w-0">
              <div className="lg:col-span-8 min-w-0 w-full">
                <SportsPage isDark={isDark} onSelectArticle={handleSelectNewsArticle} />
              </div>
              <div className="lg:col-span-4 min-w-0 w-full">
                <RightPanel
                  breakingArticles={breakingArticles}
                  onCategorySelect={handleCategorySelect}
                  onTopicSearch={handleSearch}
                  isDark={isDark}
                />
              </div>
            </div>
          )}

          {currentView === "cricket" && (
            <div className="w-full min-w-0 max-w-full overflow-x-hidden">
              <CricketPage isDark={isDark} onSelectArticle={handleSelectNewsArticle} />
            </div>
          )}

          {currentView === "gmail" && (
            <div className="w-full min-w-0 max-w-full overflow-x-hidden">
              <GmailView isDark={isDark} />
            </div>
          )}

          {currentView === "knowledge" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full min-w-0">
              <div className="lg:col-span-8 min-w-0 w-full">
                <KnowledgePage onSearchSubmit={handleSearch} isDark={isDark} />
              </div>
              <div className="lg:col-span-4 min-w-0 w-full">
                <RightPanel
                  breakingArticles={breakingArticles}
                  onCategorySelect={handleCategorySelect}
                  onTopicSearch={handleSearch}
                  isDark={isDark}
                />
              </div>
            </div>
          )}

          {currentView === "search" && (
            <SearchResults
              query={searchQuery}
              results={searchResults}
              newsArticles={searchNewsArticles}
              aiArticle={searchAiArticle}
              topicImage={searchTopicImage}
              sourceUsed={searchSourceUsed}
              isAiFallback={searchIsAiFallback}
              statusMessage={searchStatusMessage}
              isLoading={isSearchLoading}
              onSelectArticle={handleSelectArticle}
              onSelectAiArticle={handleSelectAiArticle}
              onSelectNewsArticle={handleSelectNewsArticle}
              onBackToHome={() => pushView("home")}
              onExploreTopic={handleSearch}
              isDark={isDark}
            />
          )}

          {currentView === "article" && (
            <ArticleReader
              title={selectedArticleTitle}
              onBack={() => {
                setCurrentView("search");
                setSelectedArticleTitle("");
              }}
              isDark={isDark}
            />
          )}

          {currentView === "ai-article" && selectedAiArticle && (
            <AiKnowledgeArticleReader
              article={selectedAiArticle}
              onBack={() => {
                setCurrentView("search");
                setSelectedAiArticle(null);
              }}
              onExploreTopic={handleSearch}
              isDark={isDark}
            />
          )}

          {currentView === "bookmarks" && (
            <BookmarksView
              onSelectArticle={handleSelectArticle}
              onBackToHome={() => pushView("home")}
              isDark={isDark}
            />
          )}

          {currentView === "history" && (
            <HistoryView
              onSearchSubmit={handleSearch}
              onSelectArticle={handleSelectArticle}
              onBackToHome={() => pushView("home")}
              isDark={isDark}
            />
          )}

          {currentView === "contact" && (
            <ContactDeveloperPage
              isDark={isDark}
              onNavigateHome={() => pushView("home")}
            />
          )}
        </main>
      </div>

      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} isDark={isDark} />
      )}

      {showAI && (
        <AiAssistantModal onClose={() => setShowAI(false)} isDark={isDark} />
      )}

      {showDeveloperStudio && isDeveloper && (
        <DeveloperStudioModal onClose={() => setShowDeveloperStudio(false)} isDark={isDark} />
      )}

      {showEditorNewsroom && isEditor && (
        <EditorNewsroomModal
          onClose={() => setShowEditorNewsroom(false)}
          onNavigateToTab={(tab, article) => {
            if (
              tab === "news" ||
              tab === "home" ||
              tab === "sports" ||
              tab === "cricket" ||
              tab === "local-news" ||
              tab === "knowledge"
            ) {
              setCurrentView(tab as any);
              if (article) {
                setSelectedNewsArticle(article);
                setCurrentView("news-article");
              }
            }
          }}
          isDark={isDark}
        />
      )}

      <ExitConfirmModal
        isOpen={isExitModalOpen}
        onStay={closeExitModal}
        onExit={confirmExit}
        isDark={isDark}
      />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        return !window.sessionStorage.getItem("infoatlas_session_splash_shown");
      }
    } catch {}
    return true;
  });

  useEffect(() => {
    const handleReplay = () => setShowSplash(true);
    window.addEventListener("infoatlas_replay_splash", handleReplay);
    return () => window.removeEventListener("infoatlas_replay_splash", handleReplay);
  }, []);

  return (
    <>
      {showSplash && (
        <StartupSplash onComplete={() => setShowSplash(false)} />
      )}
      {!isAuthenticated ? <AuthPage /> : <MainApp />}
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppConfigProvider>
          <LanguageProvider>
            <NavigationProvider>
              <AppContent />
            </NavigationProvider>
          </LanguageProvider>
        </AppConfigProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
