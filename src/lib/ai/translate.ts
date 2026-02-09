import { chatCompletion } from "./client";
import { chunk } from "@/lib/utils";
import type { RawItem } from "@/lib/types";

/** 批量翻译非中文内容（标题 + 摘要） */
export async function translateItems(
  items: RawItem[],
  summaries: Map<number, string>
): Promise<Map<number, { titleZh: string; summaryZh?: string }>> {
  const translateMap = new Map<number, { titleZh: string; summaryZh?: string }>();

  // 过滤出非中文内容
  const nonChinese = items
    .map((item, index) => ({ item, index }))
    .filter((b) => b.item.language === "en");

  if (nonChinese.length === 0) {
    console.log("[translate] 无需翻译的内容");
    return translateMap;
  }

  console.log(`[translate] 需要翻译 ${nonChinese.length} 条内容（标题+摘要）`);
  const batches = chunk(nonChinese, 10);

  for (const batch of batches) {
    try {
      // 构建输入：序号|标题|摘要（摘要可能为空）
      const articleList = batch
        .map((b, i) => {
          const summary = summaries.get(b.index) ?? "";
          return `${i}|${b.item.title}|${summary}`;
        })
        .join("\n");

      const response = await chatCompletion(
        [
          {
            role: "system",
            content: `你是一个专业翻译。将英文内容翻译成简体中文，专有名词可保留英文（如 React、Docker、GitHub）。

输入格式：每行 "序号|英文标题|英文摘要"
输出格式：每行 "序号|中文标题|中文摘要"

规则：
- 摘要如果为空，输出也留空：如 "0|中文标题|"
- 摘要翻译要简洁，不超过 80 字
- 不要输出其他内容`,
          },
          {
            role: "user",
            content: articleList,
          },
        ],
        { temperature: 0.2, maxTokens: 4096 }
      );

      const lines = response.split("\n");
      for (const line of lines) {
        const match = line.match(/^(\d+)\s*[|｜]\s*([^|｜]+)\s*[|｜]?\s*(.*)/);
        if (match) {
          const idx = parseInt(match[1], 10);
          const titleZh = match[2].trim();
          const summaryZh = match[3]?.trim() || undefined;
          const original = batch[idx];
          if (original && titleZh.length > 1) {
            translateMap.set(original.index, {
              titleZh,
              summaryZh: summaryZh && summaryZh.length > 2 ? summaryZh : undefined,
            });
          }
        }
      }
    } catch (err) {
      console.error("[translate] 批量翻译失败:", err);
    }
  }

  console.log(`[translate] 翻译完成 ${translateMap.size} 条`);
  return translateMap;
}
