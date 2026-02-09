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

/** 每页文章数量 */
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

  // 切换日期时同时重置分类为"全部"
  const handleDateChange = useCallback((date: string) => {
    setCurrentDate(date);
    setActiveCategory(null);
  }, []);

  // AbortController 用于取消过期的 fetch 请求，避免竞态
  const articlesAbortRef = useRef<AbortController | null>(null);
  const reportAbortRef = useRef<AbortController | null>(null);

  // 加载文章（首页或追加）
  const loadArticles = useCallback(async (date: string, category: CategorySlug | null, page = 1, append = false) => {
    // 取消上一次还在进行中的请求
    articlesAbortRef.current?.abort();
    const controller = new AbortController();
    articlesAbortRef.current = controller;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams({ date, limit: String(PAGE_SIZE), page: String(page) });
      if (category) params.set("category", category);

      const res = await fetch(`/api/articles?${params.toString()}`, { signal: controller.signal });
      if (!res.ok) {
        console.error(`[loadArticles] 请求失败: ${res.status} ${res.statusText}`);
        if (!append) setArticles([]);
        return;
      }
      const data = await res.json();
      const newArticles: Article[] = data.articles ?? [];

      if (append) {
        setArticles((prev) => [...prev, ...newArticles]);
      } else {
        setArticles(newArticles);
      }
      setArticleTotal(data.total ?? 0);
      setArticlePage(page);
      // 用文章 API 返回的实际分类计数（仅首页加载时更新，避免分类筛选时覆盖）
      if (!category && !append && data.categoryCounts) {
        setCategoryCounts(data.categoryCounts);
      }
    } catch (err) {
      // 被 abort 的请求不处理
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("[loadArticles] 加载文章失败:", err);
      if (!append) setArticles([]);
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  // 加载日报
  const loadReport = useCallback(async (date: string) => {
    // 取消上一次还在进行中的请求
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
        console.error(`[loadReport] 请求失败: ${res.status} ${res.statusText}`);
        setReport(null);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("[loadReport] 加载日报失败:", err);
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  }, []);

  // 分类变化时重新加载文章（重置到第一页）
  useEffect(() => {
    setArticlePage(1);
    loadArticles(currentDate, activeCategory, 1, false);
  }, [currentDate, activeCategory, loadArticles]);

  // 日期变化时重新加载日报（与分类无关，独立触发）
  useEffect(() => {
    loadReport(currentDate);
  }, [currentDate, loadReport]);

  // Cmd+K 快捷键
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
    <div className="flex h-full flex-col bg-background">
      {/* 固定顶部 Header */}
      <SiteHeader onSearchOpen={() => setSearchOpen(true)} />

      {/* 中间三栏区域 - 占满剩余高度 */}
      <div className="flex min-h-0 flex-1">
        {/* 左侧日期导航 - 独立滚动 */}
        <div className="hidden h-full lg:block">
          <div className="h-full overflow-y-auto">
            <DateSidebar currentDate={currentDate} onDateChange={handleDateChange} />
          </div>
        </div>

        {/* 中间主内容 - 独立滚动 */}
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 lg:px-12">
          {/* 视图切换 + 移动端日期切换 */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            {/* 视图切换标签 */}
            <div className="flex rounded-lg border border-border bg-white p-1">
              <button
                onClick={() => setViewMode("report")}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                  viewMode === "report"
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                📋 AI 日报
              </button>
              <button
                onClick={() => setViewMode("articles")}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                  viewMode === "articles"
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                📰 文章列表
              </button>
            </div>

            {/* 移动端日期选择 */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setDate(d.getDate() - 1);
                  handleDateChange(new Intl.DateTimeFormat("sv-SE").format(d));
                }}
                className="rounded-lg border border-border bg-white px-2 py-1.5 text-muted-foreground hover:bg-secondary"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-medium text-foreground">{currentDate}</span>
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
                className="rounded-lg border border-border bg-white px-2 py-1.5 text-muted-foreground hover:bg-secondary disabled:opacity-30"
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
              {/* 分类标签栏 */}
              <div className="mb-6">
                <CategoryTabs
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                  counts={categoryCounts}
                />
              </div>

              {/* 文章网格 */}
              {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex animate-pulse flex-col rounded-xl border border-border bg-card p-4"
                    >
                      {/* 顶部：分类 + 热度 */}
                      <div className="mb-3 flex items-center justify-between">
                        <div className="h-5 w-16 rounded-md bg-secondary/60" />
                        <div className="h-5 w-10 rounded-md bg-secondary/60" />
                      </div>
                      {/* 标题 */}
                      <div className="mb-2 space-y-1.5">
                        <div className="h-4 w-full rounded bg-secondary/60" />
                        <div className="h-4 w-3/4 rounded bg-secondary/60" />
                      </div>
                      {/* 摘要 */}
                      <div className="mb-3 flex-1 space-y-1.5">
                        <div className="h-3.5 w-full rounded bg-secondary/50" />
                        <div className="h-3.5 w-full rounded bg-secondary/50" />
                        <div className="h-3.5 w-2/3 rounded bg-secondary/50" />
                      </div>
                      {/* 底部：来源 + 时间 */}
                      <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
                        <div className="h-4 w-20 rounded bg-secondary/60" />
                        <div className="h-3 w-14 rounded bg-secondary/60" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : articles.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {articles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>

                  {/* 加载更多 */}
                  {articles.length < articleTotal && (
                    <div className="mt-8 flex flex-col items-center gap-2">
                      <button
                        onClick={() => loadArticles(currentDate, activeCategory, articlePage + 1, true)}
                        disabled={loadingMore}
                        className={cn(
                          "rounded-lg border border-border bg-white px-6 py-2.5 text-sm font-medium transition-colors",
                          loadingMore
                            ? "cursor-not-allowed text-muted-foreground"
                            : "text-foreground hover:bg-secondary hover:border-primary/30"
                        )}
                      >
                        {loadingMore ? (
                          <span className="inline-flex items-center gap-2">
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            加载中...
                          </span>
                        ) : (
                          `加载更多（已显示 ${articles.length} / ${articleTotal}）`
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-4 text-5xl">📭</div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">暂无内容</h3>
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

        {/* 右侧目录大纲 - 铺满高度，独立滚动 */}
        {viewMode === "report" && report?.content && (
          <div className="hidden h-full shrink-0 overflow-y-auto border-l border-border xl:block">
            <TocSidebar content={report.content} />
          </div>
        )}
      </div>

      {/* 固定底部 Footer */}
      <SiteFooter />

      {/* 搜索对话框 */}
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
