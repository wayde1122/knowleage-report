/** 获取今天的日期字符串 YYYY-MM-DD */
export function getTodayDate(): string {
  return new Intl.DateTimeFormat("sv-SE").format(new Date());
}

/** 格式化日期为中文可读格式 */
export function formatDateCN(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

/** 格式化相对时间 */
export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const target = new Date(dateStr).getTime();
  const diffMs = now - target;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 30) return `${diffDay}天前`;
  return formatDateCN(dateStr);
}

/** 标准化 URL（去掉尾部斜杠、查询参数中的追踪参数） */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // 移除常见追踪参数
    const trackingParams = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref", "source"];
    for (const param of trackingParams) {
      u.searchParams.delete(param);
    }
    // 去掉尾部斜杠
    let normalized = u.toString();
    if (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return url;
  }
}

/** 计算两个字符串的编辑距离（Levenshtein） */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
      }
    }
  }

  return dp[m][n];
}

/** 标题相似度（0-1，1 为完全相同） */
export function titleSimilarity(a: string, b: string): number {
  const cleanA = a.replace(/\s+/g, "").toLowerCase();
  const cleanB = b.replace(/\s+/g, "").toLowerCase();
  const maxLen = Math.max(cleanA.length, cleanB.length);
  if (maxLen === 0) return 1;
  return 1 - editDistance(cleanA, cleanB) / maxLen;
}

/** 格式化热度数值 */
export function formatHeatValue(value: number): string {
  if (value >= 100000000) {
    return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(value / 100000000) + "亿";
  }
  if (value >= 10000) {
    return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(value / 10000) + "万";
  }
  return new Intl.NumberFormat("zh-CN").format(value);
}

/** 延迟 ms */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 分批处理数组 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/** cn - 合并 className */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
