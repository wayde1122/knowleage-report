"use client";

import type { Article } from "@/lib/types";
import { getCategoryBySlug } from "@/config/categories";
import { SourceBadge } from "./source-badge";
import { HeatIndicator } from "./heat-indicator";
import { formatRelativeTime, cn } from "@/lib/utils";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const category = getCategoryBySlug(article.category);
  const displayTitle = article.title_zh ?? article.title;

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex flex-col rounded-xl border border-border bg-card p-4",
        "transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        "hover:-translate-y-0.5"
      )}
    >
      {/* 顶部：分类 + 热度 */}
      <div className="mb-3 flex items-center justify-between">
        {category && (
          <span
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `${category.color}15`,
              color: category.color,
            }}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </span>
        )}
        {article.heat_value != null && article.heat_value > 0 && (
          <HeatIndicator value={article.heat_value} rank={article.rank} />
        )}
      </div>

      {/* 标题 */}
      <h3 className="mb-2 line-clamp-2 text-[15px] font-semibold leading-snug text-foreground group-hover:text-primary">
        {displayTitle}
      </h3>

      {/* 英文原标题（如果有翻译） */}
      {article.title_zh && (
        <p className="mb-2 line-clamp-1 text-xs text-muted-foreground">
          {article.title}
        </p>
      )}

      {/* 摘要 */}
      {article.summary && (
        <p className="mb-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {article.summary}
        </p>
      )}

      {/* 底部：来源 + 时间 */}
      <div className="mt-auto flex items-center justify-between pt-3 border-t border-border/50">
        <SourceBadge sourceName={article.source_name} sourceType={article.source_type} />
        {article.published_at && (
          <time className="text-xs text-muted-foreground">
            {formatRelativeTime(article.published_at)}
          </time>
        )}
      </div>
    </a>
  );
}
