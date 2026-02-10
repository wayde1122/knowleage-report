export function SiteFooter() {
  return (
    <footer className="z-50 shrink-0 border-t border-border bg-card">
      <div className="flex items-center justify-between px-4 py-2 sm:px-6">
        <span className="text-xs text-muted-foreground">
          DailyInsightHub · 知识日报聚合站
        </span>
        <span className="hidden text-[11px] text-muted-foreground/60 sm:block">
          热榜 API · RSS · Folo · LiteLLM
        </span>
      </div>
    </footer>
  );
}
