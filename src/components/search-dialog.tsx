"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Article } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getCategoryBySlug } from "@/config/categories";

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // 打开时聚焦
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Escape 关闭对话框（Cmd+K 由 page.tsx 统一管理，避免重复注册）
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // 防抖搜索
  const doSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/articles?search=${encodeURIComponent(searchQuery)}&limit=20`);
      if (!res.ok) {
        console.error(`[search] 搜索请求失败: ${res.status}`);
        setResults([]);
        return;
      }
      const data = await res.json();
      setResults(data.articles ?? []);
    } catch (err) {
      console.error("[search] 搜索异常:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(query), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, doSearch]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 对话框 */}
      <div className="relative z-10 w-full max-w-xl rounded-xl border border-border bg-white shadow-2xl">
        {/* 搜索框 */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <svg className="h-5 w-5 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索文章标题、摘要..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* 结果列表 */}
        <div className="max-h-80 overflow-y-auto p-2">
          {loading && (
            <div className="py-8 text-center text-sm text-muted-foreground">搜索中...</div>
          )}
          {!loading && query && results.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              未找到相关文章
            </div>
          )}
          {!loading && results.map((article) => {
            const category = getCategoryBySlug(article.category);
            return (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex flex-col gap-1 rounded-lg px-3 py-2.5",
                  "transition-colors hover:bg-secondary"
                )}
                onClick={onClose}
              >
                <div className="flex items-center gap-2">
                  {category && (
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: `${category.color}15`,
                        color: category.color,
                      }}
                    >
                      {category.name}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{article.source_name}</span>
                </div>
                <span className="line-clamp-1 text-sm font-medium text-foreground">
                  {article.title_zh ?? article.title}
                </span>
                {article.summary && (
                  <span className="line-clamp-1 text-xs text-muted-foreground">
                    {article.summary}
                  </span>
                )}
              </a>
            );
          })}
          {!loading && !query && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              输入关键词搜索文章
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
