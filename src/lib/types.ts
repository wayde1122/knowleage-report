/** 数据源类型 */
export type SourceType = "hotlist" | "rss" | "folo";

/** 分类 slug */
export type CategorySlug =
  | "ai"
  | "programming"
  | "frontend"
  | "backend"
  | "product"
  | "business"
  | "growth"
  | "news";

/** 原始抓取条目 */
export interface RawItem {
  title: string;
  url: string;
  sourceType: SourceType;
  sourceName: string;
  rank?: number;
  heatValue?: number;
  publishedAt?: string;
  author?: string;
  content?: string;
  language?: string;
  defaultCategory?: CategorySlug;
}

/** 文章（数据库记录） */
export interface Article {
  id: string;
  title: string;
  title_zh: string | null;
  url: string;
  summary: string | null;
  category: CategorySlug;
  source_type: SourceType;
  source_name: string;
  rank: number | null;
  heat_value: number | null;
  published_at: string | null;
  fetched_date: string;
  tags: string[] | null;
  language: string;
  created_at: string;
}

/** 日报分析 */
export interface DailyReport {
  id: string;
  report_date: string;
  content: string;
  highlights: ReportHighlights | null;
  stats: ReportStats | null;
  created_at: string;
}

/** 日报亮点结构 */
export interface ReportHighlights {
  hotTopics: string[];
  trendInsights: string[];
  crossDomainLinks: string[];
  signalsToWatch: string[];
}

/** 日报统计 */
export interface ReportStats {
  totalArticles: number;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
}

/** 分类定义 */
export interface CategoryDef {
  slug: CategorySlug;
  name: string;
  icon: string;
  color: string;
  description: string;
}

/** 平台配置 */
export interface PlatformConfig {
  id: string;
  name: string;
  enabled: boolean;
  defaultCategory?: CategorySlug;
  language?: string;
}

/** RSS 源配置 */
export interface RssFeedConfig {
  url: string;
  name: string;
  defaultCategory: CategorySlug;
  language?: string;
}
