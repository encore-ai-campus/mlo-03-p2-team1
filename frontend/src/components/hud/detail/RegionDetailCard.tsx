import { AlertTriangle, ArrowDownRight, ArrowUpRight, MapPin, Sparkles, X } from 'lucide-react';
import { MODEL_META } from '../../../config/models';
import { getQuarterSummary, getRegionComparisonDelta } from '../../../services/dashboardData';
import type { ModelName, QuarterValue, RegionQuarterRecord } from '../../../types/dashboard';
import {
  classifyError,
  formatSignedPctPoint,
  formatSignedPercent,
  type ErrorDirection,
} from '../../../utils/formatters';
import { GrowthBarRow } from './GrowthBarRow';
import { IndustryStatsPanel } from './IndustryStatsPanel';
import { MapLegend } from './MapLegend';
import { PriceIndexSparkline } from './PriceIndexSparkline';

const ERROR_PRESENTATION: Record<
  ErrorDirection,
  { badgeClass: string; textClass: string; label: string }
> = {
  hit: {
    badgeClass: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300',
    textClass: 'text-emerald-300',
    label: '적중 (±2%p)',
  },
  underpredicted: {
    badgeClass: 'border-amber-400/40 bg-amber-500/15 text-amber-300',
    textClass: 'text-amber-300',
    label: '실제가 더 높음',
  },
  overpredicted: {
    badgeClass: 'border-red-400/40 bg-red-500/15 text-red-300',
    textClass: 'text-red-400',
    label: '예측이 더 높음',
  },
};

interface RegionDetailCardProps {
  record: RegionQuarterRecord;
  selectedQuarter: QuarterValue;
  selectedModel: ModelName;
  isPinned: boolean;
  comparisonMode: boolean;
  onClearSelection: () => void;
}

export function RegionDetailCard({
  record,
  selectedQuarter,
  selectedModel,
  isPinned,
  comparisonMode,
  onClearSelection,
}: RegionDetailCardProps) {
  const summary = getQuarterSummary(selectedQuarter);
  const modelMeta = MODEL_META[selectedModel];
  const isForecast = summary.periodType === 'forecast';
  const modelPred = record.predictions?.[selectedModel] ?? null;
  const err = modelPred?.error ?? null;
  const errorKind = err !== null ? classifyError(err) : null;
  const errorStyle = errorKind ? ERROR_PRESENTATION[errorKind] : null;
  const compDelta = comparisonMode
    ? getRegionComparisonDelta(record.regionCode, selectedQuarter)
    : null;

  return (
    <aside
      aria-label="선택 법정동 상세 정보 및 3D 범례"
      className="pointer-events-auto fixed bottom-3 right-3 top-[76px] z-20 flex w-[272px] flex-col gap-3"
    >
      <div className="hud-glass flex min-h-0 flex-1 flex-col justify-between gap-2.5 overflow-y-auto rounded-2xl p-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <MapPin className="h-3 w-3 shrink-0 text-cyan-400" />
              <span className="truncate">{record.sggName}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <h2 className="truncate text-base font-bold tracking-tight text-white">
                {record.regionName}
              </h2>
              {!record.hasObservedTradeYn && (
                <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-300">
                  미관측
                </span>
              )}
              {record.hasObservedTradeYn && record.lowSampleYn && !isForecast && (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-amber-500/20 px-1.5 py-0.5 text-[11px] text-amber-200">
                  <AlertTriangle className="h-3 w-3" />
                  희소
                </span>
              )}
              {isForecast && (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-violet-500/20 px-1.5 py-0.5 text-[11px] text-violet-200">
                  <Sparkles className="h-3 w-3" />
                  예측
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {isPinned && (
              <button
                type="button"
                aria-label="선택 해제"
                onClick={onClearSelection}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
                title="선택 해제"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Price per Sqm & Trade Count */}
        <div className="flex items-end justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 px-2.5 py-2">
          <div>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
              <span>{selectedQuarter}</span>
              {!isForecast && record.hasObservedTradeYn && (
                <span className="rounded bg-slate-800 px-1 font-mono text-[8.5px] text-slate-300">
                  {record.tradeCnt}건
                </span>
              )}
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-white">
              {isForecast ? (
                modelPred?.predPricePerSqm != null ? (
                  <>
                    {modelPred.predPricePerSqm.toLocaleString()}
                    <span className="ml-0.5 text-[9.5px] font-normal text-violet-300">만/m²</span>
                  </>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400">예측 제외</span>
                )
              ) : record.pricePerSqm != null ? (
                <>
                  {record.pricePerSqm.toLocaleString()}
                  <span className="ml-0.5 text-[9.5px] font-normal text-slate-400">만/m²</span>
                </>
              ) : (
                <span className="text-[11px] font-medium text-slate-400">거래 없음</span>
              )}
            </div>
          </div>

          {compDelta && compDelta.priceDeltaPct !== null && (
            <div className="text-right">
              <div className="text-[8.5px] text-slate-400">vs 21Q{summary.quarterNum}</div>
              <div
                className={`inline-flex items-center font-mono text-[10.5px] font-semibold ${
                  compDelta.priceDeltaPct >= 0 ? 'text-amber-300' : 'text-blue-300'
                }`}
              >
                {compDelta.priceDeltaPct >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {formatSignedPercent(compDelta.priceDeltaPct, 1)}
              </div>
            </div>
          )}
        </div>

        {/* Actual vs Predicted Comparison */}
        <div className="space-y-1.5 rounded-xl border border-slate-800/80 bg-slate-900/45 p-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-300">
              {isForecast ? `${modelMeta.shortLabel} 예측` : '실제 vs 예측'}
            </span>
            {errorStyle ? (
              <span
                className={`rounded-full border px-1.5 py-0.5 text-[8.5px] font-semibold ${errorStyle.badgeClass}`}
              >
                {errorStyle.label}
              </span>
            ) : (
              <span className="rounded-full bg-slate-800/80 px-1.5 py-0.5 text-[8.5px] text-slate-400">
                {isForecast ? '대기' : summary.periodType === 'train' ? '학습' : '제외'}
              </span>
            )}
          </div>

          {record.actualGrowth !== null && (
            <GrowthBarRow
              label="실제"
              value={record.actualGrowth}
              maxAbs={14}
              barColor={record.actualGrowth >= 0 ? '#f97316' : '#3b82f6'}
            />
          )}

          {modelPred && (
            <GrowthBarRow
              label={modelMeta.shortLabel}
              value={modelPred.predictedGrowth}
              maxAbs={14}
              barColor={isForecast ? '#a78bfa' : '#94a3b8'}
            />
          )}

          {record.actualGrowth === null && !modelPred && (
            <div className="text-[9.5px] text-slate-400">표본·예측 데이터 없음</div>
          )}

          {err !== null && errorStyle && (
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-1 text-[10.5px]">
              <span className="text-slate-400">오차</span>
              <span className={`font-mono font-bold ${errorStyle.textClass}`}>
                {formatSignedPctPoint(err, 2)}
              </span>
            </div>
          )}
        </div>

        {/* Same-Complex Price Index Trend + Next Quarter Forecast */}
        <PriceIndexSparkline
          regionCode={record.regionCode}
          selectedQuarter={selectedQuarter}
          selectedModel={selectedModel}
          hasObservedTradeYn={record.hasObservedTradeYn}
        />

        {/* Gold 6 Commercial License Industry Stats + Open/Close Trend */}
        <IndustryStatsPanel
          regionCode={record.regionCode}
          selectedQuarter={selectedQuarter}
          selectedModel={selectedModel}
          industryStats={record.industryStats}
          convenienceActiveCnt={record.convenienceActiveCnt}
        />
      </div>

      <MapLegend comparisonMode={comparisonMode} />
    </aside>
  );
}
