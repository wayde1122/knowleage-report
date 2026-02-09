"use client";

import { CATEGORIES } from "@/config/categories";
import { cn } from "@/lib/utils";
import type { CategorySlug } from "@/lib/types";

interface CategoryTabsProps {
  activeCategory: CategorySlug | null;
  onCategoryChange: (category: CategorySlug | null) => void;
  counts?: Record<string, number>;
}

export function CategoryTabs({ activeCategory, onCategoryChange, counts }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {/* 全部 */}
      <button
        onClick={() => onCategoryChange(null)}
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all",
          activeCategory === null
            ? "bg-primary text-white shadow-sm"
            : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
        )}
      >
        <span>全部</span>
        {counts && (
          <span className={cn(
            "text-xs",
            activeCategory === null ? "text-white/70" : "text-muted-foreground"
          )}>
            {Object.values(counts).reduce((a, b) => a + b, 0)}
          </span>
        )}
      </button>

      {CATEGORIES.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onCategoryChange(cat.slug)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all",
            activeCategory === cat.slug
              ? "text-white shadow-sm"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
          )}
          style={activeCategory === cat.slug ? { backgroundColor: cat.color } : undefined}
        >
          <span>{cat.icon}</span>
          <span>{cat.name}</span>
          {counts?.[cat.slug] != null && (
            <span className={cn(
              "text-xs",
              activeCategory === cat.slug ? "text-white/70" : "text-muted-foreground"
            )}>
              {counts[cat.slug]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
