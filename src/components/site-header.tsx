"use client";

import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  onSearchOpen: () => void;
}

export function SiteHeader({ onSearchOpen }: SiteHeaderProps) {
  return (
    <header className="z-50 shrink-0 border-b-2 border-foreground/10 bg-card">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* 报头 — 纯排版，无装饰 */}
        <div>
          <h1 className="font-display text-xl font-bold leading-none tracking-tight text-foreground">
            Daily<span className="text-primary">Insight</span>Hub
          </h1>
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            知识日报聚合
          </p>
        </div>

        {/* 搜索 */}
        <button
          onClick={onSearchOpen}
          className={cn(
            "flex items-center gap-2 rounded border border-border bg-background px-3 py-1.5",
            "text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
          )}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="hidden sm:inline">搜索</span>
          <kbd className="hidden rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
}
