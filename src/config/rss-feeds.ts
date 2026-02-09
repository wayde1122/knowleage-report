import type { RssFeedConfig } from "@/lib/types";

/**
 * RSS 订阅源配置
 * 2025-02-09 测试：rsshub.app 公共实例 403，已替换为官方 RSS 或可用镜像
 */
export const RSS_FEEDS: RssFeedConfig[] = [
  // ── 中文源 ──
  { url: "https://36kr.com/feed", name: "36氪", defaultCategory: "business", language: "zh" },
  { url: "https://www.infoq.cn/feed", name: "InfoQ 中文", defaultCategory: "programming", language: "zh" },
  { url: "https://www.jiqizhixin.com/rss", name: "机器之心", defaultCategory: "ai", language: "zh" },

  // ── 英文源 ──
  { url: "https://dev.to/feed", name: "DEV Community", defaultCategory: "programming", language: "en" },
  { url: "https://openai.com/blog/rss.xml", name: "OpenAI Blog", defaultCategory: "ai", language: "en" },
  { url: "https://huggingface.co/blog/feed.xml", name: "Hugging Face Blog", defaultCategory: "ai", language: "en" },
  { url: "https://techcrunch.com/feed/", name: "TechCrunch", defaultCategory: "business", language: "en" },
  { url: "https://feeds.arstechnica.com/arstechnica/index", name: "Ars Technica", defaultCategory: "programming", language: "en" },
  { url: "https://www.technologyreview.com/feed/", name: "MIT Tech Review", defaultCategory: "ai", language: "en" },

  // ── 已去重（与热榜/Folo 重叠，无需重复拉取） ──
  // { url: "https://sspai.com/feed", name: "少数派" }           → 热榜已覆盖
  // { url: "https://rsshub.rssforever.com/juejin/...", name: "掘金" } → 热榜已覆盖
  // { url: "https://www.theverge.com/rss/index.xml", name: "The Verge" } → Folo 已覆盖
];
