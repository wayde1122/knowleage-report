import { cn } from "@/lib/utils";
import type { SourceType } from "@/lib/types";

interface SourceBadgeProps {
  sourceName: string;
  sourceType: SourceType;
}

const SOURCE_TYPE_STYLES: Record<SourceType, string> = {
  hotlist: "bg-orange-50 text-orange-700 border-orange-200",
  rss: "bg-blue-50 text-blue-700 border-blue-200",
  folo: "bg-violet-50 text-violet-700 border-violet-200",
};

const SOURCE_TYPE_ICONS: Record<SourceType, string> = {
  hotlist: "🔥",
  rss: "📡",
  folo: "📌",
};

export function SourceBadge({ sourceName, sourceType }: SourceBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        SOURCE_TYPE_STYLES[sourceType]
      )}
    >
      <span>{SOURCE_TYPE_ICONS[sourceType]}</span>
      <span>{sourceName}</span>
    </span>
  );
}
