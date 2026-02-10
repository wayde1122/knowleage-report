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
    <div className="flex gap-0 overflow-x-auto border-b border-border scrollbar-hide">
      {/* 全部 */}
      <button
        onClick={() => onCategoryChange(null)}
        className={cn(
          "relative shrink-0 px-4 py-2.5 text-sm transition-colors",
          activeCategory === null
            ? "font-semibold text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        全部
        {counts && (
          <span className="ml-1 text-xs text-muted-foreground">
            {Object.values(counts).reduce((a, b) => a + b, 0)}
          </span>
        )}
        {activeCategory === null && (
          <span className="absolute inset-x-0 -bottom-px h-[2px] bg-primary" />
        )}
      </button>

      {CATEGORIES.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onCategoryChange(cat.slug)}
          className={cn(
            "relative shrink-0 px-4 py-2.5 text-sm transition-colors",
            activeCategory === cat.slug
              ? "font-semibold text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {cat.name}
          {counts?.[cat.slug] != null && (
            <span className="ml-1 text-xs text-muted-foreground">
              {counts[cat.slug]}
            </span>
          )}
          {activeCategory === cat.slug && (
            <span className="absolute inset-x-0 -bottom-px h-[2px] bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
}
