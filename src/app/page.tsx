"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Article, DailyReport, CategorySlug } from "@/lib/types";
import { getTodayDate } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CategoryTabs } from "@/components/category-tabs";
import { ArticleCard } from "@/components/article-card";
import { DailyReportCard } from "@/components/daily-report";
import { SearchDialog } from "@/components/search-dialog";
import { DateSidebar } from "@/components/date-sidebar";
import { TocSidebar } from "@/components/toc-sidebar";
import { cn } from "@/lib/utils";

type ViewMode = "report" | "articles";

const PAGE_SIZE = 24;

export default function HomePage() {
  const [currentDate, setCurrentDate] = useState(getTodayDate());
  const [articles, setArticles] = useState<Article[]>([]);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategorySlug | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reportLoading, setReportLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("report");
  const [articlePage, setArticlePage] = useState(1);
  const [articleTotal, setArticleTotal] = useState(0);

  const handleDateChange = useCallback((date: string) => {
    setCurrentDate(date);
    setActiveCategory(null);
  }, []);

  const articlesAbortRef = useRef<AbortController | null>(null);
  const reportAbortRef = useRef<AbortController | null>(null);

  const loadArticles = useCallback(async (date: string, category: CategorySlug | null, page = 1, append = false) => {
    articlesAbortRef.current?.abort();
    const controller = new AbortController();
    articlesAbortRef.current = controller;

    if (append) { setLoadingMore(true); } else { setLoading(true); }
    try {
      const params = new URLSearchParams({ date, limit: String(PAGE_SIZE), page: String(page) });
      if (category) params.set("category", category);

      const res = await fetch(`/api/articles?${params.toString()}`, { signal: controller.signal });
      if (!res.ok) { if (!append) setArticles([]); return; }
      const data = await res.json();
      const newArticles: Article[] = data.articles ?? [];

      if (append) {
        setArticles((prev) => [...prev, ...newArticles]);
      } else {
        setArticles(newArticles);
      }
      setArticleTotal(data.total ?? 0);
      setArticlePage(page);
      if (!category && !append && data.categoryCounts) setCategoryCounts(data.categoryCounts);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (!append) setArticles([]);
    } finally {
      if (append) { setLoadingMore(false); } else { setLoading(false); }
    }
  }, []);

  const loadReport = useCallback(async (date: string) => {
    reportAbortRef.current?.abort();
    const controller = new AbortController();
    reportAbortRef.current = controller;

    setReportLoading(true);
    try {
      const res = await fetch(`/api/report?date=${date}`, { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        setReport(data.report ?? null);
      } else {
        setReport(null);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    setArticlePage(1);
    loadArticles(currentDate, activeCategory, 1, false);
  }, [currentDate, activeCategory, loadArticles]);

  useEffect(() => { loadReport(currentDate); }, [currentDate, loadReport]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <SiteHeader onSearchOpen={() => setSearchOpen(true)} />

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <div className="hidden h-full w-56 shrink-0 border-r border-border lg:block">
           <div className="h-full overflow-y-auto">
             <DateSidebar currentDate={currentDate} onDateChange={handleDateChange} />
           </div>
        </div>

        {/* Main */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
            
            {/* View Toggle */}
            <div className="mb-10 flex items-center gap-6 border-b border-border pb-4">
              <button
                onClick={() => setViewMode("report")}
                className={cn(
                  "cursor-pointer text-lg font-semibold transition-colors hover:text-foreground",
                  viewMode === "report" ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Briefing
              </button>
              <button
                onClick={() => setViewMode("articles")}
                className={cn(
                  "cursor-pointer text-lg font-semibold transition-colors hover:text-foreground",
                  viewMode === "articles" ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Feed
              </button>
              
              {/* Mobile Date Nav */}
              <div className="ml-auto flex items-center gap-2 lg:hidden">
                 <span className="text-sm font-medium">{currentDate}</span>
                 {/* Simple arrows could go here */}
              </div>
            </div>

            {viewMode === "report" && (
              <div className="flex gap-12">
                <div className="flex-1">
                  <DailyReportCard report={report} date={currentDate} loading={reportLoading} />
                </div>
                {report?.content && (
                  <div className="hidden w-64 shrink-0 xl:block">
                    <div className="sticky top-6">
                      <TocSidebar content={report.content} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {viewMode === "articles" && (
              <div className="space-y-8">
                <CategoryTabs
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                  counts={categoryCounts}
                />

                {loading ? (
                  <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-3">
                        <div className="h-4 w-20 animate-pulse bg-secondary" />
                        <div className="h-6 w-full animate-pulse bg-secondary" />
                        <div className="h-4 w-full animate-pulse bg-secondary" />
                      </div>
                    ))}
                  </div>
                ) : articles.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
                      {articles.map((article, index) => (
                        <ArticleCard key={article.id} article={article} index={index} />
                      ))}
                    </div>
                    
                    {articles.length < articleTotal && (
                      <div className="mt-12 text-center">
                        <button
                          onClick={() => loadArticles(currentDate, activeCategory, articlePage + 1, true)}
                          disabled={loadingMore}
                          className="text-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
                        >
                          {loadingMore ? "Loading..." : "Load More Articles"}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-20 text-center text-muted-foreground">
                    No articles found.
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <SiteFooter />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
