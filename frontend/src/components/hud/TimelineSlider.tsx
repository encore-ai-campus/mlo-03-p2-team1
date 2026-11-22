import { ChevronLeft, ChevronRight, Pause, Play, Sparkles } from 'lucide-react';
import { REGIME_THEME } from '../../config/regimes';
import { useTimelinePlayback } from '../../hooks/useTimelinePlayback';
import { getQuarterSummary } from '../../services/dashboardData';
import { useDashboardStore } from '../../store/useDashboardStore';
import {
  FORECAST_QUARTER,
  LATEST_OBSERVED_QUARTER,
  TIMELINE_QUARTERS,
} from '../../types/dashboard';

const PERIOD_LABEL = {
  train: { text: '학습 구간', cls: 'text-slate-300' },
  eval: { text: '롤링 검증', cls: 'text-cyan-300' },
  forecast: { text: '다음 분기 예측', cls: 'text-violet-300' },
} as const;

const FULL_MAX_IDX = TIMELINE_QUARTERS.length - 1;
const EVAL_START_IDX = TIMELINE_QUARTERS.indexOf('2021Q1');
const LAST_EVAL_IDX = TIMELINE_QUARTERS.indexOf(LATEST_OBSERVED_QUARTER);
const FORECAST_IDX = TIMELINE_QUARTERS.indexOf(FORECAST_QUARTER);

export function TimelineSlider() {
  const selectedQuarter = useDashboardStore((s) => s.selectedQuarter);
  const viewMode = useDashboardStore((s) => s.viewMode);
  const isPlaying = useDashboardStore((s) => s.isPlaying);
  const setSelectedQuarter = useDashboardStore((s) => s.setSelectedQuarter);
  const togglePlaying = useDashboardStore((s) => s.togglePlaying);

  useTimelinePlayback();

  const isAiMode = viewMode === 'error';
  const maxIdx = isAiMode ? LAST_EVAL_IDX : FULL_MAX_IDX;
  const trainEvalBoundaryPct = ((EVAL_START_IDX - 0.5) / maxIdx) * 100;
  const evalForecastBoundaryPct = isAiMode ? 100 : ((FORECAST_IDX - 0.5) / maxIdx) * 100;

  const activeIdx = Math.min(maxIdx, TIMELINE_QUARTERS.indexOf(selectedQuarter));
  const thumbPct = (activeIdx / maxIdx) * 100;
  const summary = getQuarterSummary(selectedQuarter);
  const theme = REGIME_THEME[summary.regime];
  const periodInfo = PERIOD_LABEL[summary.periodType];
  const isForecast = selectedQuarter === FORECAST_QUARTER;
  const isLatestEval = selectedQuarter === LATEST_OBSERVED_QUARTER;

  const stepBy = (delta: number) => {
    const nextIdx = Math.min(maxIdx, Math.max(0, activeIdx + delta));
    setSelectedQuarter(TIMELINE_QUARTERS[nextIdx]);
  };

  const thumbColorClass =
    summary.periodType === 'forecast'
      ? 'border-violet-200 bg-violet-400 shadow-[0_0_10px_#a78bfa]'
      : summary.periodType === 'eval'
        ? 'border-cyan-100 bg-cyan-400 shadow-[0_0_10px_#22d3ee]'
        : 'border-slate-200 bg-slate-300 shadow-[0_0_8px_rgba(203,213,225,0.65)]';

  return (
    <footer
      aria-label="분기 타임라인 제어"
      className="pointer-events-none fixed bottom-3 left-0 right-0 z-20 flex justify-center px-3"
    >
      <div className="pointer-events-auto hud-glass flex w-full max-w-[840px] items-center gap-4 rounded-2xl px-5 py-3.5">
        {/* Playback & Step Controls (>= 40px tap targets + aria-labels) */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={togglePlaying}
            aria-label={isPlaying ? '타임라인 일시정지' : '분기별 자동 재생'}
            aria-pressed={isPlaying}
            title={isPlaying ? '일시정지' : '분기별 자동 재생'}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/45 bg-cyan-500/20 text-cyan-100 transition hover:bg-cyan-500/30 hover:text-white"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={() => stepBy(-1)}
            disabled={activeIdx <= 0}
            aria-label="이전 분기"
            title="이전 분기"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/60 text-slate-200 transition hover:border-slate-500 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => stepBy(1)}
            disabled={activeIdx >= maxIdx}
            aria-label="다음 분기"
            title="다음 분기"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/60 text-slate-200 transition hover:border-slate-500 hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Current Quarter + Segmented Track with Train/Eval Boundary */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${isForecast ? 'bg-violet-400' : theme.dotSimple}`}
              />
              <span className="font-mono text-base font-extrabold text-white">
                {selectedQuarter}
              </span>
              <span className={`font-semibold ${periodInfo.cls}`}>{periodInfo.text}</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2 w-3 rounded-full bg-slate-500" />
                학습
              </span>
              <span className="flex items-center gap-1.5 text-cyan-300">
                <span className="h-2 w-3 rounded-full bg-cyan-400/80" />
                검증
              </span>
            </div>
          </div>

          <div className="relative flex h-6 items-center">
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="absolute inset-y-0 left-0 bg-slate-500/75"
                style={{ width: `${trainEvalBoundaryPct}%` }}
              />
              <div
                className="absolute inset-y-0 bg-cyan-500/45"
                style={{
                  left: `${trainEvalBoundaryPct}%`,
                  width: `${evalForecastBoundaryPct - trainEvalBoundaryPct}%`,
                }}
              />
              {!isAiMode && (
                <div
                  className="absolute inset-y-0 right-0 bg-violet-400/80"
                  style={{ left: `${evalForecastBoundaryPct}%` }}
                />
              )}
              <div
                className="absolute inset-y-0 left-0 bg-white/25"
                style={{ width: `${thumbPct}%` }}
              />
            </div>

            {/* Train | Eval Boundary Line */}
            <div
              className="pointer-events-none absolute top-1/2 h-5 w-[2.5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]"
              style={{ left: `${trainEvalBoundaryPct}%` }}
            />

            {/* Synced round thumb */}
            <div
              className={`pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-colors ${thumbColorClass}`}
              style={{ left: `${thumbPct}%` }}
            />

            <input
              type="range"
              min={0}
              max={maxIdx}
              step={1}
              value={activeIdx}
              onChange={(e) => {
                const idx = Number(e.target.value);
                setSelectedQuarter(TIMELINE_QUARTERS[idx]);
              }}
              aria-label="분기 타임라인 슬라이더"
              aria-valuetext={selectedQuarter}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>

          <div className="relative h-4 font-mono text-xs text-slate-300">
            <span className="absolute left-0">17Q1</span>
            <span
              className="absolute -translate-x-1/2 font-semibold text-cyan-300"
              style={{ left: `${trainEvalBoundaryPct}%` }}
            >
              21Q1 검증
            </span>
            <span className={`absolute right-0 ${isAiMode ? 'text-cyan-300' : 'text-violet-300'}`}>
              {isAiMode ? '26Q3' : '26Q4'}
            </span>
          </div>
        </div>

        {/* Quick End / Forecast Jump */}
        {isAiMode ? (
          <button
            type="button"
            aria-pressed={isLatestEval}
            onClick={() => setSelectedQuarter(LATEST_OBSERVED_QUARTER)}
            className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-4 text-sm font-bold transition ${
              isLatestEval
                ? 'border-cyan-400/80 bg-cyan-500/30 text-cyan-100 shadow-[0_0_14px_-3px_rgba(34,211,238,0.65)]'
                : 'border-cyan-500/40 bg-cyan-500/15 text-cyan-200 hover:border-cyan-400/65 hover:bg-cyan-500/25'
            }`}
            title="마지막 예측 검증 분기(2026Q3) 보기"
          >
            <Sparkles className="h-4 w-4" />
            <span>최종 26Q3</span>
          </button>
        ) : (
          <button
            type="button"
            aria-pressed={isForecast}
            onClick={() =>
              setSelectedQuarter(isForecast ? LATEST_OBSERVED_QUARTER : FORECAST_QUARTER)
            }
            className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-4 text-sm font-bold transition ${
              isForecast
                ? 'border-violet-400/80 bg-violet-500/30 text-violet-100 shadow-[0_0_14px_-3px_rgba(167,139,250,0.65)]'
                : 'border-violet-500/40 bg-violet-500/15 text-violet-200 hover:border-violet-400/65 hover:bg-violet-500/25'
            }`}
            title={isForecast ? '최신 실측 분기(2026Q3)로 돌아가기' : '2026Q4 다음 분기 예측 보기'}
          >
            <Sparkles className="h-4 w-4" />
            <span>{isForecast ? '실측 26Q3' : '26Q4 예측'}</span>
          </button>
        )}
      </div>
    </footer>
  );
}
