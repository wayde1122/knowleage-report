import { formatHeatValue } from "@/lib/utils";

interface HeatIndicatorProps {
  value: number;
  rank?: number | null;
}

export function HeatIndicator({ value, rank }: HeatIndicatorProps) {
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      {rank != null && rank <= 3 && (
        <span className="font-bold text-primary">TOP {rank}</span>
      )}
      {rank != null && rank > 3 && (
        <span className="text-muted-foreground">#{rank}</span>
      )}
      <span className="font-medium tabular-nums text-muted-foreground">{formatHeatValue(value)}</span>
    </span>
  );
}
