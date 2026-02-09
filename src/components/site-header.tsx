"use client";

import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  onSearchOpen: () => void;
}

export function SiteHeader({ onSearchOpen }: SiteHeaderProps) {
  return (
    <header className="z-50 shrink-0 border-b border-border bg-white/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg text-white font-bold">
            D
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-foreground">
              DailyInsightHub
            </h1>
            <p className="text-[11px] leading-none text-muted-foreground">
              知识日报聚合
            </p>
          </div>
        </div>

        {/* 搜索按钮 */}
        <button
          onClick={onSearchOpen}
          className={cn(
            "flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-1.5",
            "text-sm text-muted-foreground transition-colors hover:bg-secondary"
          )}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="hidden sm:inline">搜索文章...</span>
          <kbd className="hidden rounded border border-border bg-white px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
}
