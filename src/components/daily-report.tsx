"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DailyReport as DailyReportType } from "@/lib/types";
import type { ComponentPropsWithoutRef } from "react";

interface DailyReportProps {
  report: DailyReportType | null;
  date: string;
  loading?: boolean;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u4e00-\u9fa5-]/g, "");
}

function HeadingRenderer({ level, children }: { level: number; children?: React.ReactNode }) {
  const text = String(children ?? "");
  const id = slugify(text);
  const styles: Record<number, string> = {
    1: "text-2xl font-bold text-foreground mt-8 mb-4 pb-2 border-b-2 border-border",
    2: "text-xl font-bold text-foreground mt-8 mb-3",
    3: "text-lg font-semibold text-foreground mt-6 mb-2",
  };
  const Tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
  return (
    <Tag id={id} className={styles[level] ?? ""}>
      <a href={`#${id}`} className="no-underline hover:text-primary hover:underline">{children}</a>
    </Tag>
  );
}

function H1(props: ComponentPropsWithoutRef<"h1">) {
  return <HeadingRenderer level={1}>{props.children}</HeadingRenderer>;
}
function H2(props: ComponentPropsWithoutRef<"h2">) {
  return <HeadingRenderer level={2}>{props.children}</HeadingRenderer>;
}
function H3(props: ComponentPropsWithoutRef<"h3">) {
  return <HeadingRenderer level={3}>{props.children}</HeadingRenderer>;
}

export function DailyReportCard({ report, date, loading = false }: DailyReportProps) {
  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <div className="mb-2 h-8 w-64 animate-pulse rounded bg-secondary" />
          <div className="mt-3 flex gap-2">
            <div className="h-6 w-20 animate-pulse rounded bg-secondary" />
            <div className="h-6 w-24 animate-pulse rounded bg-secondary" />
          </div>
        </div>
        <div className="space-y-3">
          {[100, 92, 85, 100, 78, 95, 88, 70].map((w, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-secondary" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="animate-fade-in py-16 text-center">
        <h3 className="mb-2 font-display text-lg text-foreground">尚无日报</h3>
        <p className="text-sm text-muted-foreground">
          {date} 的 AI 分析尚未生成
        </p>
      </div>
    );
  }

  const formattedDate = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(date));

  return (
    <article className="animate-fade-in">
      {/* 报头 */}
      <header className="mb-8 border-b-2 border-foreground/10 pb-6">
        <p className="mb-1 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          Daily Insight Report
        </p>
        <h1 className="font-display text-[28px] font-bold leading-tight text-foreground sm:text-3xl">
          AI 资讯日报
        </h1>
        <time className="mt-1 block text-sm text-muted-foreground">{formattedDate}</time>

        {report.highlights?.hotTopics && report.highlights.hotTopics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
            {report.highlights.hotTopics.map((topic, i) => (
              <span key={i} className="text-sm text-foreground/80">
                {i > 0 && <span className="mr-3 text-border">·</span>}
                {topic}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* 摘要 */}
      {report.stats && (
        <div className="mb-8 border-l-[3px] border-primary py-1 pl-4">
          <p className="text-sm leading-relaxed text-foreground/80">
            本日共收录 <strong className="font-bold text-foreground">{report.stats.totalArticles}</strong> 条资讯，
            覆盖 <strong className="font-bold text-foreground">{Object.keys(report.stats.byCategory ?? {}).length}</strong> 个分类，
            来自 <strong className="font-bold text-foreground">{Object.keys(report.stats.bySource ?? {}).length}</strong> 个来源。
          </p>
        </div>
      )}

      {/* 正文 */}
      <div className="report-markdown">
        <Markdown remarkPlugins={[remarkGfm]} components={{ h1: H1, h2: H2, h3: H3 }}>
          {report.content}
        </Markdown>
      </div>

      {/* 分类统计 */}
      {report.stats?.byCategory && (
        <footer className="mt-10 border-t-2 border-foreground/10 pt-6">
          <h3 className="mb-4 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            分类统计
          </h3>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {Object.entries(report.stats.byCategory).map(([cat, count]) => (
              <div key={cat} className="flex items-baseline gap-1.5">
                <span className="font-display text-lg font-bold tabular-nums text-foreground">{count as number}</span>
                <span className="text-xs text-muted-foreground">{cat}</span>
              </div>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
}
