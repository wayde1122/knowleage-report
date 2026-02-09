import type { RawItem } from "@/lib/types";
import { normalizeUrl, titleSimilarity } from "@/lib/utils";

/** 标题相似度阈值 */
const SIMILARITY_THRESHOLD = 0.85;

/**
 * 去重引擎
 * 基于 URL 标准化 + 标题相似度双重去重
 */
export function deduplicateItems(items: RawItem[]): RawItem[] {
  const urlSet = new Set<string>();
  const result: RawItem[] = [];

  for (const item of items) {
    // 跳过无效条目
    if (!item.title || !item.url) continue;

    // 1. URL 去重
    const normalizedUrl = normalizeUrl(item.url);
    if (urlSet.has(normalizedUrl)) continue;

    // 2. 标题相似度去重
    let isDuplicate = false;
    for (let k = 0; k < result.length; k++) {
      const similarity = titleSimilarity(item.title, result[k].title);
      if (similarity >= SIMILARITY_THRESHOLD) {
        // 保留热度更高的
        if ((item.heatValue ?? 0) > (result[k].heatValue ?? 0)) {
          result[k] = item;
          urlSet.add(normalizedUrl);
        }
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      urlSet.add(normalizedUrl);
      result.push(item);
    }
  }

  console.log(`[dedup] 去重: ${items.length} -> ${result.length} 条`);
  return result;
}
