import type { SourceType } from "@/lib/types";

interface SourceBadgeProps {
  sourceName: string;
  sourceType: SourceType;
}

const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  hotlist: "热榜",
  rss: "RSS",
  folo: "Folo",
};

export function SourceBadge({ sourceName, sourceType }: SourceBadgeProps) {
  return (
    <span className="text-xs text-muted-foreground">
      <span className="font-medium">{sourceName}</span>
      <span className="mx-1 text-border">·</span>
      <span>{SOURCE_TYPE_LABEL[sourceType]}</span>
    </span>
  );
}
