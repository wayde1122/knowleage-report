import type { PlatformConfig } from "@/lib/types";

/**
 * 热榜平台配置
 * id 与 NewsNow API 一致: /api/s?id={id}&latest
 * 2025-02-09 已测试全部平台可用性
 */
export const PLATFORMS: PlatformConfig[] = [
  // ── 已启用（2025-02-09 验证可用） ──
  { id: "zhihu", name: "知乎", enabled: true, defaultCategory: "news", language: "zh" },
  { id: "weibo", name: "微博", enabled: true, defaultCategory: "news", language: "zh" },
  { id: "ithome", name: "IT之家", enabled: true, defaultCategory: "programming", language: "zh" },
  { id: "v2ex", name: "V2EX", enabled: true, defaultCategory: "programming", language: "zh" },
  { id: "sspai", name: "少数派", enabled: true, defaultCategory: "growth", language: "zh" },
  { id: "juejin", name: "掘金", enabled: true, defaultCategory: "programming", language: "zh" },
  { id: "hackernews", name: "Hacker News", enabled: true, defaultCategory: "programming", language: "en" },
  { id: "producthunt", name: "Product Hunt", enabled: true, defaultCategory: "product", language: "en" },
  { id: "github", name: "GitHub", enabled: true, defaultCategory: "programming", language: "en" },

  // ── 可用但未启用（按需开启，开太多会导致日报过长） ──
  { id: "douyin", name: "抖音", enabled: false, defaultCategory: "news", language: "zh" },
  { id: "baidu", name: "百度", enabled: false, defaultCategory: "news", language: "zh" },
  { id: "bilibili", name: "B站", enabled: false, defaultCategory: "news", language: "zh" },
  { id: "toutiao", name: "今日头条", enabled: false, defaultCategory: "news", language: "zh" },
  { id: "thepaper", name: "澎湃新闻", enabled: false, defaultCategory: "news", language: "zh" },
  { id: "tieba", name: "贴吧", enabled: false, defaultCategory: "news", language: "zh" },
  { id: "wallstreetcn-hot", name: "华尔街见闻", enabled: false, defaultCategory: "business", language: "zh" },
  { id: "cls", name: "财联社", enabled: false, defaultCategory: "business", language: "zh" },
  { id: "ifeng", name: "凤凰网", enabled: false, defaultCategory: "news", language: "zh" },
  { id: "coolapk", name: "酷安", enabled: false, defaultCategory: "programming", language: "zh" },

  // ── 不可用（API 端 500，暂不启用） ──
  // { id: "_36kr", name: "36氪", enabled: false, defaultCategory: "business", language: "zh" },     // 500
  // { id: "huxiu", name: "虎嗅", enabled: false, defaultCategory: "business", language: "zh" },     // 500
];

/** 获取启用的平台 */
export function getEnabledPlatforms(): PlatformConfig[] {
  return PLATFORMS.filter((p) => p.enabled);
}
