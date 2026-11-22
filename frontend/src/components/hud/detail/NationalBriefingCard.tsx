import { useMemo } from 'react';
import { BarChart3, ListOrdered } from 'lucide-react';
import { MODEL_META } from '../../../config/models';
import {
  getQuarterAccuracyBreakdown,
  getQuarterSggAccuracySummary,
  getQuarterSummary,
  getRecentAccuracyHistory,
  getSpotlightRegions,
} from '../../../services/dashboardData';
import { useDashboardStore } from '../../../store/useDashboardStore';
import type { AiAccuracyFilter, ModelName, QuarterValue } from '../../../types/dashboard';
import {
  formatSignedPctPoint,
  formatSignedPercent,
  isPredictionHit,
} from '../../../utils/formatters';
import { MapLegend } from './MapLegend';

interface NationalBriefingCardProps {
  selectedQuarter: QuarterValue;
  selectedModel: ModelName;
  comparisonMode: boolean;
  onSelectRegion: (regionCode: string) => void;
}

export function NationalBriefingCard({
  selectedQuarter,
  selectedModel,
  comparisonMode,
  onSelectRegion,
}: NationalBriefingCardProps) {
  const viewMode = useDashboardStore((s) => s.viewMode);
  const dataSource = useDashboardStore((s) => s.dataSource);
  const dataVersion = useDashboardStore((s) => s.dataVersion);
  const aiAccuracyFilter = useDashboardStore((s) => s.aiAccuracyFilter);
  const setAiAccuracyFilter = useDashboardStore((s) => s.setAiAccuracyFilter);
  const briefingTab = useDashboardStore((s) => s.briefingTab);
  const setBriefingTab = useDashboardStore((s) => s.setBriefingTab);

  const summary = getQuarterSummary(selectedQuarter);
  const modelMeta = MODEL_META[selectedModel];
  const isForecast = summary.periodType === 'forecast';
  const isAiEval = viewMode === 'error' && summary.periodType === 'eval';
  const isAiPredictMode = viewMode === 'error' && summary.periodType !== 'train';
  const showRatioView = isAiEval && briefingTab === 'ratio';

  const accuracy = useMemo(
    () => getQuarterAccuracyBreakdown(selectedQuarter, selectedModel),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedQuarter, selectedModel, dataVersion],
  );

  const accuracyHistory = useMemo(
    () => (isAiEval ? getRecentAccuracyHistory(selectedQuarter, selectedModel, 10) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAiEval, selectedQuarter, selectedModel, dataVersion],
  );

  const sggSummary = useMemo(
    () => (isAiEval ? getQuarterSggAccuracySummary(selectedQuarter, selectedModel) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAiEval, selectedQuarter, selectedModel, dataVersion],
  );

  const spotlightRegions = useMemo(
    () => getSpotlightRegions(selectedQuarter, selectedModel, 6, viewMode, aiAccuracyFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedQuarter, selectedModel, viewMode, aiAccuracyFilter, dataVersion],
  );

  const listTitle = isForecast
    ? `${modelMeta.shortLabel} 예측 TOP 6`
    : isAiEval
      ? aiAccuracyFilter === 'hit'
        ? '핵심 적중 TOP 6 (±2%p)'
        : aiAccuracyFilter === 'miss'
          ? '최대 오차 TOP 6 (>2%p)'
          : `${modelMeta.shortLabel} 예측 TOP 6`
      : '상승 핵심동 TOP 6';

  const accuracyTabs: { key: AiAccuracyFilter; label: string; count: number }[] = [
    { key: 'all', label: '전체', count: accuracy.evaluatedCount },
    { key: 'hit', label: '적중', count: accuracy.hitCount },
    { key: 'miss', label: '오차', count: accuracy.missCount },
  ];

  return (
    <aside
      aria-label="서울 시장 브리핑 및 3D 범례"
      className="pointer-events-auto fixed bottom-3 right-3 top-[76px] z-20 flex w-[272px] flex-col gap-3"
    >
      <div className="hud-glass flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden rounded-2xl p-3.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[13px] font-bold text-slate-100">
            {selectedQuarter} 브리핑
          </span>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-200">
            {summary.regimeLabel}
          </span>
        </div>

        {/* AI Eval Mode: 2-Tab Switcher (100% Success/Fail Bar vs TOP 6) */}
        {isAiEval ? (
          <div
            role="group"
            aria-label="브리핑 보기 전환"
            className="grid shrink-0 grid-cols-2 gap-1 rounded-xl border border-slate-800/80 bg-slate-900/60 p-1"
          >
            <button
              type="button"
              aria-pressed={briefingTab === 'ratio'}
              onClick={() => setBriefingTab('ratio')}
              className={`flex h-8 items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold transition ${
                briefingTab === 'ratio'
                  ? 'bg-emerald-500/20 text-emerald-100 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.5)]'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>성공/실패 100%</span>
            </button>
            <button
              type="button"
              aria-pressed={briefingTab === 'top6'}
              onClick={() => setBriefingTab('top6')}
              className={`flex h-8 items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold transition ${
                briefingTab === 'top6'
                  ? 'bg-cyan-500/20 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.5)]'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <ListOrdered className="h-3.5 w-3.5" />
              <span>예측 TOP 6</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-800/80 bg-slate-900/50 py-2 text-center font-mono">
            <div>
              <div className="text-[11px] text-slate-400">매매 관측</div>
              <div className="text-xs font-bold text-cyan-300">{summary.observedDongCount}동</div>
            </div>
            <div className="border-x border-slate-800/80">
              <div className="text-[11px] text-slate-400">
                {isForecast ? '예측 대상' : '거래 희소'}
              </div>
              <div className="text-xs font-bold text-amber-300">
                {isForecast ? `${summary.evaluatedDongCount}동` : `${summary.lowSampleDongCount}동`}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">미관측</div>
              <div className="text-xs font-bold text-slate-300">{summary.nonTradeDongCount}동</div>
            </div>
          </div>
        )}

        {showRatioView ? (
          <div className="flex min-h-0 flex-1 flex-col justify-between gap-2.5 border-t border-slate-800/80 pt-2.5">
            {/* Hero 100% Stacked Bar: Prediction Success vs Failure */}
            <div className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-base font-extrabold leading-none text-emerald-300">
                  <span>성공</span>
                  <span className="font-mono">{accuracy.hitCount}동</span>
                </div>
                <div className="flex items-center gap-1.5 text-base font-extrabold leading-none text-rose-300">
                  <span>실패</span>
                  <span className="font-mono">{accuracy.missCount}동</span>
                </div>
              </div>

              {/* 100% Horizontal Stacked Bar */}
              <div
                aria-label={`예측 성공 ${accuracy.hitRatePct.toFixed(1)}%, 실패 ${accuracy.missRatePct.toFixed(1)}%`}
                className="flex h-8 w-full overflow-hidden rounded-lg border border-slate-700/70 bg-slate-950 font-mono text-[11px] font-bold"
              >
                <div
                  className="flex items-center justify-center bg-emerald-500/85 text-slate-950 transition-all duration-300"
                  style={{ width: `${accuracy.hitRatePct}%` }}
                >
                  {accuracy.hitRatePct >= 20 ? `${accuracy.hitRatePct.toFixed(1)}%` : ''}
                </div>
                <div
                  className="flex items-center justify-center bg-rose-600 text-white transition-all duration-300"
                  style={{ width: `${accuracy.missRatePct}%` }}
                >
                  {accuracy.missRatePct >= 20 ? `${accuracy.missRatePct.toFixed(1)}%` : ''}
                </div>
              </div>

              <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
                <span>0%</span>
                <span>합계 100%</span>
                <span>100%</span>
              </div>
            </div>

            {/* SGG Accuracy Top 5 / Bottom 5 (stacked horizontal cards) */}
            {sggSummary && (
              <div className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-900/55 p-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-200">자치구별 적중률</span>
                  <span className="font-mono text-slate-400">25개 구</span>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="space-y-1 rounded-lg bg-slate-950/55 p-2">
                    <div className="font-sans text-[11px] font-semibold text-emerald-300">
                      정확 상위 5구
                    </div>
                    {sggSummary.topSggs.map((row) => (
                      <div key={row.sggName} className="flex items-center gap-2">
                        <span className="w-12 shrink-0 font-sans text-slate-200">
                          {row.sggName}
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-emerald-400/90"
                            style={{ width: `${row.hitRatePct}%` }}
                          />
                        </div>
                        <span className="w-8 shrink-0 text-right text-emerald-300">
                          {row.hitRatePct.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 rounded-lg bg-slate-950/55 p-2">
                    <div className="font-sans text-[11px] font-semibold text-amber-300">
                      오차 집중 5구
                    </div>
                    {sggSummary.bottomSggs.map((row) => (
                      <div key={row.sggName} className="flex items-center gap-2">
                        <span className="w-12 shrink-0 font-sans text-slate-200">
                          {row.sggName}
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-amber-400/90"
                            style={{ width: `${row.hitRatePct}%` }}
                          />
                        </div>
                        <span className="w-8 shrink-0 text-right text-amber-300">
                          {row.hitRatePct.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quarterly Synced 4-Band Tolerance 100% Stacked Bar Timeline (Recent 10Q) */}
            <div className="flex min-h-0 flex-1 flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/50 p-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300">분기별 오차 구간 100% 비중</span>
                <span className="font-mono text-cyan-300">{selectedQuarter}</span>
              </div>

              <div className="mt-1.5 grid min-h-[72px] flex-1 grid-cols-10 items-end overflow-hidden rounded-md border border-slate-800/70 bg-slate-950/45">
                {Array.from({ length: Math.max(0, 10 - accuracyHistory.length) }).map((_, idx) => (
                  <div key={`empty-${idx}`} aria-hidden="true" className="h-full w-full" />
                ))}
                {accuracyHistory.map((pt) => {
                  const isCurrent = pt.quarter === selectedQuarter;
                  return (
                    <div
                      key={pt.quarter}
                      title={`${pt.quarter}: 0~2%p ${pt.bandPcts['0_2'].toFixed(1)}% · 2~4%p ${pt.bandPcts['2_4'].toFixed(1)}% · 4~6%p ${pt.bandPcts['4_6'].toFixed(1)}% · 6%p+ ${pt.bandPcts['6_plus'].toFixed(1)}%`}
                      className="flex h-full flex-col items-center justify-end"
                    >
                      <div
                        className={`flex h-full w-full flex-col overflow-hidden transition-all duration-300 ${
                          isCurrent ? 'brightness-110' : 'opacity-90'
                        }`}
                      >
                        <div
                          className="w-full bg-rose-500 transition-all duration-300"
                          style={{ height: `${pt.bandPcts['6_plus']}%` }}
                        />
                        <div
                          className="w-full bg-amber-400 transition-all duration-300"
                          style={{ height: `${pt.bandPcts['4_6']}%` }}
                        />
                        <div
                          className="w-full bg-sky-400 transition-all duration-300"
                          style={{ height: `${pt.bandPcts['2_4']}%` }}
                        />
                        <div
                          className="w-full bg-emerald-500 transition-all duration-300"
                          style={{ height: `${pt.bandPcts['0_2']}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-slate-300">
                <span>{accuracyHistory[0]?.quarter ?? '—'}</span>
                <span className="text-cyan-300">{selectedQuarter}</span>
              </div>

              <div className="mt-1 flex items-center justify-between border-t border-slate-800/80 pt-1.5 font-mono text-[11px]">
                <span className="text-emerald-300">■ 0~2</span>
                <span className="text-sky-300">■ 2~4</span>
                <span className="text-amber-300">■ 4~6</span>
                <span className="text-rose-300">■ 6+</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col border-t border-slate-800/80 pt-2">
            {isAiEval && (
              <div
                role="group"
                aria-label="AI 예측 적중·오차 지도 필터"
                className="mb-2 grid shrink-0 grid-cols-3 gap-1"
              >
                {accuracyTabs.map((tab) => {
                  const active = aiAccuracyFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setAiAccuracyFilter(tab.key)}
                      className={`flex h-8 items-center justify-center rounded-lg border text-[11px] font-semibold transition ${
                        active
                          ? tab.key === 'hit'
                            ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100'
                            : tab.key === 'miss'
                              ? 'border-amber-400/60 bg-amber-500/20 text-amber-100'
                              : 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mb-1.5 flex shrink-0 items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              <span>{listTitle}</span>
              <span className="text-cyan-300">클릭 포커스</span>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              {spotlightRegions.map((r) => {
                const pred = r.predictions?.[selectedModel] ?? null;
                const primaryRate =
                  isForecast || isAiPredictMode ? (pred?.predictedGrowth ?? null) : r.actualGrowth;
                const err = pred?.error ?? null;
                const isMissTab = isAiEval && aiAccuracyFilter === 'miss';

                return (
                  <button
                    key={r.regionCode}
                    type="button"
                    onClick={() => onSelectRegion(r.regionCode)}
                    className="flex w-full flex-1 items-center justify-between rounded-xl border border-slate-800/90 bg-slate-900/60 px-3 py-1 text-left transition hover:border-cyan-400/50 hover:bg-slate-800/75"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[13px] font-bold text-slate-100">
                          {r.regionName}
                        </span>
                        {r.lowSampleYn && (
                          <span className="rounded bg-amber-500/20 px-1 py-0.5 text-[11px] text-amber-300">
                            희소
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400">{r.sggName}</div>
                    </div>
                    <div className="shrink-0 text-right font-mono">
                      {isMissTab && err !== null ? (
                        <>
                          <div className="text-[13px] font-bold text-amber-300">
                            {formatSignedPctPoint(err, 1)}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-300">
                            실{' '}
                            {r.actualGrowth !== null ? formatSignedPercent(r.actualGrowth, 1) : '—'}{' '}
                            · {err > 0 ? '과소' : '과대'}
                          </div>
                        </>
                      ) : (
                        <>
                          <div
                            className={`text-[13px] font-bold ${
                              (primaryRate ?? 0) >= 0 ? 'text-red-400' : 'text-blue-400'
                            }`}
                          >
                            {primaryRate !== null ? formatSignedPercent(primaryRate, 1) : '—'}
                          </div>
                          {isForecast ? (
                            <div className="mt-0.5 text-[11px] text-slate-300">
                              {pred?.predPricePerSqm
                                ? `${pred.predPricePerSqm.toLocaleString()}만`
                                : '—'}
                            </div>
                          ) : isAiPredictMode && r.actualGrowth !== null ? (
                            <div className="mt-0.5 text-[11px] text-slate-300">
                              실 {formatSignedPercent(r.actualGrowth, 1)}
                              {err !== null && (
                                <span
                                  className={`ml-1 ${
                                    isPredictionHit(err) ? 'text-emerald-300' : 'text-amber-300'
                                  }`}
                                >
                                  ({formatSignedPctPoint(err, 1)})
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="mt-0.5 text-[11px] text-slate-300">
                              거래 {r.tradeCnt}건
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isAiEval && (
          <div className="flex shrink-0 items-center justify-between border-t border-slate-800/80 pt-2 font-mono text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              {dataSource === 'postgres' && (
                <span
                  title="PostgreSQL 실데이터 연동 중"
                  className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"
                />
              )}
              {dataSource === 'postgres' ? 'PostgreSQL · 467동' : 'Gold 467동 · 39분기'}
            </span>
            <span className="text-emerald-300">611,300건</span>
          </div>
        )}
      </div>

      {!isAiEval && <MapLegend comparisonMode={comparisonMode} />}
    </aside>
  );
}
