import { Activity, Layers, Leaf, RotateCcw, TrendingUp } from 'lucide-react';
import { YEAR_SUMMARIES } from '../../data/mockRegimes';
import { useDashboardStore } from '../../store/useDashboardStore';

import type { LiveMarket } from './useLiveMarket';

const REGIME_STYLES = {
  BOOM: {
    pill: 'bg-amber-500/15 text-amber-300 border-amber-400/35',
    dot: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
  },
  SLUMP: {
    pill: 'bg-blue-500/15 text-blue-300 border-blue-400/35',
    dot: 'bg-blue-400 shadow-[0_0_8px_#60a5fa]',
  },
  POLARIZATION: {
    pill: 'bg-rose-500/15 text-rose-300 border-rose-400/35',
    dot: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]',
  },
} as const;

export function TopStatusBar({ market }: { market?: LiveMarket }) {
  const selectedYear = useDashboardStore((s) => s.selectedYear);
  const comparisonMode = useDashboardStore((s) => s.comparisonMode);
  const geoStatus = useDashboardStore((s) => s.geoStatus);
  const ecoMode = useDashboardStore((s) => s.ecoMode);
  const toggleForceFallbackGeo = useDashboardStore((s) => s.toggleForceFallbackGeo);
  const toggleEcoMode = useDashboardStore((s) => s.toggleEcoMode);
  const triggerCameraReset = useDashboardStore((s) => s.triggerCameraReset);

  const summary = YEAR_SUMMARIES[selectedYear];
  const regimeStyle = market
    ? { pill: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/35', dot: 'bg-cyan-400' }
    : REGIME_STYLES[summary.regime];
  const regions = market ? [...market.byDistrict.values()].flat() : [];
  const validated = regions.filter(({ predictionKind, predictedRise, actualGrowthPct }) =>
    predictionKind === 'holdout' && predictedRise !== null && actualGrowthPct !== null);
  const hits = validated.filter(({ predictedRise, actualGrowthPct }) => predictedRise === (actualGrowthPct! > 0)).length;
  const growth = regions.flatMap(({ actualGrowthPct }) => actualGrowthPct === null ? [] : [actualGrowthPct]);
  const average = growth.length ? `${(growth.reduce((sum, value) => sum + value, 0) / growth.length).toFixed(1)}%` : '—';

  return (
    <header className="pointer-events-none fixed top-0 left-0 right-0 z-20 flex items-center justify-between gap-2 px-4 py-3">
      {/* Brand & Regime */}
      <div className="pointer-events-auto hud-glass flex items-center gap-3 rounded-2xl px-3.5 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/25 to-rose-500/25 border border-white/10">
            <Activity className="h-4 w-4 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-slate-100 whitespace-nowrap">
                KOREA APT MLOps
              </h1>
              <span className="hidden xl:inline-block rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-cyan-300">
                {market ? `자료 ${market.byDistrict.size}개 자치구` : '229 시·군·구'}
              </span>
            </div>
            <p className="hidden 2xl:block text-[11px] text-slate-400">
              {market ? '서울 아파트 실거래 및 가격 상승 예측' : 'm²당 가격 예측 오차 및 5대 입지 영향력 3D 모니터'}
            </p>
          </div>
        </div>

        <div className="h-7 w-px bg-slate-700/60" />

        <div className="flex items-center gap-2.5">
          <span className="font-mono text-lg font-bold text-white">{market ? market.period.replace('-', ' Q') || '—' : selectedYear}</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${regimeStyle.pill}`}
          >
            <span className={`h-2 w-2 rounded-full ${regimeStyle.dot}`} />
            {market ? (market.error ? 'API 오류' : market.loading ? '불러오는 중' : 'API 데이터') : summary.regimeLabel}
          </span>
          {!market && comparisonMode && (
            <span className="rounded-full border border-cyan-400/30 bg-cyan-500/15 px-2.5 py-1 text-[11px] font-medium text-cyan-300">
              vs 2021 비교 중
            </span>
          )}
        </div>
      </div>

      {/* KPI Metrics & Controls */}
      <div className="pointer-events-auto hud-glass flex items-center gap-4 rounded-2xl px-4 py-2">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-slate-400">
            {market ? '상승 방향 적중률' : '모델 적중률 (±2%p)'}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-base font-bold text-cyan-300">
              {market ? (validated.length ? `${(100 * hits / validated.length).toFixed(1)}%` : '—') : `${summary.hitRatePct.toFixed(1)}%`}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {market ? `검증 ${validated.length}건` : `MAE ${summary.mae.toFixed(1)}%p`}
            </span>
          </div>
        </div>

        <div className="h-7 w-px bg-slate-700/60" />

        <div className="flex flex-col">
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400">
            <TrendingUp className="h-3 w-3 text-rose-400" />
            양극화 지수 (상·하 10% 격차)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`font-mono text-base font-bold ${
                market ? 'text-slate-400'
                  : summary.polarizationIndex >= 18
                  ? 'text-rose-400'
                  : summary.polarizationIndex >= 11
                  ? 'text-amber-300'
                  : 'text-emerald-300'
              }`}
            >
              {market ? '—' : `${summary.polarizationIndex.toFixed(1)}%p`}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              평균 {market ? average : `${summary.avgActualGrowth >= 0 ? '+' : ''}${summary.avgActualGrowth.toFixed(1)}%`}
            </span>
          </div>
        </div>

        <div className="h-7 w-px bg-slate-700/60" />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleEcoMode}
            title="절전 모드: Bloom 해제·DPR 1.0·저전력 프레임으로 노트북 발열/팬 소음 최소화"
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
              ecoMode
                ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                : 'border-slate-700/80 bg-slate-900/60 text-slate-300 hover:border-slate-500 hover:text-white'
            }`}
          >
            <Leaf className={`h-3.5 w-3.5 ${ecoMode ? 'text-emerald-300' : 'text-slate-400'}`} />
            <span>{ecoMode ? '절전 ON' : '절전'}</span>
          </button>

          <button
            type="button"
            onClick={toggleForceFallbackGeo}
            title="외부 TopoJSON / 오프라인 Fallback 다각형 전환 테스트"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/60 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>
              {geoStatus === 'loading'
                ? '지형 로딩...'
                : geoStatus === 'topojson'
                ? 'KOSTAT 지도'
                : 'Fallback 그리드'}
            </span>
          </button>

          <button
            type="button"
            onClick={triggerCameraReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/60 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:text-cyan-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>전체 시점</span>
          </button>
        </div>
      </div>
    </header>
  );
}
