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
    <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-border pb-4">
      <button
        onClick={() => onCategoryChange(null)}
        className={cn(
          "cursor-pointer text-sm font-medium transition-colors hover:text-foreground",
          activeCategory === null ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <span className={cn(activeCategory === null && "underline decoration-2 underline-offset-4")}>
          All
        </span>
        {counts && <sup className="ml-1 text-[10px] text-muted-foreground">{Object.values(counts).reduce((a, b) => a + b, 0)}</sup>}
      </button>

      {CATEGORIES.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onCategoryChange(cat.slug)}
          className={cn(
            "cursor-pointer text-sm font-medium transition-colors hover:text-foreground",
            activeCategory === cat.slug ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <span className={cn(activeCategory === cat.slug && "underline decoration-2 underline-offset-4")}>
            {cat.name}
          </span>
          {counts?.[cat.slug] != null && (
            <sup className="ml-1 text-[10px] text-muted-foreground">{counts[cat.slug]}</sup>
          )}
        </button>
      ))}
    </div>
  );
}
