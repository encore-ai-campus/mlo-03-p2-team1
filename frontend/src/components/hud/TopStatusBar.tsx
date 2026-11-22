import { Activity, Layers, Leaf, RotateCcw } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';

export function TopStatusBar() {
  const viewMode = useDashboardStore((s) => s.viewMode);
  const geoStatus = useDashboardStore((s) => s.geoStatus);
  const ecoMode = useDashboardStore((s) => s.ecoMode);
  const setViewMode = useDashboardStore((s) => s.setViewMode);
  const toggleForceFallbackGeo = useDashboardStore((s) => s.toggleForceFallbackGeo);
  const toggleEcoMode = useDashboardStore((s) => s.toggleEcoMode);
  const triggerCameraReset = useDashboardStore((s) => s.triggerCameraReset);

  const geoLabel =
    geoStatus === 'loading'
      ? '로딩...'
      : geoStatus === 'geojson'
        ? '서울 법정동 지도'
        : 'Fallback 그리드';

  return (
    <header className="pointer-events-none fixed left-0 right-0 top-0 z-20 flex items-center justify-between gap-2 px-3 pt-3">
      {/* Brand (272px aligned with LeftFilterPanel) */}
      <div className="pointer-events-auto hud-glass flex h-[52px] w-[272px] items-center justify-start gap-2.5 rounded-2xl px-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-cyan-500/25 to-rose-500/25">
          <Activity className="h-4 w-4 text-cyan-300" />
        </div>
        <h1 className="whitespace-nowrap text-base font-extrabold tracking-tight text-slate-100">
          SEOUL APT MLOps
        </h1>
      </div>

      {/* Center Hero View Mode Switch: Market vs AI Prediction */}
      <div
        role="group"
        aria-label="3D 지도 시각화 모드"
        className="pointer-events-auto hud-glass flex h-[52px] items-center gap-1.5 rounded-2xl p-1.5"
      >
        <button
          type="button"
          aria-pressed={viewMode === 'market'}
          onClick={() => setViewMode('market')}
          className={`h-10 rounded-xl px-7 text-sm font-bold tracking-tight transition ${
            viewMode === 'market'
              ? 'border border-red-400/55 bg-red-500/20 text-red-100 shadow-[0_0_16px_-4px_rgba(239,68,68,0.55)]'
              : 'border border-transparent text-slate-300 hover:bg-slate-800/70 hover:text-white'
          }`}
        >
          실제 시세
        </button>
        <button
          type="button"
          aria-pressed={viewMode === 'error'}
          onClick={() => setViewMode('error')}
          className={`h-10 rounded-xl px-7 text-sm font-bold tracking-tight transition ${
            viewMode === 'error'
              ? 'border border-cyan-400/60 bg-cyan-500/20 text-cyan-100 shadow-[0_0_16px_-4px_rgba(34,211,238,0.6)]'
              : 'border border-transparent text-slate-300 hover:bg-slate-800/70 hover:text-white'
          }`}
        >
          AI 예측 시세
        </button>
      </div>

      {/* Controls (272px aligned with Right Briefing Panel) */}
      <div className="pointer-events-auto hud-glass flex h-[52px] w-[272px] items-center justify-between gap-1 rounded-2xl px-1.5">
        <button
          type="button"
          aria-pressed={ecoMode}
          onClick={toggleEcoMode}
          title="절전 모드: Bloom 해제·DPR 1.0·저전력 프레임으로 노트북 발열/팬 소음 최소화"
          className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border px-2 text-[11px] font-medium transition ${
            ecoMode
              ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
              : 'border-slate-700/80 bg-slate-900/60 text-slate-200 hover:border-slate-500 hover:text-white'
          }`}
        >
          <Leaf className={`h-3.5 w-3.5 ${ecoMode ? 'text-emerald-300' : 'text-slate-400'}`} />
          <span>{ecoMode ? '절전' : '절전'}</span>
        </button>

        <button
          type="button"
          aria-pressed={geoStatus === 'fallback'}
          onClick={toggleForceFallbackGeo}
          title="서울 법정동 GeoJSON / Fallback 다각형 전환 테스트"
          className="inline-flex h-8 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900/60 px-2 text-[11px] font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
        >
          <Layers className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
          <span className="truncate">{geoLabel}</span>
        </button>

        <button
          type="button"
          onClick={triggerCameraReset}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900/60 px-2 text-[11px] font-medium text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:text-cyan-200"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>전체 시점</span>
        </button>
      </div>
    </header>
  );
}
