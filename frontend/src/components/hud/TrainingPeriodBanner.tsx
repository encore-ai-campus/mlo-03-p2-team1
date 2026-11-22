import { BrainCircuit } from 'lucide-react';
import { getQuarterSummary } from '../../services/dashboardData';
import { useDashboardStore } from '../../store/useDashboardStore';
import { TIMELINE_QUARTERS } from '../../types/dashboard';

const TRAIN_TOTAL = 16; // 2017Q1 ~ 2020Q4

export function TrainingPeriodBanner() {
  const selectedQuarter = useDashboardStore((s) => s.selectedQuarter);
  const viewMode = useDashboardStore((s) => s.viewMode);
  const summary = getQuarterSummary(selectedQuarter);

  if (viewMode !== 'error' || summary.periodType !== 'train') return null;

  const step = TIMELINE_QUARTERS.indexOf(selectedQuarter) + 1;
  const pct = Math.min(100, Math.round((step / TRAIN_TOTAL) * 100));

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center">
      <div className="hud-glass flex w-[224px] flex-col items-center gap-2 rounded-2xl border-cyan-400/25 px-4 py-3 text-center">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 animate-pulse text-cyan-300" />
          <span className="text-sm font-bold text-white">모델 학습 중</span>
        </div>

        <div className="font-mono text-[11px] text-slate-300">
          {selectedQuarter}{' '}
          <span className="text-slate-500">
            ({step}/{TRAIN_TOTAL})
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
