export function SiteFooter() {
  return (
    <footer className="z-50 shrink-0 border-t border-border bg-white">
      <div className="flex items-center justify-between px-4 py-2 sm:px-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-white">
            D
          </div>
          <span>DailyInsightHub · 知识日报聚合站</span>
        </div>
        <p className="hidden text-[11px] text-muted-foreground sm:block">
          热榜 API · RSS · Folo &nbsp;|&nbsp; AI by LiteLLM
        </p>
      </div>
    </footer>
  );
}
