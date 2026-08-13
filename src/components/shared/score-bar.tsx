import { cn } from "@/lib/utils";

export function ScoreBar({
  score,
  max = 100,
  className,
}: {
  score: number;
  max?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded bg-neutral-100", className)}>
      <div
        className="h-full origin-left animate-bar-grow rounded bg-brand"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ComparisonBars({
  values,
}: {
  values: Array<{ label: string; raw: string; score: number }>;
}) {
  return (
    <div className="space-y-3">
      {values.map((v) => (
        <div key={v.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="font-medium">{v.label}</span>
            <span className="text-[var(--ink-muted)]">{v.raw}</span>
          </div>
          <ScoreBar score={v.score} />
        </div>
      ))}
    </div>
  );
}
