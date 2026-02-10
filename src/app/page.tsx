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
    <div className="flex h-full flex-col">
      <SiteHeader onSearchOpen={() => setSearchOpen(true)} />

      <div className="flex min-h-0 flex-1">
        {/* 左侧日期导航 */}
        <div className="hidden h-full lg:block">
          <div className="h-full overflow-y-auto">
            <DateSidebar currentDate={currentDate} onDateChange={handleDateChange} />
          </div>
        </div>

        {/* 主内容 */}
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 lg:px-12">
          {/* 视图切换 + 移动端日期 */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            {/* 纯文字 Tab 切换 */}
            <nav className="flex gap-0 border-b border-border">
              <button
                onClick={() => setViewMode("report")}
                className={cn(
                  "relative px-4 py-2 text-sm transition-colors",
                  viewMode === "report"
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                AI 日报
                {viewMode === "report" && (
                  <span className="absolute inset-x-0 -bottom-px h-[2px] bg-primary" />
                )}
              </button>
              <button
                onClick={() => setViewMode("articles")}
                className={cn(
                  "relative px-4 py-2 text-sm transition-colors",
                  viewMode === "articles"
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                文章列表
                {viewMode === "articles" && (
                  <span className="absolute inset-x-0 -bottom-px h-[2px] bg-primary" />
                )}
              </button>
            </nav>

            {/* 移动端日期选择 */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setDate(d.getDate() - 1);
                  handleDateChange(new Intl.DateTimeFormat("sv-SE").format(d));
                }}
                className="rounded border border-border px-2 py-1.5 text-muted-foreground hover:bg-secondary"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm tabular-nums text-foreground">{currentDate}</span>
              <button
                onClick={() => {
                  const today = getTodayDate();
                  if (currentDate < today) {
                    const d = new Date(currentDate);
                    d.setDate(d.getDate() + 1);
                    handleDateChange(new Intl.DateTimeFormat("sv-SE").format(d));
                  }
                }}
                disabled={currentDate >= getTodayDate()}
                className="rounded border border-border px-2 py-1.5 text-muted-foreground hover:bg-secondary disabled:opacity-30"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* 日报视图 */}
          {viewMode === "report" && (
            <DailyReportCard report={report} date={currentDate} loading={reportLoading} />
          )}

          {/* 文章列表视图 */}
          {viewMode === "articles" && (
            <>
              <div className="mb-6">
                <CategoryTabs
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                  counts={categoryCounts}
                />
              </div>

              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="border-b border-border py-4">
                      <div className="mb-2 h-3 w-24 animate-pulse rounded bg-secondary" />
                      <div className="mb-1 h-5 w-full animate-pulse rounded bg-secondary" />
                      <div className="mb-3 h-5 w-3/4 animate-pulse rounded bg-secondary" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-full animate-pulse rounded bg-secondary/70" />
                        <div className="h-3.5 w-5/6 animate-pulse rounded bg-secondary/70" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : articles.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                    {articles.map((article, index) => (
                      <ArticleCard key={article.id} article={article} index={index} />
                    ))}
                  </div>

                  {articles.length < articleTotal && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={() => loadArticles(currentDate, activeCategory, articlePage + 1, true)}
                        disabled={loadingMore}
                        className={cn(
                          "text-sm transition-colors",
                          loadingMore
                            ? "cursor-not-allowed text-muted-foreground"
                            : "text-primary underline underline-offset-4 hover:text-foreground"
                        )}
                      >
                        {loadingMore
                          ? "加载中..."
                          : `加载更多 (${articles.length}/${articleTotal})`
                        }
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="animate-fade-in py-20 text-center">
                  <h3 className="mb-1 text-base font-semibold text-foreground">暂无内容</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeCategory
                      ? "该分类下暂无文章，试试其他分类"
                      : "当日暂无抓取数据，请检查定时任务是否运行"}
                  </p>
                </div>
              )}
            </>
          )}
        </main>

        {/* 右侧目录 */}
        {viewMode === "report" && report?.content && (
          <div className="hidden h-full shrink-0 overflow-y-auto border-l border-border xl:block">
            <TocSidebar content={report.content} />
          </div>
        )}
      </div>

      <SiteFooter />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
