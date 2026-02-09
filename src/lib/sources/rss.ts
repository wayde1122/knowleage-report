import { XMLParser } from "fast-xml-parser";
import type { RawItem } from "@/lib/types";
import { RSS_FEEDS } from "@/config/rss-feeds";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

interface RssChannel {
  title?: string;
  item?: RssEntry | RssEntry[];
  entry?: RssEntry | RssEntry[];
}

interface RssEntry {
  title?: string | { "#text": string };
  link?: string | { "@_href": string } | Array<{ "@_href": string; "@_rel"?: string }>;
  pubDate?: string;
  published?: string;
  updated?: string;
  "dc:date"?: string;
  author?: string | { name?: string };
  "dc:creator"?: string;
  description?: string | { "#text": string };
  summary?: string | { "#text": string };
  content?: string | { "#text": string };
  "content:encoded"?: string;
}

/** 提取文本内容 */
function extractText(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object" && "#text" in (val as Record<string, unknown>)) {
    return String((val as Record<string, string>)["#text"]);
  }
  return "";
}

/** 提取链接 */
function extractLink(val: unknown): string {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) {
    const alt = val.find((l) => l["@_rel"] === "alternate");
    return alt?.["@_href"] ?? val[0]?.["@_href"] ?? "";
  }
  if (val && typeof val === "object" && "@_href" in (val as Record<string, unknown>)) {
    return String((val as Record<string, string>)["@_href"]);
  }
  return "";
}

/** 提取作者 */
function extractAuthor(entry: RssEntry): string | undefined {
  if (typeof entry.author === "string") return entry.author;
  if (entry.author && typeof entry.author === "object") return entry.author.name;
  if (entry["dc:creator"]) return String(entry["dc:creator"]);
  return undefined;
}

/** 提取发布时间 */
function extractDate(entry: RssEntry): string | undefined {
  const dateStr = entry.pubDate ?? entry.published ?? entry.updated ?? entry["dc:date"];
  if (!dateStr) return undefined;
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return undefined;
  }
}

/** 抓取单个 RSS 源 */
async function fetchFeed(feed: (typeof RSS_FEEDS)[number]): Promise<RawItem[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "DailyInsightHub/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.warn(`[rss] ${feed.name} 请求失败: ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const parsed = xmlParser.parse(xml);

    // RSS 2.0
    const channel: RssChannel = parsed.rss?.channel ?? parsed.feed ?? {};
    const entries: RssEntry[] = (() => {
      const items = channel.item ?? channel.entry ?? [];
      return Array.isArray(items) ? items : [items];
    })();

    return entries
      .map((entry): RawItem | null => {
        const title = extractText(entry.title);
        const url = extractLink(entry.link);
        if (!title || !url) return null;

        const content = extractText(
          entry["content:encoded"] ?? entry.content ?? entry.description ?? entry.summary ?? ""
        );
        // 去掉 HTML 标签，截取前 500 字符
        const cleanContent = content.replace(/<[^>]+>/g, "").trim().slice(0, 500);

        return {
          title,
          url,
          sourceType: "rss",
          sourceName: feed.name,
          publishedAt: extractDate(entry),
          author: extractAuthor(entry),
          content: cleanContent || undefined,
          language: feed.language ?? "zh",
          defaultCategory: feed.defaultCategory,
        };
      })
      .filter((item): item is RawItem => item !== null);
  } catch (err) {
    console.error(`[rss] ${feed.name} 解析异常:`, err);
    return [];
  }
}

/** RSS 只保留最近 N 小时内发布的文章（过滤历史文章） */
const RSS_MAX_AGE_HOURS = 48;

/** 抓取所有 RSS 源（自动过滤超过 48 小时的历史文章） */
export async function fetchAllRssFeeds(): Promise<RawItem[]> {
  const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed));

  const cutoff = Date.now() - RSS_MAX_AGE_HOURS * 3600_000;
  let totalRaw = 0;
  let filtered = 0;

  const allItems: RawItem[] = [];
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const item of result.value) {
      totalRaw++;
      // 有发布时间的文章，过滤超龄的
      if (item.publishedAt) {
        const pubTime = new Date(item.publishedAt).getTime();
        if (pubTime < cutoff) { filtered++; continue; }
      }
      allItems.push(item);
    }
  }

  console.log(
    `[rss] 共抓取 ${totalRaw} 条，过滤 ${filtered} 条超过 ${RSS_MAX_AGE_HOURS}h 的历史文章，保留 ${allItems.length} 条`
  );
  return allItems;
}
