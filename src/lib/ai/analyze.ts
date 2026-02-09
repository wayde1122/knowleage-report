import { chatCompletion, parseJsonResponse } from "./client";
import type { Article, ReportHighlights } from "@/lib/types";
import { CATEGORIES } from "@/config/categories";
import { titleSimilarity } from "@/lib/utils";

/** 话题聚合相似度阈值（低于去重阈值，用于合并同一事件的不同报道） */
const TOPIC_SIMILARITY_THRESHOLD = 0.5;

/** 标题最小有效长度（少于此长度视为低质量） */
const MIN_TITLE_LENGTH = 5;

interface AnalysisResponse {
  markdown: string;
  highlights: ReportHighlights;
}

/** 话题聚合：将相似文章归为同一话题 */
function clusterArticles(
  articles: Article[]
): { representative: Article; related: Article[] }[] {
  const clusters: { representative: Article; related: Article[] }[] = [];
  const used = new Set<number>();

  for (let i = 0; i < articles.length; i++) {
    if (used.has(i)) continue;
    used.add(i);

    const cluster = { representative: articles[i], related: [] as Article[] };

    for (let j = i + 1; j < articles.length; j++) {
      if (used.has(j)) continue;
      // 与当前代表文章比较（代表可能已替换为更高热度的）
      const sim = titleSimilarity(cluster.representative.title, articles[j].title);
      if (sim >= TOPIC_SIMILARITY_THRESHOLD) {
        used.add(j);
        // 保留热度更高的作为代表
        if ((articles[j].heat_value ?? 0) > (cluster.representative.heat_value ?? 0)) {
          cluster.related.push(cluster.representative);
          cluster.representative = articles[j];
        } else {
          cluster.related.push(articles[j]);
        }
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

/** 过滤低质量文章 */
function filterLowQuality(articles: Article[]): Article[] {
  return articles.filter((a) => {
    // 标题太短的过滤
    if (a.title.length < MIN_TITLE_LENGTH) return false;
    // 热榜来源：保留有热度值的，过滤热度为 0 的
    if (a.source_type === "hotlist" && (a.heat_value ?? 0) <= 0) return false;
    return true;
  });
}

/** 生成每日分析报告 */
export async function generateDailyAnalysis(
  articles: Article[]
): Promise<{ content: string; highlights: ReportHighlights }> {
  // 先过滤低质量文章
  const qualityArticles = filterLowQuality(articles);
  console.log(`[analyze] 质量过滤: ${articles.length} -> ${qualityArticles.length} 条`);

  // 按分类组织内容
  const byCategory = new Map<string, Article[]>();
  for (const article of qualityArticles) {
    const list = byCategory.get(article.category) ?? [];
    list.push(article);
    byCategory.set(article.category, list);
  }

  // 构建摘要内容（话题聚合 + 每分类 top 5）
  const contentParts: string[] = [];
  for (const cat of CATEGORIES) {
    const catArticles = byCategory.get(cat.slug);
    if (!catArticles?.length) continue;

    // 话题聚合：相似文章合并
    const clusters = clusterArticles(catArticles);
    const topClusters = clusters.slice(0, 5);

    contentParts.push(`\n### ${cat.icon} ${cat.name}（${clusters.length} 个话题，原始 ${catArticles.length} 条）`);
    for (const cluster of topClusters) {
      const a = cluster.representative;
      const relatedCount = cluster.related.length;
      const suffix = relatedCount > 0 ? `（另有 ${relatedCount} 篇相关报道）` : "";
      contentParts.push(`- ${a.title}${a.summary ? `：${a.summary}` : ""}${suffix}`);
    }
  }

  const content = contentParts.join("\n");

  try {
    const response = await chatCompletion(
      [
        {
          role: "system",
          content: `你是一个资深科技行业分析师，负责撰写精炼的每日 AI 与科技知识日报。

请返回一个 JSON 对象，包含两个字段：

1. "markdown"：Markdown 格式的精炼日报，**总字数控制在 1500 字以内**。包含以下板块（每个板块用 ## 标题）：
   - **今日摘要**：2-3 句话概括今日核心要点，点到即止
   - **重点资讯**：今日最值得关注的 5-8 条核心内容（合并产品更新、研究突破、开源项目等，只选最有价值的）
   - **趋势洞察**：1-2 段简短分析，点出今日内容背后的行业趋势

   格式要求：
   - 重点资讯用编号列表（1. 2. 3.）
   - 每条包含加粗标题 + 一句话描述（不超过 2 句）
   - 不需要面面俱到，只挑最重要的内容
   - 相似话题的多篇报道合并为一条

2. "highlights"：结构化数据 {"hotTopics": ["话题1", "话题2", ...], "trendInsights": [], "crossDomainLinks": [], "signalsToWatch": []}
   - hotTopics 作为页面顶部的标签显示，控制在 4-6 个简短关键词`,
        },
        {
          role: "user",
          content: `今日共收录 ${qualityArticles.length} 条内容（已去重聚合），请生成精炼的日报分析：\n${content}`,
        },
      ],
      { jsonMode: true, temperature: 0.5, maxTokens: 4096 }
    );

    const result = parseJsonResponse<AnalysisResponse>(response);
    console.log("[analyze] 日报分析生成完成");
    return {
      content: result.markdown,
      highlights: result.highlights,
    };
  } catch (err) {
    console.error("[analyze] 日报分析失败:", err);
    // 返回基础报告
    return {
      content: `# 今日知识日报\n\n共收录 ${articles.length} 条内容。\n\n${content}`,
      highlights: {
        hotTopics: [],
        trendInsights: [],
        crossDomainLinks: [],
        signalsToWatch: [],
      },
    };
  }
}
