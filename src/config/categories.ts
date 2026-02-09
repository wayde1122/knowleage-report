import type { CategoryDef } from "@/lib/types";

export const CATEGORIES: CategoryDef[] = [
  {
    slug: "ai",
    name: "AI 与大模型",
    icon: "🤖",
    color: "var(--color-cat-ai)",
    description: "AI、LLM、Agent、MLOps",
  },
  {
    slug: "programming",
    name: "编程开发",
    icon: "💻",
    color: "var(--color-cat-programming)",
    description: "语言、框架、开源项目",
  },
  {
    slug: "frontend",
    name: "前端与设计",
    icon: "🎨",
    color: "var(--color-cat-frontend)",
    description: "前端技术、UI/UX、设计系统",
  },
  {
    slug: "backend",
    name: "后端与架构",
    icon: "⚙️",
    color: "var(--color-cat-backend)",
    description: "后端、数据库、系统设计",
  },
  {
    slug: "product",
    name: "产品设计",
    icon: "📐",
    color: "var(--color-cat-product)",
    description: "产品思维、用户体验、增长",
  },
  {
    slug: "business",
    name: "商业与创业",
    icon: "📈",
    color: "var(--color-cat-business)",
    description: "商业洞察、创业、投资",
  },
  {
    slug: "growth",
    name: "效率与成长",
    icon: "🚀",
    color: "var(--color-cat-growth)",
    description: "工具、方法论、个人成长",
  },
  {
    slug: "news",
    name: "新闻",
    icon: "📰",
    color: "var(--color-cat-news)",
    description: "行业新闻、公司动态、政策",
  },
];

/** 通过 slug 获取分类 */
export function getCategoryBySlug(slug: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

/** 所有分类 slug 集合 */
export const CATEGORY_SLUGS = new Set(CATEGORIES.map((c) => c.slug));
