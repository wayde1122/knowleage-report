"use client";

import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  onSearchOpen: () => void;
}

export function SiteHeader({ onSearchOpen }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6 lg:px-12">
        {/* Brand */}
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Daily Insight.
          </h1>
          <span className="hidden text-xs font-medium uppercase tracking-widest text-muted-foreground sm:inline-block">
            Knowledge Report
          </span>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-4">
          <button
            onClick={onSearchOpen}
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
            <svg className="h-5 w-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
