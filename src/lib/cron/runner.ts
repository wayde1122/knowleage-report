import { fetchAllHotlists } from "@/lib/sources/hotlist";
import { fetchAllRssFeeds } from "@/lib/sources/rss";
import { fetchFoloFeeds } from "@/lib/sources/folo";
import { deduplicateItems } from "@/lib/dedup";
import { classifyItems } from "@/lib/ai/classify";
import { summarizeItems } from "@/lib/ai/summarize";
import { translateItems } from "@/lib/ai/translate";
import { generateDailyAnalysis } from "@/lib/ai/analyze";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getTodayDate } from "@/lib/utils";
import type { Article, RawItem } from "@/lib/types";

/** 组装文章记录 */
function buildArticle(
  item: RawItem,
  today: string,
  summary?: string,
  translation?: { titleZh: string; summaryZh?: string }
): Omit<Article, "id" | "created_at"> {
  return {
    title: item.title,
    title_zh: translation?.titleZh ?? null,
    url: item.url,
    summary: translation?.summaryZh ?? summary ?? null,
    category: item.defaultCategory ?? "news",
    source_type: item.sourceType,
    source_name: item.sourceName,
    rank: item.rank ?? null,
    heat_value: item.heatValue ?? null,
    published_at: item.publishedAt ?? null,
    fetched_date: today,
    tags: null,
    language: item.language ?? "zh",
  };
}

/** 批量 upsert 文章到数据库 */
async function upsertArticles(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  articles: Omit<Article, "id" | "created_at">[],
  label: string
): Promise<boolean> {
  if (articles.length === 0) return true;
  const { error } = await supabase
    .from("articles")
    .upsert(articles, { onConflict: "url,fetched_date", ignoreDuplicates: false });
  if (error) {
    console.error(`[pipeline] ${label}失败:`, error);
    return false;
  }
  console.log(`[pipeline] ${label}成功: ${articles.length} 篇`);
  return true;
}

/** 定时任务主流程（两段式入库） */
export async function runDailyPipeline(targetDate?: string): Promise<{
  articlesCount: number;
  reportGenerated: boolean;
}> {
  const today = targetDate ?? getTodayDate();
  const supabaseAdmin = getSupabaseAdmin();
  console.log(`\n========== 开始每日任务: ${today} ==========\n`);

  // ─── 阶段一：抓取 → 去重 → 分类 → 先入库（保底数据） ───

  // 1. 并行抓取所有数据源
  console.log("[pipeline] 步骤 1: 抓取数据源...");
  const [hotlistItems, rssItems, foloItems] = await Promise.allSettled([
    fetchAllHotlists(),
    fetchAllRssFeeds(),
    fetchFoloFeeds(),
  ]);

  const allRawItems: RawItem[] = [
    ...(hotlistItems.status === "fulfilled" ? hotlistItems.value : []),
    ...(rssItems.status === "fulfilled" ? rssItems.value : []),
    ...(foloItems.status === "fulfilled" ? foloItems.value : []),
  ];

  console.log(`[pipeline] 总共抓取 ${allRawItems.length} 条原始数据`);

  if (allRawItems.length === 0) {
    console.warn("[pipeline] 未抓取到任何数据，终止任务");
    return { articlesCount: 0, reportGenerated: false };
  }

  // 2. 去重（批内）
  console.log("[pipeline] 步骤 2: 去重...");
  const dedupItems = deduplicateItems(allRawItems);

  // 2.5 跨日期去重：排除数据库中已存在的 URL（避免同一文章出现在多个日期）
  console.log("[pipeline] 步骤 2.5: 跨日期去重...");
  const urls = dedupItems.map((item) => item.url);
  const existingUrls = new Set<string>();
  // 分批查询（PostgREST URL 长度限制）
  for (let i = 0; i < urls.length; i += 50) {
    const batch = urls.slice(i, i + 50);
    const { data: existing } = await supabaseAdmin
      .from("articles")
      .select("url")
      .in("url", batch)
      .neq("fetched_date", today);
    if (existing) {
      for (const row of existing) existingUrls.add(row.url);
    }
  }
  const freshItems = existingUrls.size > 0
    ? dedupItems.filter((item) => !existingUrls.has(item.url))
    : dedupItems;
  console.log(`[pipeline] 跨日期去重: 排除 ${dedupItems.length - freshItems.length} 条已存在文章，保留 ${freshItems.length} 条`);

  // 3. AI 分类
  console.log("[pipeline] 步骤 3: AI 分类...");
  const classifiedItems = await classifyItems(freshItems);

  // 4. 第一次入库：分类完成后立即存储基础数据（确保不丢失）
  console.log("[pipeline] 步骤 4: 首次入库（基础数据）...");
  const baseArticles = classifiedItems.map((item) => buildArticle(item, today));
  await upsertArticles(supabaseAdmin, baseArticles, "首次入库");

  // ─── 阶段二：摘要 → 翻译 → 更新入库（增强数据） ───

  // 5. AI 摘要
  console.log("[pipeline] 步骤 5: AI 摘要...");
  let summaries = new Map<number, string>();
  try {
    summaries = await summarizeItems(classifiedItems);
  } catch (err) {
    console.error("[pipeline] 摘要生成失败，继续后续步骤:", err);
  }

  // 6. AI 翻译
  console.log("[pipeline] 步骤 6: AI 翻译...");
  let translations = new Map<number, { titleZh: string; summaryZh?: string }>();
  try {
    translations = await translateItems(classifiedItems, summaries);
  } catch (err) {
    console.error("[pipeline] 翻译失败，继续后续步骤:", err);
  }

  // 7. 第二次入库：用摘要和翻译更新已有记录
  const hasEnhancements = summaries.size > 0 || translations.size > 0;
  if (hasEnhancements) {
    console.log("[pipeline] 步骤 7: 二次入库（摘要 + 翻译）...");
    const enrichedArticles = classifiedItems.map((item, index) =>
      buildArticle(item, today, summaries.get(index), translations.get(index))
    );
    await upsertArticles(supabaseAdmin, enrichedArticles, "二次入库");
  } else {
    console.log("[pipeline] 步骤 7: 无增强数据，跳过二次入库");
  }

  // ─── 阶段三：生成日报（最后执行，确保用最完整的数据） ───

  console.log("[pipeline] 步骤 8: 生成日报分析...");
  let reportGenerated = false;

  try {
    // 从数据库获取今日文章（此时数据已是最完整的状态）
    const { data: todayArticles } = await supabaseAdmin
      .from("articles")
      .select("*")
      .eq("fetched_date", today)
      .order("heat_value", { ascending: false, nullsFirst: false })
      .limit(500);

    if (todayArticles && todayArticles.length > 0) {
      const analysis = await generateDailyAnalysis(todayArticles, today);

      const stats = {
        totalArticles: todayArticles.length,
        byCategory: todayArticles.reduce<Record<string, number>>((acc, a) => {
          acc[a.category] = (acc[a.category] ?? 0) + 1;
          return acc;
        }, {}),
        bySource: todayArticles.reduce<Record<string, number>>((acc, a) => {
          acc[a.source_name] = (acc[a.source_name] ?? 0) + 1;
          return acc;
        }, {}),
      };

      const { error: reportError } = await supabaseAdmin
        .from("daily_reports")
        .upsert(
          {
            report_date: today,
            content: analysis.content,
            highlights: analysis.highlights,
            stats,
          },
          { onConflict: "report_date" }
        );

      if (reportError) {
        console.error("[pipeline] 日报存储失败:", reportError);
      } else {
        reportGenerated = true;
        console.log("[pipeline] 日报分析存储完成");
      }
    }
  } catch (err) {
    console.error("[pipeline] 日报分析生成失败:", err);
  }

  console.log(`\n========== 每日任务完成: ${today} ==========\n`);
  return { articlesCount: classifiedItems.length, reportGenerated };
}
