import { chatCompletion, parseJsonResponse } from "./client";
import { CATEGORY_SLUGS } from "@/config/categories";
import { chunk } from "@/lib/utils";
import type { RawItem, CategorySlug } from "@/lib/types";

interface ClassifyResult {
  index: number;
  category: string;
}

/** 对文章进行 AI 分类 */
export async function classifyItems(items: RawItem[]): Promise<RawItem[]> {
  // 过滤出需要分类的文章（没有预设分类的）
  const needClassify: { item: RawItem; originalIndex: number }[] = [];
  const classified = [...items];

  for (const [i, item] of items.entries()) {
    if (item.defaultCategory && CATEGORY_SLUGS.has(item.defaultCategory)) {
      // 已有有效分类，直接使用
      continue;
    }
    needClassify.push({ item, originalIndex: i });
  }

  if (needClassify.length === 0) {
    console.log("[classify] 所有文章已有预设分类，跳过 AI 分类");
    return classified;
  }

  console.log(`[classify] 需要 AI 分类 ${needClassify.length} 篇文章`);

  // 分批处理
  const batches = chunk(needClassify, 20);

  for (const batch of batches) {
    try {
      const articleList = batch
        .map((b, i) => `${i}. ${b.item.title}`)
        .join("\n");

      const response = await chatCompletion(
        [
          {
            role: "system",
            content: `你是一个内容分类器。可用分类：ai, programming, frontend, backend, product, business, growth, news。返回 JSON 数组：[{"index": 0, "category": "slug"}, ...]`,
          },
          {
            role: "user",
            content: `请对以下文章分类：\n${articleList}`,
          },
        ],
        { jsonMode: true, temperature: 0.1 }
      );

      const results = parseJsonResponse<ClassifyResult[]>(response);

      for (const r of results) {
        const target = batch[r.index];
        if (target && CATEGORY_SLUGS.has(r.category as CategorySlug)) {
          classified[target.originalIndex] = {
            ...classified[target.originalIndex],
            defaultCategory: r.category as CategorySlug,
          };
        }
      }
    } catch (err) {
      console.error("[classify] 批量分类失败:", err);
      // 分类失败的默认归入 news
      for (const b of batch) {
        if (!classified[b.originalIndex].defaultCategory) {
          classified[b.originalIndex] = {
            ...classified[b.originalIndex],
            defaultCategory: "news",
          };
        }
      }
    }
  }

  return classified;
}
