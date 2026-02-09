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

/** 生成标题 id（与 toc-sidebar 保持一致） */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "");
}

/** 自定义 Markdown 标题渲染，添加 id 锚点 */
function HeadingRenderer({ level, children }: { level: number; children?: React.ReactNode }) {
  const text = String(children ?? "");
  const id = slugify(text);
  const styles: Record<number, string> = {
    1: "text-2xl font-bold text-foreground mt-8 mb-4 pb-2 border-b border-border",
    2: "text-xl font-bold text-foreground mt-8 mb-3",
    3: "text-lg font-semibold text-foreground mt-6 mb-2",
  };
  const Tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
  return (
    <Tag id={id} className={styles[level] ?? ""}>
      <a href={`#${id}`} className="no-underline hover:underline">
        {children}
      </a>
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
      <div className="animate-pulse">
        {/* 标题骨架 */}
        <div className="mb-8">
          <div className="mb-2 h-9 w-72 rounded bg-secondary/60" />
          <div className="mt-4 flex gap-2">
            <div className="h-7 w-20 rounded-full bg-secondary/60" />
            <div className="h-7 w-24 rounded-full bg-secondary/60" />
            <div className="h-7 w-16 rounded-full bg-secondary/60" />
          </div>
        </div>
        {/* 摘要骨架 */}
        <div className="mb-8 rounded-lg border-l-4 border-secondary bg-secondary/20 px-5 py-4">
          <div className="mb-2 h-5 w-20 rounded bg-secondary/60" />
          <div className="h-4 w-full rounded bg-secondary/60" />
        </div>
        {/* 正文骨架 */}
        <div className="space-y-4">
          <div className="h-6 w-48 rounded bg-secondary/60" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-secondary/50" />
            <div className="h-4 w-full rounded bg-secondary/50" />
            <div className="h-4 w-5/6 rounded bg-secondary/50" />
          </div>
          <div className="h-6 w-40 rounded bg-secondary/60" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-secondary/50" />
            <div className="h-4 w-4/5 rounded bg-secondary/50" />
            <div className="h-4 w-full rounded bg-secondary/50" />
            <div className="h-4 w-3/4 rounded bg-secondary/50" />
          </div>
          <div className="h-6 w-56 rounded bg-secondary/60" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-secondary/50" />
            <div className="h-4 w-5/6 rounded bg-secondary/50" />
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-secondary/30 px-8 py-16 text-center">
        <div className="mb-4 text-5xl">📋</div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          日报尚未生成
        </h3>
        <p className="text-sm text-muted-foreground">
          {date} 的 AI 日报分析尚未生成，请触发定时任务 /api/cron
        </p>
      </div>
    );
  }

  const formattedDate = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(date));

  return (
    <article className="report-content">
      {/* 日报标题区 */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          AI 资讯日报 {formattedDate}
        </h1>

        {/* 分类标签 */}
        {report.highlights?.hotTopics && report.highlights.hotTopics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {report.highlights.hotTopics.map((topic, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary transition-colors hover:bg-primary/10"
              >
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 今日摘要区 */}
      {report.stats && (
        <div className="mb-8 rounded-lg border-l-4 border-primary bg-primary/5 px-5 py-4">
          <h2 id="今日摘要" className="mb-2 text-base font-bold text-foreground">
            今日摘要
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            共收录 <strong className="text-foreground">{report.stats.totalArticles}</strong> 条资讯，
            覆盖{" "}
            <strong className="text-foreground">
              {Object.keys(report.stats.byCategory ?? {}).length}
            </strong>{" "}
            个知识分类，来自{" "}
            <strong className="text-foreground">
              {Object.keys(report.stats.bySource ?? {}).length}
            </strong>{" "}
            个数据源。
          </p>
        </div>
      )}

      {/* Markdown 日报正文 */}
      <div className="prose prose-slate max-w-none prose-headings:scroll-mt-20 prose-p:leading-relaxed prose-li:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-blockquote:border-primary/30 prose-blockquote:bg-secondary/30 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-code:rounded prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-normal prose-code:before:content-none prose-code:after:content-none">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: H1,
            h2: H2,
            h3: H3,
          }}
        >
          {report.content}
        </Markdown>
      </div>

      {/* 统计尾部 */}
      {report.stats?.byCategory && (
        <div className="mt-10 border-t border-border pt-6">
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
            分类统计
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(report.stats.byCategory).map(([cat, count]) => (
              <div
                key={cat}
                className="rounded-lg border border-border bg-white px-3 py-2 text-center"
              >
                <div className="text-lg font-bold text-foreground">{count as number}</div>
                <div className="text-xs text-muted-foreground">{cat}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
