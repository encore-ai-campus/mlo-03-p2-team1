import { useMemo } from 'react';
import { getRegionQuarterRecord, getRegionQuarterTrend } from '../../../services/dashboardData';
import {
  FORECAST_QUARTER,
  LATEST_OBSERVED_QUARTER,
  type ModelName,
  type QuarterValue,
} from '../../../types/dashboard';

interface PriceIndexSparklineProps {
  regionCode: string;
  selectedQuarter: QuarterValue;
  selectedModel: ModelName;
  hasObservedTradeYn: boolean;
}

const SVG_W = 196;
const SVG_H = 56;
const PAD_X = 4;
const PAD_TOP = 8;
const PAD_BOTTOM = 14;

export function PriceIndexSparkline({
  regionCode,
  selectedQuarter,
  selectedModel,
  hasObservedTradeYn,
}: PriceIndexSparklineProps) {
  const { points, forecastPoint, minVal, maxVal, latestObservedVal } = useMemo(() => {
    const raw = getRegionQuarterTrend(regionCode, selectedModel, selectedQuarter, 12);

    // If viewing 2026Q3, append 2026Q4 forecast point so users immediately see the next-quarter outlook
    let extraForecast: { quarter: QuarterValue; value: number } | null = null;
    if (selectedQuarter === LATEST_OBSERVED_QUARTER) {
      const nextRec = getRegionQuarterRecord(FORECAST_QUARTER, regionCode);
      const nextIdx = nextRec?.predictions?.[selectedModel].predPriceIdx ?? null;
      if (nextIdx !== null) {
        extraForecast = { quarter: FORECAST_QUARTER, value: nextIdx };
      }
    }

    const baseSeries = raw.map((pt) => ({
      quarter: pt.quarter,
      observed: pt.priceIdx,
      forecast: pt.quarter === FORECAST_QUARTER ? pt.predPriceIdx : null,
    }));

    if (extraForecast) {
      baseSeries.push({
        quarter: extraForecast.quarter,
        observed: null,
        forecast: extraForecast.value,
      });
    }

    const numericVals: number[] = [];
    for (const p of baseSeries) {
      if (p.observed !== null) numericVals.push(p.observed);
      if (p.forecast !== null) numericVals.push(p.forecast);
    }

    const minV = numericVals.length > 0 ? Math.min(...numericVals) : 95;
    const maxV = numericVals.length > 0 ? Math.max(...numericVals) : 105;
    const pad = Math.max(1.5, (maxV - minV) * 0.14);

    let lastObs: number | null = null;
    for (let i = baseSeries.length - 1; i >= 0; i--) {
      if (baseSeries[i].observed !== null) {
        lastObs = baseSeries[i].observed;
        break;
      }
    }

    const lastForecast =
      baseSeries.length > 0 && baseSeries[baseSeries.length - 1].forecast !== null
        ? {
            quarter: baseSeries[baseSeries.length - 1].quarter,
            value: baseSeries[baseSeries.length - 1].forecast as number,
          }
        : null;

    return {
      points: baseSeries,
      forecastPoint: lastForecast,
      minVal: minV - pad,
      maxVal: maxV + pad,
      latestObservedVal: lastObs,
    };
  }, [regionCode, selectedQuarter, selectedModel]);

  if (!hasObservedTradeYn || latestObservedVal === null) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/45 p-2">
        <div className="text-[10px] font-semibold text-slate-300">가격 지수</div>
        <div className="mt-0.5 text-[9.5px] text-slate-500">관측 지수 없음</div>
      </div>
    );
  }

  const plotW = SVG_W - PAD_X * 2;
  const plotH = SVG_H - PAD_TOP - PAD_BOTTOM;
  const span = Math.max(1e-3, maxVal - minVal);
  const stepX = points.length > 1 ? plotW / (points.length - 1) : 0;

  const toX = (idx: number) => PAD_X + idx * stepX;
  const toY = (val: number) => PAD_TOP + ((maxVal - val) / span) * plotH;

  // Build observed polyline path segments (handling occasional null quarters cleanly)
  const observedPathParts: string[] = [];
  let lastObservedCoord: { x: number; y: number } | null = null;
  let inSegment = false;

  for (let idx = 0; idx < points.length; idx++) {
    const pt = points[idx];
    if (pt.observed !== null) {
      const x = toX(idx);
      const y = toY(pt.observed);
      observedPathParts.push(`${inSegment ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`);
      lastObservedCoord = { x, y };
      inSegment = true;
    } else {
      inSegment = false;
    }
  }

  const observedPath = observedPathParts.join(' ');
  const forecastIdx = points.findIndex((p) => p.forecast !== null);
  const forecastCoord =
    forecastIdx >= 0 && points[forecastIdx].forecast !== null
      ? { x: toX(forecastIdx), y: toY(points[forecastIdx].forecast as number) }
      : null;

  const firstQuarter = points[0]?.quarter ?? '';
  const lastQuarter = points[points.length - 1]?.quarter ?? '';

  return (
    <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-900/45 p-2.5">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] font-semibold text-slate-300">가격 지수</span>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="text-cyan-300">{latestObservedVal.toFixed(1)}</span>
          {forecastPoint && (
            <span className="text-violet-300">→ {forecastPoint.value.toFixed(1)}</span>
          )}
        </div>
      </div>

      <svg
        width="100%"
        height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="overflow-visible"
      >
        {/* Reference midline */}
        <line
          x1={PAD_X}
          y1={PAD_TOP + plotH * 0.5}
          x2={SVG_W - PAD_X}
          y2={PAD_TOP + plotH * 0.5}
          stroke="rgba(148,163,184,0.14)"
          strokeDasharray="2 3"
          strokeWidth={1}
        />

        {/* Observed line */}
        {observedPath && (
          <path
            d={observedPath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Dashed forecast extension */}
        {lastObservedCoord && forecastCoord && (
          <line
            x1={lastObservedCoord.x}
            y1={lastObservedCoord.y}
            x2={forecastCoord.x}
            y2={forecastCoord.y}
            stroke="#a78bfa"
            strokeWidth={1.6}
            strokeDasharray="3 2.5"
          />
        )}

        {/* Observed endpoint dot */}
        {lastObservedCoord && (
          <circle
            cx={lastObservedCoord.x}
            cy={lastObservedCoord.y}
            r={2.5}
            fill="#38bdf8"
            stroke="#0f172a"
            strokeWidth={1}
          />
        )}

        {/* Forecast dot */}
        {forecastCoord && (
          <circle
            cx={forecastCoord.x}
            cy={forecastCoord.y}
            r={3}
            fill="#a78bfa"
            stroke="#0f172a"
            strokeWidth={1}
          />
        )}

        {/* Quarter range labels */}
        <text x={PAD_X} y={SVG_H - 2} fill="#64748b" fontSize={8.5} fontFamily="monospace">
          {firstQuarter}
        </text>
        <text
          x={SVG_W - PAD_X}
          y={SVG_H - 2}
          textAnchor="end"
          fill={forecastCoord ? '#c4b5fd' : '#64748b'}
          fontSize={8.5}
          fontFamily="monospace"
        >
          {lastQuarter}
        </text>
      </svg>
    </div>
  );
}
