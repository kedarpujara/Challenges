import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export function Progress({ value, max = 100, className, indicatorClassName }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('h-2 w-full rounded-full bg-muted overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full bg-accent transition-all duration-300', indicatorClassName)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

interface SegmentedProgressProps {
  segments: { value: number; color: string }[];
  total: number;
  className?: string;
}

export function SegmentedProgress({ segments, total, className }: SegmentedProgressProps) {
  return (
    <div className={cn('h-3 w-full rounded-full bg-muted overflow-hidden flex', className)}>
      {segments.map((segment, i) => {
        const percentage = total > 0 ? (segment.value / total) * 100 : 0;
        return (
          <div
            key={i}
            className={cn('h-full transition-all duration-300', segment.color)}
            style={{ width: `${percentage}%` }}
          />
        );
      })}
    </div>
  );
}
