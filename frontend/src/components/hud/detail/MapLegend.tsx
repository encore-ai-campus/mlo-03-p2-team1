import { getQuarterSummary } from '../../../services/dashboardData';
import { useDashboardStore } from '../../../store/useDashboardStore';

interface MapLegendProps {
  comparisonMode: boolean;
}

export function MapLegend({ comparisonMode }: MapLegendProps) {
  const viewMode = useDashboardStore((s) => s.viewMode);
  const selectedQuarter = useDashboardStore((s) => s.selectedQuarter);
  const summary = getQuarterSummary(selectedQuarter);
  const isForecast = summary.periodType === 'forecast';
  const showToleranceLegend = viewMode === 'error' && !isForecast;
  const isAiMode = viewMode === 'error' || isForecast;

  return (
    <div className="hud-glass shrink-0 space-y-2.5 rounded-2xl p-3.5 text-[11px]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
          3D 시각화 범례
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
            showToleranceLegend
              ? 'bg-emerald-500/20 text-emerald-200'
              : isAiMode
                ? 'bg-cyan-500/20 text-cyan-200'
                : 'bg-red-500/20 text-red-200'
          }`}
        >
          {showToleranceLegend ? '허용치 구간' : isAiMode ? 'AI 예측 시세' : '실제 시세'}
        </span>
      </div>

      {showToleranceLegend ? (
        <>
          <div className="space-y-1">
            <div className="text-[11px] text-slate-300">지형 색상 (예측 오차 허용치 구간)</div>
            <div className="grid h-2 w-full grid-cols-4 gap-0.5 overflow-hidden rounded-full">
              <span className="bg-emerald-500" />
              <span className="bg-sky-400" />
              <span className="bg-amber-400" />
              <span className="bg-rose-500" />
            </div>
            <div className="grid grid-cols-4 text-center font-mono text-[11px]">
              <span className="text-emerald-300">0~2</span>
              <span className="text-sky-300">2~4</span>
              <span className="text-amber-300">4~6</span>
              <span className="text-rose-300">6+</span>
            </div>
          </div>

          <div className="space-y-1 border-t border-slate-800/80 pt-2 text-[11px] text-slate-200">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                0~2%p 성공
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-sky-400" />
                2~4%p 허용
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
                4~6%p 주의
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
                6%p+ 이탈
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1">
            <div className="text-[11px] text-slate-300">
              지형 색상 (
              {isAiMode
                ? 'AI 예측 변화율'
                : comparisonMode
                  ? '2021 동분기 대비'
                  : '실제 분기 변화율'}
              )
            </div>
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#2563eb] via-[#182235] to-[#ef4444]" />
            <div className="flex justify-between font-mono text-[11px] text-slate-400">
              <span className="text-blue-300">
                {comparisonMode && !isAiMode ? '-15%p' : '-10% 하락'}
              </span>
              <span>0%</span>
              <span className="text-red-300">
                {comparisonMode && !isAiMode ? '+10%p' : '+12% 상승'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-800/80 pt-2 text-[11px] text-slate-200">
            {viewMode === 'market' ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-gradient-to-r from-blue-500 to-red-500 shadow-[0_0_6px_#ef4444]" />
                  <span>
                    3D 기둥 (+Y):{' '}
                    {isForecast ? 'AI 예측 ㎡당 매매가' : '㎡당 매매가 (빨강 상승 · 파랑 하락)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm border border-slate-600 bg-[#0d1526]" />
                  <span>
                    {isForecast ? '다크 톤: 예측 제외 동 (246동)' : '다크 톤: 매매 미관측 (129동)'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-gradient-to-r from-blue-500 to-red-500 shadow-[0_0_6px_#ef4444]" />
                  <span>예측 히트맵: 2026Q4 상승(빨강) · 하락(파랑)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm border border-slate-600 bg-[#0d1526]" />
                  <span>다크 톤: 예측 제외 동 (246동)</span>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono text-[11px] text-slate-300">
        <span>Gold 467동 · 39분기</span>
        <span className="text-emerald-300">611,300건</span>
      </div>
    </div>
  );
}
