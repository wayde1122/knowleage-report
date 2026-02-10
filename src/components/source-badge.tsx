import type { SourceType } from "@/lib/types";

interface SourceBadgeProps {
  sourceName: string;
  sourceType: SourceType;
}

export function SourceBadge({ sourceName, sourceType }: SourceBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
      {sourceName}
    </span>
  );
}
