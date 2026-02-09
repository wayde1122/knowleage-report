import type { RawItem } from "@/lib/types";
import { getEnabledPlatforms } from "@/config/platforms";

/**
 * NewsNow API（与 TrendRadar 使用相同数据源）
 * 项目：https://github.com/nicepkg/newsnow
 * 端点：/api/s?id={platform_id}&latest
 */
const NEWSNOW_API_BASE = process.env.HOTLIST_API_BASE ?? "https://newsnow.busiyi.world";

/** 每个平台最多取多少条热榜（取 Top N，减少低相关内容） */
const MAX_ITEMS_PER_PLATFORM = 15;

interface NewsNowResponse {
  status: "success" | "cache";
  id: string;
  updatedTime: number;
  items: NewsNowItem[];
}

interface NewsNowItem {
  id?: string;
  title: string;
  url: string;
  mobileUrl?: string;
  extra?: {
    /** 热度信息，如 "1029 万热度"、"✰ 3,058" */
    info?: string;
    /** 条目描述/简介（GitHub 仓库 about、Product Hunt 简介等） */
    hover?: string;
    icon?: string;
    diff?: number;
  };
}

/** 从 info 字符串中提取热度数值，如 "1029 万热度" -> 10290000 */
function parseHeatValue(info?: string): number | undefined {
  if (!info) return undefined;
  const match = info.match(/([\d.]+)\s*万/);
  if (match) return Math.round(parseFloat(match[1]) * 10000);
  const numMatch = info.match(/([\d,]+)/);
  if (numMatch) return parseInt(numMatch[1].replace(/,/g, ""), 10);
  return undefined;
}

/** 抓取单个平台的热榜 */
async function fetchPlatform(platformId: string): Promise<NewsNowItem[]> {
  try {
    const res = await fetch(
      `${NEWSNOW_API_BASE}/api/s?id=${encodeURIComponent(platformId)}&latest`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) {
      console.warn(`[hotlist] 平台 ${platformId} 请求失败: ${res.status}`);
      return [];
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) {
      console.warn(`[hotlist] 平台 ${platformId} 返回非 JSON: ${contentType}`);
      return [];
    }

    const json: NewsNowResponse = await res.json();

    if (!Array.isArray(json.items)) {
      console.warn(`[hotlist] 平台 ${platformId} 数据异常: items 不是数组`);
      return [];
    }

    return json.items;
  } catch (err) {
    console.error(`[hotlist] 平台 ${platformId} 抓取异常:`, err);
    return [];
  }
}

/** 抓取所有启用平台的热榜数据 */
export async function fetchAllHotlists(): Promise<RawItem[]> {
  const platforms = getEnabledPlatforms();
  const results = await Promise.allSettled(
    platforms.map(async (platform) => {
      const items = await fetchPlatform(platform.id);
      return items.slice(0, MAX_ITEMS_PER_PLATFORM).map((item, index): RawItem => ({
        title: item.title,
        url: item.url ?? item.mobileUrl ?? "",
        sourceType: "hotlist",
        sourceName: platform.name,
        rank: index + 1,
        heatValue: parseHeatValue(item.extra?.info),
        content: item.extra?.hover ?? undefined,
        language: platform.language ?? "zh",
        defaultCategory: platform.defaultCategory,
      }));
    })
  );

  const allItems: RawItem[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    }
  }

  console.log(`[hotlist] 共抓取 ${allItems.length} 条热榜数据`);
  return allItems;
}
