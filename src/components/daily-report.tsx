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
  const Tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
  return <Tag id={id}>{children}</Tag>;
}

export function DailyReportCard({ report, date, loading = false }: DailyReportProps) {
  if (loading) {
    return (
      <div className="py-12 max-w-2xl">
        <div className="mb-8 space-y-4">
          <div className="h-8 w-3/4 animate-pulse bg-secondary" />
          <div className="h-4 w-1/4 animate-pulse bg-secondary" />
        </div>
        <div className="space-y-3">
          {[100, 90, 95, 80, 85, 90].map((w, i) => (
            <div key={i} className="h-4 animate-pulse bg-secondary" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="border border-dashed border-border py-20 text-center max-w-2xl">
        <h3 className="font-display text-xl text-foreground">No Report Generated</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Analysis for {date} is not available.
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
    <article className="animate-fade-in max-w-2xl">
      <header className="mb-10">
        <div className="mb-4 flex items-center gap-3 border-b border-black pb-4">
          <span className="text-xs font-bold uppercase tracking-widest">Daily Briefing</span>
          <span className="flex-1 border-t border-border" />
          <time className="text-xs font-medium uppercase tracking-widest">{formattedDate}</time>
        </div>
        
        <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
          AI 资讯日报
        </h1>

        {report.highlights?.hotTopics && (
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-muted-foreground">
            {report.highlights.hotTopics.map((topic, i) => (
              <span key={i} className="text-foreground underline decoration-border underline-offset-4">
                {topic}
              </span>
            ))}
          </div>
        )}
      </header>

      {report.stats && (
        <div className="mb-10 bg-secondary p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{report.stats.totalArticles}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Articles</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{Object.keys(report.stats.byCategory ?? {}).length}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Categories</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{Object.keys(report.stats.bySource ?? {}).length}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Sources</div>
            </div>
          </div>
        </div>
      )}

      <div className="report-markdown">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: (props) => <HeadingRenderer level={1} {...props} />,
            h2: (props) => <HeadingRenderer level={2} {...props} />,
            h3: (props) => <HeadingRenderer level={3} {...props} />,
          }}
        >
          {report.content}
        </Markdown>
      </div>
    </article>
  );
}
