"use client";

import type { Article } from "@/lib/types";
import { getCategoryBySlug } from "@/config/categories";
import { SourceBadge } from "./source-badge";
import { HeatIndicator } from "./heat-indicator";
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
        "group flex flex-col border-b border-border py-4 sm:rounded sm:border sm:border-border sm:bg-card sm:p-4",
        "transition-colors duration-150 hover:bg-secondary/40",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* 顶部元信息行 */}
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        {category && (
          <span className="font-medium uppercase tracking-wide" style={{ color: category.color }}>
            {category.name}
          </span>
        )}
        {category && article.heat_value != null && article.heat_value > 0 && (
          <span className="text-border">·</span>
        )}
        {article.heat_value != null && article.heat_value > 0 && (
          <HeatIndicator value={article.heat_value} rank={article.rank} />
        )}
      </div>

      {/* 标题 */}
      <h3 className="mb-1 line-clamp-2 text-[15px] font-bold leading-snug text-foreground group-hover:text-primary">
        {displayTitle}
      </h3>

      {/* 英文原标题 */}
      {article.title_zh && (
        <p className="mb-1 line-clamp-1 text-xs italic text-muted-foreground/70">
          {article.title}
        </p>
      )}

      {/* 摘要 */}
      {article.summary && (
        <p className="mb-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {article.summary}
        </p>
      )}

      {/* 底部 */}
      <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-muted-foreground">
        <SourceBadge sourceName={article.source_name} sourceType={article.source_type} />
        {article.published_at && (
          <time>{formatRelativeTime(article.published_at)}</time>
        )}
      </div>
    </a>
  );
}
