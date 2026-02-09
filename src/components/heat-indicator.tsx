import { formatHeatValue } from "@/lib/utils";

interface HeatIndicatorProps {
  value: number;
  rank?: number | null;
}

export function HeatIndicator({ value, rank }: HeatIndicatorProps) {
  // 根据热度值决定火焰数量
  const flames = value >= 1000000 ? "🔥🔥🔥" : value >= 100000 ? "🔥🔥" : "🔥";

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {rank != null && rank <= 3 && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {rank}
        </span>
      )}
      {rank != null && rank > 3 && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">
          {rank}
        </span>
      )}
      <span className="leading-none">{flames}</span>
      <span className="font-medium text-orange-600">{formatHeatValue(value)}</span>
    </div>
  );
}
