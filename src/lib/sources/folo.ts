import type { RawItem, CategorySlug } from "@/lib/types";

/** Folo API 地址（原 Follow，已更名为 Folo） */
const FOLO_API_BASE = "https://api.folo.is";

/** 每个 view 最大拉取条数 */
const MAX_ENTRIES_PER_VIEW = 50;

/** 社交内容（view=1）最低标题长度，过滤 "Exactly"、"Awesome" 等无意义短文 */
const SOCIAL_MIN_TITLE_LENGTH = 20;

/** 社交内容需要跳过的前缀（RT 转推、纯 @ 回复等） */
const SOCIAL_SKIP_PREFIXES = ["RT ", "rt "];

/** Folo 返回的 entry 结构 */
interface FoloEntry {
  read: boolean;
  view: number;
  entries: {
    id: string;
    title?: string;
    url?: string;
    description?: string;
    author?: string;
    publishedAt?: string;
    language?: string | null;
    summary?: string | null;
  };
  feeds: {
    title?: string;
    url?: string;
    siteUrl?: string;
  };
  subscriptions?: {
    category?: string | null;
    title?: string | null;
  };
}

/** 简单的 feed 名称 → 默认分类映射 */
const FEED_CATEGORY_HINTS: Record<string, CategorySlug> = {
  "openai": "ai",
  "hugging face": "ai",
  "deepmind": "ai",
  "anthropic": "ai",
  "machine learning": "ai",
  "github": "programming",
  "hacker news": "programming",
  "techcrunch": "business",
  "the verge": "product",
  "macrumors": "product",
  "ars technica": "programming",
  "producthunt": "product",
};

/**
 * 根据 feed 标题猜测默认分类
 */
function guessCategoryFromFeed(feedTitle: string): CategorySlug {
  const lower = feedTitle.toLowerCase();
  for (const [keyword, category] of Object.entries(FEED_CATEGORY_HINTS)) {
    if (lower.includes(keyword)) return category;
  }
  return "news";
}

/**
 * 构建 Folo API 请求所需的认证头
 */
function buildFoloHeaders(): Record<string, string> {
  const cookie = process.env.FOLO_COOKIE ?? "";
  if (!cookie) return {};

  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
    Accept: "*/*",
    Cookie: cookie,
    "X-App-Name": "Folo Web",
    "X-App-Platform": "desktop/web",
    "X-App-Version": "1.2.6",
    Origin: "https://app.folo.is",
    "Content-Type": "application/json",
  };
}

/**
 * 从 Folo 拉取指定 view 的 entries
 * view: 0=文章, 1=社交/短文, 2=图片, 3=视频
 */
async function fetchEntriesByView(
  headers: Record<string, string>,
  view: number,
  publishedAfter?: string
): Promise<FoloEntry[]> {
  const all: FoloEntry[] = [];
  const seen = new Set<string>();

  // Folo API 每次最多返回 20 条，暂无可靠分页机制
  // 直接拉一次即可（20 条/view 对日报足够）
  const body: Record<string, unknown> = { view };
  if (publishedAfter) body.publishedAfter = publishedAfter;

  try {
    const res = await fetch(`${FOLO_API_BASE}/entries`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.error(`[folo] entries view=${view} HTTP ${res.status}`);
      return [];
    }

    const json = await res.json();
    const entries: FoloEntry[] = json.data ?? [];

    for (const entry of entries) {
      const id = entry.entries?.id;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      all.push(entry);
      if (all.length >= MAX_ENTRIES_PER_VIEW) break;
    }
  } catch (err) {
    console.error(`[folo] fetch view=${view} failed:`, err);
  }

  return all;
}

/**
 * 判断社交内容是否值得保留
 * 过滤 RT 转推、纯短文等低价值内容
 */
function isSocialEntryWorthKeeping(entry: FoloEntry): boolean {
  const title = entry.entries?.title?.trim() ?? "";

  // 标题太短，无实质信息
  if (title.length < SOCIAL_MIN_TITLE_LENGTH) return false;

  // RT 转推，通常是转发他人内容
  for (const prefix of SOCIAL_SKIP_PREFIXES) {
    if (title.startsWith(prefix)) return false;
  }

  return true;
}

/**
 * 将 Folo entry 转换为 RawItem
 * isSocial 标识是否来自社交 view，用于额外过滤
 */
function entryToRawItem(entry: FoloEntry, isSocial = false): RawItem | null {
  const { entries: e, feeds: f } = entry;
  const title = e.title?.trim();
  const url = e.url?.trim();

  // 跳过无标题或无链接的条目
  if (!title || !url) return null;

  // 社交内容额外质量过滤
  if (isSocial && !isSocialEntryWorthKeeping(entry)) return null;

  const feedName = f?.title ?? "Unknown Feed";
  const category = guessCategoryFromFeed(feedName);

  return {
    title,
    url,
    sourceType: "folo",
    sourceName: `Folo/${feedName}`,
    publishedAt: e.publishedAt ?? undefined,
    author: e.author ?? undefined,
    content: e.description ?? e.summary ?? undefined,
    language: e.language ?? undefined,
    defaultCategory: category,
  };
}

/**
 * 通过 Folo API 获取订阅内容
 * 拉取 view=0（文章）和 view=1（社交/短文）
 */
export async function fetchFoloFeeds(): Promise<RawItem[]> {
  const cookie = process.env.FOLO_COOKIE ?? "";
  if (!cookie) {
    console.log("[folo] FOLO_COOKIE 未配置，跳过");
    return [];
  }

  const headers = buildFoloHeaders();

  // 用今天 00:00 UTC 作为过滤起点
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const publishedAfter = today.toISOString();

  console.log(`[folo] 开始拉取 Folo 订阅内容 (after=${publishedAfter})`);

  // 并行拉取文章(view=0)和社交(view=1)
  const [articleEntries, socialEntries] = await Promise.allSettled([
    fetchEntriesByView(headers, 0, publishedAfter),
    fetchEntriesByView(headers, 1, publishedAfter),
  ]);

  const articles = articleEntries.status === "fulfilled" ? articleEntries.value : [];
  const socials = socialEntries.status === "fulfilled" ? socialEntries.value : [];

  // 去重（跨 view 可能有重叠）并转换，社交内容标记 isSocial 以启用额外过滤
  const seenUrls = new Set<string>();
  const items: RawItem[] = [];

  for (const entry of articles) {
    const item = entryToRawItem(entry, false);
    if (!item || seenUrls.has(item.url)) continue;
    seenUrls.add(item.url);
    items.push(item);
  }

  let socialFiltered = 0;
  for (const entry of socials) {
    const item = entryToRawItem(entry, true);
    if (!item) { socialFiltered++; continue; }
    if (seenUrls.has(item.url)) continue;
    seenUrls.add(item.url);
    items.push(item);
  }

  console.log(
    `[folo] 获取到 ${items.length} 条 (articles=${articles.length}, social=${socials.length}, socialFiltered=${socialFiltered})`
  );

  return items;
}
