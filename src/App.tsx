import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthPage } from "./components/AuthPage";
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
import { AiKnowledgeArticleReader } from "./components/AiKnowledgeArticleReader";
import { searchKnowledge, fetchNewsArticles } from "./services/api";
import { SearchResult, NewsArticle, AiKnowledgeArticle, UnifiedSearchResponse, TopicImage } from "./types";

const MainApp: React.FC = () => {
  const { isAuthenticated, addHistory } = useAuth();
  const [currentView, setCurrentView] = useState<"home" | "news" | "news-article" | "sports" | "cricket" | "knowledge" | "search" | "article" | "ai-article" | "bookmarks" | "history">("home");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
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

  const [breakingArticles, setBreakingArticles] = useState<NewsArticle[]>([]);
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState<boolean>(false);

  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showAI, setShowAI] = useState<boolean>(false);

  // Default to light mode
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("infoatlas_theme");
    return saved ? saved === "dark" : false;
  });

  useEffect(() => {
    localStorage.setItem("infoatlas_theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    async function fetchBreaking() {
      const data = await fetchNewsArticles("breaking");
      setBreakingArticles(data);
    }
    fetchBreaking();
  }, []);

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setCurrentView("search");
    setIsSearchLoading(true);
    addHistory(query);

    const searchResponse = await searchKnowledge(query);
    setSearchResults(searchResponse.results || []);
    setSearchAiArticle(searchResponse.aiArticle);
    setSearchTopicImage(searchResponse.topicImage);
    setSearchSourceUsed(searchResponse.sourceUsed);
    setSearchIsAiFallback(searchResponse.isAiFallback);
    setSearchStatusMessage(searchResponse.statusMessage);
    setIsSearchLoading(false);
  };

  const handleSelectArticle = (title: string) => {
    setSelectedArticleTitle(title);
    setCurrentView("article");
  };

  const handleSelectAiArticle = (article: AiKnowledgeArticle) => {
    setSelectedAiArticle(article);
    setCurrentView("ai-article");
  };

  const [returnNewsView, setReturnNewsView] = useState<"home" | "news" | "sports" | "cricket">("news");

  const handleSelectNewsArticle = (article: NewsArticle) => {
    if (currentView === "sports" || currentView === "cricket" || currentView === "news" || currentView === "home") {
      setReturnNewsView(currentView);
    }
    setSelectedNewsArticle(article);
    setCurrentView("news-article");
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedNewsCategory(cat);
    setCurrentView("news");
  };

  return (
    <div className={`min-h-screen transition-colors ${isDark ? "bg-slate-950 text-slate-100" : "bg-[#F5F8FF] text-[#102B59]"}`}>
      <TopNavbar
        onSearchSubmit={handleSearch}
        onOpenProfile={() => setShowProfile(true)}
        onOpenAI={() => setShowAI(true)}
        isDark={isDark}
        toggleTheme={() => setIsDark(!isDark)}
        onToggleMobileSidebar={() => setIsOpenMobileSidebar(!isOpenMobileSidebar)}
        onNavigateHome={() => setCurrentView("home")}
      />

      <div className="flex">
        <Sidebar
          currentView={currentView}
          onNavigate={(v) => {
            setCurrentView(v);
          }}
          onCategorySelect={handleCategorySelect}
          isDark={isDark}
          isOpenMobile={isOpenMobileSidebar}
          onCloseMobile={() => setIsOpenMobileSidebar(false)}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {currentView === "home" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-6 min-w-0">
                <LatestNewsFeed
                  selectedCategory={selectedNewsCategory}
                  onCategoryChange={setSelectedNewsCategory}
                  onSelectArticle={handleSelectNewsArticle}
                  isDark={isDark}
                />
              </div>
              <div className="lg:col-span-4">
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 min-w-0">
                <LatestNewsFeed
                  selectedCategory={selectedNewsCategory}
                  onCategoryChange={setSelectedNewsCategory}
                  onSelectArticle={handleSelectNewsArticle}
                  isDark={isDark}
                />
              </div>
              <div className="lg:col-span-4">
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 min-w-0">
                <NewsArticleReader
                  article={selectedNewsArticle}
                  onBack={() => setCurrentView(returnNewsView as any)}
                  isDark={isDark}
                />
              </div>
              <div className="lg:col-span-4">
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 min-w-0">
                <SportsPage isDark={isDark} onSelectArticle={handleSelectNewsArticle} />
              </div>
              <div className="lg:col-span-4">
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 min-w-0">
                <CricketPage isDark={isDark} onSelectArticle={handleSelectNewsArticle} />
              </div>
              <div className="lg:col-span-4">
                <RightPanel
                  breakingArticles={breakingArticles}
                  onCategorySelect={handleCategorySelect}
                  onTopicSearch={handleSearch}
                  isDark={isDark}
                />
              </div>
            </div>
          )}

          {currentView === "knowledge" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 min-w-0">
                <KnowledgePage onSearchSubmit={handleSearch} isDark={isDark} />
              </div>
              <div className="lg:col-span-4">
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
              aiArticle={searchAiArticle}
              topicImage={searchTopicImage}
              sourceUsed={searchSourceUsed}
              isAiFallback={searchIsAiFallback}
              statusMessage={searchStatusMessage}
              isLoading={isSearchLoading}
              onSelectArticle={handleSelectArticle}
              onSelectAiArticle={handleSelectAiArticle}
              onBackToHome={() => setCurrentView("home")}
              onExploreTopic={handleSearch}
              isDark={isDark}
            />
          )}

          {currentView === "article" && (
            <ArticleReader
              title={selectedArticleTitle}
              onBack={() => setCurrentView("search")}
              isDark={isDark}
            />
          )}

          {currentView === "ai-article" && selectedAiArticle && (
            <AiKnowledgeArticleReader
              article={selectedAiArticle}
              onBack={() => setCurrentView("search")}
              onExploreTopic={handleSearch}
              isDark={isDark}
            />
          )}

          {currentView === "bookmarks" && (
            <BookmarksView
              onSelectArticle={handleSelectArticle}
              onBackToHome={() => setCurrentView("home")}
              isDark={isDark}
            />
          )}

          {currentView === "history" && (
            <HistoryView
              onSearchSubmit={handleSearch}
              onSelectArticle={handleSelectArticle}
              onBackToHome={() => setCurrentView("home")}
              isDark={isDark}
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
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
