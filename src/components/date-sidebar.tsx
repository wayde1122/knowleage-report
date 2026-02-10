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
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reportDates: string[] = data.dates ?? [];

      const today = getTodayDate();
      const dateSet = new Set(reportDates);
      if (!dateSet.has(today)) reportDates.unshift(today);

      setGroups(groupDatesByMonth(reportDates));
    } catch (err) {
      console.error("[DateSidebar] 加载日期列表失败:", err);
      setFetchError(true);
      setGroups(groupDatesByMonth([getTodayDate()]));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDates(); }, [fetchDates]);

  useEffect(() => {
    setExpandedMonth(currentDate.slice(0, 7));
  }, [currentDate]);

  return (
    <nav className="min-h-full w-full bg-card pl-2">
      <div className="border-l border-border py-6 pl-4">
        <h3 className="mb-6 font-display text-xs font-bold uppercase tracking-widest text-foreground/40">
          Archive
        </h3>

        {fetchError && (
          <div className="mb-4 flex items-center gap-1.5 rounded bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
            <span>加载失败</span>
            <button onClick={fetchDates} className="underline underline-offset-2 hover:no-underline">重试</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-16 animate-pulse bg-secondary" />
                <div className="ml-3 h-3 w-24 animate-pulse bg-secondary" />
                <div className="ml-3 h-3 w-24 animate-pulse bg-secondary" />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <p className="text-xs text-muted-foreground">暂无日报</p>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => {
              const isExpanded = expandedMonth === group.yearMonth;
              return (
                <div key={group.yearMonth} className="relative">
                  {/* Month Label */}
                  <button
                    onClick={() => setExpandedMonth(isExpanded ? "" : group.yearMonth)}
                    className="group flex cursor-pointer items-center gap-2 text-sm font-bold text-foreground transition-colors hover:text-primary"
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full bg-border transition-colors group-hover:bg-primary", isExpanded && "bg-primary")} />
                    <span>{group.label}</span>
                  </button>

                  {/* Dates List */}
                  {isExpanded && (
                    <div className="mt-2 flex flex-col gap-1 pl-1.5">
                      {group.dates.map((item) => (
                        <button
                          key={item.date}
                          onClick={() => onDateChange(item.date)}
                          className={cn(
                            "relative cursor-pointer border-l border-border pl-4 text-left text-sm transition-colors hover:text-foreground",
                            item.date === currentDate
                              ? "border-foreground font-medium text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          <span className="block py-1">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
