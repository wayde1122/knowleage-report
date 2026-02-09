"use client";

import { useState, useEffect, useCallback } from "react";
import { cn, getTodayDate } from "@/lib/utils";

interface DateSidebarProps {
  currentDate: string;
  onDateChange: (date: string) => void;
}

interface DateGroup {
  yearMonth: string;
  label: string;
  dates: { date: string; label: string }[];
}

/** 将日期列表按月分组 */
function groupDatesByMonth(dates: string[]): DateGroup[] {
  const groups = new Map<string, DateGroup>();

  for (const dateStr of dates) {
    const d = new Date(dateStr);
    const yearMonth = dateStr.slice(0, 7);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const yearLabel = `${d.getFullYear()}-${String(month).padStart(2, "0")}`;

    if (!groups.has(yearMonth)) {
      groups.set(yearMonth, { yearMonth, label: yearLabel, dates: [] });
    }

    const group = groups.get(yearMonth);
    if (group) {
      group.dates.push({
        date: dateStr,
        label: `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}-日报`,
      });
    }
  }

  return Array.from(groups.values());
}

export function DateSidebar({ currentDate, onDateChange }: DateSidebarProps) {
  const [groups, setGroups] = useState<DateGroup[]>([]);
  const [expandedMonth, setExpandedMonth] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchDates = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch("/api/report-dates");
      if (!res.ok) {
        console.error(`[DateSidebar] 请求失败: ${res.status}`);
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const reportDates: string[] = data.dates ?? [];

      // 确保今天始终在列表中（即使还没生成日报）
      const today = getTodayDate();
      const dateSet = new Set(reportDates);
      if (!dateSet.has(today)) {
        reportDates.unshift(today);
      }

      const grouped = groupDatesByMonth(reportDates);
      setGroups(grouped);
    } catch (err) {
      console.error("[DateSidebar] 加载日期列表失败:", err);
      setFetchError(true);
      // 请求失败时只显示今天
      const today = getTodayDate();
      setGroups(groupDatesByMonth([today]));
    } finally {
      setLoading(false);
    }
  }, []);

  // 仅在组件挂载时拉取日期列表
  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  // 切换日期时自动展开对应月份（不重新请求）
  useEffect(() => {
    setExpandedMonth(currentDate.slice(0, 7));
  }, [currentDate]);

  return (
    <nav className="h-full w-52 shrink-0 border-r border-border bg-white">
      <div className="px-3 py-4">
        {/* 加载失败提示 */}
        {fetchError && (
          <div className="mb-2 flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
            <span>加载失败</span>
            <button
              onClick={fetchDates}
              className="underline underline-offset-2 hover:no-underline"
            >
              重试
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-2 px-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-6 animate-pulse rounded bg-secondary/60" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <p className="px-2 text-xs text-muted-foreground">暂无日报</p>
        ) : (
          groups.map((group) => {
            const isExpanded = expandedMonth === group.yearMonth;
            return (
              <div key={group.yearMonth} className="mb-1">
                <button
                  onClick={() =>
                    setExpandedMonth(isExpanded ? "" : group.yearMonth)
                  }
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                    "text-foreground hover:bg-secondary"
                  )}
                >
                  <span>{group.label}</span>
                  <svg
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isExpanded && "rotate-90"
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="ml-2 mt-1 space-y-0.5 border-l-2 border-border pl-3">
                    {group.dates.map((item) => (
                      <button
                        key={item.date}
                        onClick={() => onDateChange(item.date)}
                        className={cn(
                          "block w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                          item.date === currentDate
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </nav>
  );
}
