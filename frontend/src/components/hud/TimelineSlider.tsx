import { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { YEAR_SUMMARIES } from '../../data/mockRegimes';
import { useDashboardStore } from '../../store/useDashboardStore';
import { TIMELINE_YEARS, type MarketRegime, type YearValue } from '../../types/dashboard';

import { quarterKey, type LiveMarket } from './useLiveMarket';

const REGIME_DOT_COLOR: Record<MarketRegime, string> = {
  BOOM: 'bg-amber-400',
  SLUMP: 'bg-blue-400',
  POLARIZATION: 'bg-rose-500',
};

const REGIME_ACTIVE_STYLE: Record<MarketRegime, string> = {
  BOOM: 'border-amber-400/70 bg-amber-500/20 text-amber-200 shadow-[0_0_16px_-4px_rgba(251,191,36,0.55)]',
  SLUMP: 'border-blue-400/70 bg-blue-500/20 text-blue-200 shadow-[0_0_16px_-4px_rgba(96,165,250,0.55)]',
  POLARIZATION:
    'border-rose-400/70 bg-rose-500/20 text-rose-200 shadow-[0_0_16px_-4px_rgba(244,63,94,0.55)]',
};

export function TimelineSlider({ market }: { market?: LiveMarket }) {
  const selectedYear = useDashboardStore((s) => s.selectedYear);
  const isPlaying = useDashboardStore((s) => s.isPlaying);
  const setSelectedYear = useDashboardStore((s) => s.setSelectedYear);
  const togglePlaying = useDashboardStore((s) => s.togglePlaying);
  const stepYear = useDashboardStore((s) => s.stepYear);

  const [playingPeriods, setPlayingPeriods] = useState(false);
  const periods = market?.periods ?? [];
  const periodIndex = periods.findIndex((item) => quarterKey(item) === market?.period);
  const playing = market ? playingPeriods : isPlaying;

  useEffect(() => {
    if (market) {
      if (!playingPeriods || periods.length < 2) return;
      const timer = window.setTimeout(() => {
        market.selectPeriod(quarterKey(periods[(periodIndex + 1) % periods.length]));
      }, 2200);
      return () => window.clearTimeout(timer);
    }
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      stepYear();
    }, 2200);
    return () => window.clearInterval(timer);
  }, [isPlaying, market, periodIndex, periods, playingPeriods, stepYear]);

  const activeIdx = market ? Math.max(0, periodIndex) : TIMELINE_YEARS.indexOf(selectedYear);
  const firstVisible = Math.max(0, Math.min(activeIdx - 3, periods.length - 7));

  return (
    <footer className="pointer-events-none fixed bottom-4 left-0 right-0 z-20 flex justify-center px-4">
      <div className="pointer-events-auto hud-glass flex w-full max-w-[740px] items-center gap-4 rounded-2xl px-4 py-3">
        <button
          type="button"
          onClick={market ? () => setPlayingPeriods(!playingPeriods) : togglePlaying}
          disabled={Boolean(market && periods.length < 2)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/15 text-cyan-200 transition hover:bg-cyan-500/25 hover:text-white"
          title={playing ? '타임라인 일시정지' : '타임라인 자동 재생'}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>

        <div className="flex-1 space-y-2">
          {/* Regime Phase Header */}
          <div className="grid grid-cols-7 gap-1.5">
            {market ? periods.slice(firstVisible, firstVisible + 7).map((item) => {
              const value = quarterKey(item);
              const active = value === market.period;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => market.selectPeriod(value)}
                  aria-pressed={active}
                  className={`flex flex-col items-center rounded-xl border px-1.5 py-1.5 transition ${
                    active ? 'border-cyan-400/70 bg-cyan-500/20 text-cyan-200' : 'border-slate-800/80 bg-slate-900/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="font-mono text-xs font-bold">{item.year} Q{item.quarter}</span>
                  <span className="mt-0.5 text-[9px]">{item.hasMarketPrices ? '실측' : item.hasPredictions ? '예측' : '관측'}</span>
                </button>
              );
            }) : TIMELINE_YEARS.map((year: YearValue) => {
              const summary = YEAR_SUMMARIES[year];
              const isActive = year === selectedYear;
              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(year)}
                  className={`flex flex-col items-center rounded-xl border px-1.5 py-1.5 transition ${
                    isActive
                      ? REGIME_ACTIVE_STYLE[summary.regime]
                      : 'border-slate-800/80 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${REGIME_DOT_COLOR[summary.regime]}`} />
                    <span className="font-mono text-xs font-bold">{year}</span>
                  </div>
                  <span className="mt-0.5 text-[9px] font-medium opacity-85">
                    {summary.regime === 'BOOM'
                      ? '동반상승'
                      : summary.regime === 'SLUMP'
                      ? '금리침체'
                      : '초양극화'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Interactive Scrubber */}
          <div className="relative flex items-center px-1">
            <input
              type="range"
              min={0}
              max={market ? Math.max(0, periods.length - 1) : TIMELINE_YEARS.length - 1}
              disabled={Boolean(market && periods.length < 2)}
              step={1}
              value={activeIdx}
              onChange={(e) => {
                const idx = Number(e.target.value);
                if (market) market.selectPeriod(quarterKey(periods[idx]));
                else setSelectedYear(TIMELINE_YEARS[idx]);
              }}
              aria-label={market ? "분기 타임라인 슬라이더" : "연도 타임라인 슬라이더"}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-cyan-400"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
