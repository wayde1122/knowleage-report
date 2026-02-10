"use client";

import type { Article } from "@/lib/types";
import { getCategoryBySlug } from "@/config/categories";
import { SourceBadge } from "./source-badge";
import { formatRelativeTime, cn } from "@/lib/utils";

interface ArticleCardProps {
  article: Article;
  index?: number;
}

export function ArticleCard({ article, index = 0 }: ArticleCardProps) {
  const category = getCategoryBySlug(article.category);
  const displayTitle = article.title_zh ?? article.title;

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group block h-full border-t border-border py-6 transition-all",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex flex-col gap-3">
        {/* Meta */}
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <div className="flex items-center gap-3">
            {category && <span className="text-foreground">{category.name}</span>}
            <span>{formatRelativeTime(article.published_at || "")}</span>
          </div>
          
          {/* Arrow Icon */}
          <svg 
            className="h-4 w-4 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
          </svg>
        </div>

        {/* Title */}
        <h3 className="font-display text-xl font-semibold leading-snug text-foreground transition-colors group-hover:underline decoration-1 underline-offset-4">
          {displayTitle}
        </h3>

        {/* Summary */}
        {article.summary && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground/80">
            {article.summary}
          </p>
        )}

        {/* Footer */}
        <div className="mt-1 flex items-center gap-2">
          <SourceBadge sourceName={article.source_name} sourceType={article.source_type} />
          {article.heat_value != null && article.heat_value > 0 && (
            <span className="text-xs text-muted-foreground">
              · Top {article.rank}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
