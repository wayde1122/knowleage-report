"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TocSidebarProps {
  content: string;
}

function extractHeadings(markdown: string): TocItem[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/[*_`~]/g, "").trim();
    const id = text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\u4e00-\u9fa5-]/g, "");
    items.push({ id, text, level });
  }

  return items;
}

export function TocSidebar({ content }: TocSidebarProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => { setHeadings(extractHeadings(content)); }, [content]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0.1 }
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside className="w-52 shrink-0 py-4 pl-2">
      <h4 className="mb-3 px-2 font-display text-[11px] font-semibold uppercase tracking-widest text-primary">
        目录
      </h4>
      <nav className="space-y-0.5">
        {headings.map((item) => (
          <a
            key={`${item.id}-${item.text}`}
            href={`#${item.id}`}
            className={cn(
              "block rounded px-2 py-1.5 text-sm transition-colors",
              item.level === 1 && "font-medium",
              item.level === 2 && "pl-4",
              item.level === 3 && "pl-6 text-xs",
              activeId === item.id
                ? "border-l-2 border-primary bg-primary/5 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {item.text}
          </a>
        ))}
      </nav>
    </aside>
  );
}
