import { formatSignedPercent } from '../../../utils/formatters';

interface GrowthBarRowProps {
  label: string;
  value: number;
  maxAbs?: number;
  barColor: string;
}

export function GrowthBarRow({ label, value, maxAbs = 26, barColor }: GrowthBarRowProps) {
  const widthPct = Math.min(100, (Math.abs(value) / maxAbs) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-300">{label}</span>
        <span className="font-mono font-semibold text-slate-100">
          {formatSignedPercent(value, 2)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/90">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${widthPct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}
