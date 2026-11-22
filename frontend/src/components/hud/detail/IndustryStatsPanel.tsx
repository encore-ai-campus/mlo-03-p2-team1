import { useMemo } from 'react';
import { INDUSTRY_META, INDUSTRY_ORDER } from '../../../config/industries';
import { getRegionQuarterTrend } from '../../../services/dashboardData';
import type { IndustryStatsMap, ModelName, QuarterValue } from '../../../types/dashboard';

interface IndustryStatsPanelProps {
  regionCode: string;
  selectedQuarter: QuarterValue;
  selectedModel: ModelName;
  industryStats: IndustryStatsMap;
  convenienceActiveCnt: number;
}

export function IndustryStatsPanel({
  regionCode,
  selectedQuarter,
  selectedModel,
  industryStats,
  convenienceActiveCnt,
}: IndustryStatsPanelProps) {
  const trend = useMemo(
    () => getRegionQuarterTrend(regionCode, selectedModel, selectedQuarter, 8),
    [regionCode, selectedModel, selectedQuarter],
  );

  const maxActive = Math.max(1, ...INDUSTRY_ORDER.map((key) => industryStats[key].activeCnt));
  const totalOpen = INDUSTRY_ORDER.reduce((sum, k) => sum + industryStats[k].openCnt, 0);
  const totalClose = INDUSTRY_ORDER.reduce((sum, k) => sum + industryStats[k].closeCnt, 0);
  const totalNet = totalOpen - totalClose;

  const maxFlow = Math.max(1, ...trend.map((pt) => Math.max(pt.totalOpenCnt, pt.totalCloseCnt)));

  return (
    <div className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-900/45 p-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-300">상권 6업종</span>
        <span className="font-mono text-[11px] text-slate-300">
          <span className="text-emerald-300">+{totalOpen}</span> /{' '}
          <span className="text-rose-300">-{totalClose}</span>{' '}
          <span className={totalNet >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
            ({totalNet >= 0 ? '+' : ''}
            {totalNet})
          </span>
        </span>
      </div>

      {/* 6 Industry Bars */}
      <div className="space-y-1.5">
        {INDUSTRY_ORDER.map((key) => {
          const meta = INDUSTRY_META[key];
          const stat = industryStats[key];
          const pct = Math.max(2, (stat.activeCnt / maxActive) * 100);
          return (
            <div key={key} className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  {meta.label}
                </span>
                <span className="font-mono text-[11px] text-slate-200">
                  {stat.activeCnt.toLocaleString()}
                  <span
                    className={`ml-1 text-[11px] ${
                      stat.netCnt > 0
                        ? 'text-emerald-400'
                        : stat.netCnt < 0
                          ? 'text-rose-400'
                          : 'text-slate-400'
                    }`}
                  >
                    ({stat.netCnt > 0 ? `+${stat.netCnt}` : stat.netCnt})
                  </span>
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800/90">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: meta.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 8-Quarter Open vs Close Mini Bar Chart */}
      <div className="border-t border-slate-800/80 pt-1.5">
        <div className="mb-1 flex items-center justify-between text-[8.5px] text-slate-400">
          <span>8분기 개·폐업</span>
          <span className="font-mono text-slate-500">편의점 {convenienceActiveCnt}</span>
        </div>
        <div className="flex h-10 items-end gap-1 pt-1">
          {trend.map((pt) => {
            const openH = Math.max(2, Math.round((pt.totalOpenCnt / maxFlow) * 30));
            const closeH = Math.max(2, Math.round((pt.totalCloseCnt / maxFlow) * 30));
            return (
              <div
                key={pt.quarter}
                title={`${pt.quarter}: 개업 +${pt.totalOpenCnt} / 폐업 -${pt.totalCloseCnt}`}
                className="flex flex-1 flex-col items-center gap-0.5"
              >
                <div className="flex w-full items-end justify-center gap-0.5">
                  <div
                    className="w-1.5 rounded-t bg-emerald-400/80"
                    style={{ height: `${openH}px` }}
                  />
                  <div
                    className="w-1.5 rounded-t bg-rose-400/75"
                    style={{ height: `${closeH}px` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-0.5 flex justify-between font-mono text-[8px] text-slate-500">
          <span>{trend[0]?.quarter}</span>
          <span>{trend[trend.length - 1]?.quarter}</span>
        </div>
      </div>
    </div>
  );
}
