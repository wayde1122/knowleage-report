import { chatCompletion } from "./client";
import { chunk } from "@/lib/utils";
import type { RawItem } from "@/lib/types";

/** 批量生成文章摘要（仅对无内容的热榜条目生成） */
export async function summarizeItems(
  items: RawItem[]
): Promise<Map<number, string>> {
  const summaryMap = new Map<number, string>();

  // 对已有内容的条目，直接截取前 100 字作为摘要
  for (const [index, item] of items.entries()) {
    if (item.content && item.content.length > 10) {
      summaryMap.set(index, item.content.slice(0, 150));
    }
  }

  // 筛选出需要 AI 生成摘要的条目（无内容的热榜 top 条目）
  const needSummary = items
    .map((item, index) => ({ item, index }))
    .filter((b) => !summaryMap.has(b.index) && b.item.title.length > 5)
    .slice(0, 100); // 最多 100 条，控制 API 调用量

  if (needSummary.length === 0) {
    console.log(`[summarize] 全部使用内容摘要，共 ${summaryMap.size} 条`);
    return summaryMap;
  }

  console.log(`[summarize] 需要 AI 摘要 ${needSummary.length} 条`);
  const batches = chunk(needSummary, 15);

  for (const batch of batches) {
    try {
      const articleList = batch
        .map((b, i) => `${i}. ${b.item.title}`)
        .join("\n");

      const response = await chatCompletion(
        [
          {
            role: "system",
            content: `你是一个内容摘要助手。为每篇文章生成一句简短中文摘要（不超过 50 字）。
格式要求：每行一条，格式为 "序号|摘要内容"，如：
0|这是第一篇的摘要
1|这是第二篇的摘要
不要输出其他内容。`,
          },
          {
            role: "user",
            content: articleList,
          },
        ],
        { temperature: 0.3, maxTokens: 2048 }
      );

      // 逐行解析，比 JSON 更稳健
      const lines = response.split("\n");
      for (const line of lines) {
        const match = line.match(/^(\d+)\s*[|｜]\s*(.+)/);
        if (match) {
          const idx = parseInt(match[1], 10);
          const summary = match[2].trim();
          const original = batch[idx];
          if (original && summary.length > 2) {
            summaryMap.set(original.index, summary);
          }
        }
      }
    } catch (err) {
      console.error("[summarize] 批量摘要失败:", err);
      // 失败的批次跳过，不影响后续
    }
  }

  // 兜底：AI 失败或标题过短的条目，用模板生成基础摘要
  for (const [index, item] of items.entries()) {
    if (summaryMap.has(index)) continue;
    const fallback = generateFallbackSummary(item);
    if (fallback) summaryMap.set(index, fallback);
  }

  console.log(`[summarize] 生成 ${summaryMap.size}/${items.length} 条摘要`);
  return summaryMap;
}

/** 兜底摘要：根据来源类型生成基础描述 */
function generateFallbackSummary(item: RawItem): string | null {
  const title = item.title.trim();
  if (!title) return null;

  if (item.sourceName === "GitHub") {
    return `GitHub 热门开源项目: ${title.replace(/\s+/g, "")}`;
  }
  if (item.sourceName === "Product Hunt") {
    return `Product Hunt 热门产品: ${title}`;
  }
  if (item.sourceName === "Hacker News") {
    return `Hacker News 热门讨论: ${title}`;
  }
  // 其他过短标题不强制生成
  return null;
}
