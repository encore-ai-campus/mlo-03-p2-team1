import { INDUSTRY_ORDER } from '../config/industries';
import {
  QUARTER_SUMMARIES,
  REGIME_DATA_BY_QUARTER,
  REGIME_MAP_BY_QUARTER,
  TOP_10_CODES_BY_QUARTER,
} from '../data/mockRegimes';
import {
  SEOUL_JOB_FLOW_LINKS,
  SEOUL_REGIONS_META,
  SEOUL_REGIONS_META_MAP,
  SEOUL_TRANSIT_CORRIDORS,
} from '../data/seoulRegionsMeta';
import {
  TIMELINE_QUARTERS,
  type AiAccuracyFilter,
  type ComparisonDelta,
  type ErrorToleranceBand,
  type FacilityHubLink,
  type FacilityKey,
  type IndustryKey,
  type MapViewMode,
  type ModelName,
  type QuarterSummaryMetrics,
  type QuarterValue,
  type RegionMeta,
  type RegionQuarterRecord,
  type RegionQuarterTrendPoint,
  type TransitCorridor,
} from '../types/dashboard';
import { isPredictionHit } from '../utils/formatters';

interface DashboardBootstrapApiPayload {
  source: 'postgres';
  modelVersion: string;
  quarters: QuarterValue[];
  recordsByQuarter: Record<QuarterValue, RegionQuarterRecord[]>;
  summaries: Record<QuarterValue, QuarterSummaryMetrics>;
  top10CodesByQuarter: Record<QuarterValue, string[]>;
}

let activeRecordsByQuarter: Record<QuarterValue, RegionQuarterRecord[]> = REGIME_DATA_BY_QUARTER;
let activeRecordMapByQuarter: Record<
  QuarterValue,
  Record<string, RegionQuarterRecord>
> = REGIME_MAP_BY_QUARTER;
let activeSummaries: Record<QuarterValue, QuarterSummaryMetrics> = QUARTER_SUMMARIES;
let activeTop10ByQuarter: Record<QuarterValue, Set<string>> = TOP_10_CODES_BY_QUARTER;

export async function hydrateDashboardFromApi(): Promise<boolean> {
  try {
    const res = await fetch('/api/dashboard/bootstrap');
    if (!res.ok) return false;
    const payload = (await res.json()) as DashboardBootstrapApiPayload;
    if (!payload || !payload.recordsByQuarter || !payload.summaries) {
      return false;
    }

    const nextRecords = { ...REGIME_DATA_BY_QUARTER };
    const nextRecordMap = { ...REGIME_MAP_BY_QUARTER };
    const nextSummaries = { ...QUARTER_SUMMARIES };
    const nextTop10 = { ...TOP_10_CODES_BY_QUARTER };

    for (const q of TIMELINE_QUARTERS) {
      const rows = payload.recordsByQuarter[q];
      if (rows && rows.length > 0) {
        nextRecords[q] = rows;
        const map: Record<string, RegionQuarterRecord> = {};
        for (const row of rows) {
          map[row.regionCode] = row;
        }
        nextRecordMap[q] = map;
      }
      if (payload.summaries[q]) {
        nextSummaries[q] = payload.summaries[q];
      }
      if (payload.top10CodesByQuarter?.[q]) {
        nextTop10[q] = new Set(payload.top10CodesByQuarter[q]);
      }
    }

    activeRecordsByQuarter = nextRecords;
    activeRecordMapByQuarter = nextRecordMap;
    activeSummaries = nextSummaries;
    activeTop10ByQuarter = nextTop10;
    return true;
  } catch {
    return false;
  }
}

export function getRegionsMeta(): readonly RegionMeta[] {
  return SEOUL_REGIONS_META;
}

export function getRegionMetaByCode(regionCode: string): RegionMeta | undefined {
  return SEOUL_REGIONS_META_MAP[regionCode];
}

export function getQuarterRecords(quarter: QuarterValue): readonly RegionQuarterRecord[] {
  return activeRecordsByQuarter[quarter];
}

export function getQuarterRecordMap(
  quarter: QuarterValue,
): Readonly<Record<string, RegionQuarterRecord>> {
  return activeRecordMapByQuarter[quarter];
}

export function getRegionQuarterRecord(
  quarter: QuarterValue,
  regionCode: string,
): RegionQuarterRecord | null {
  return activeRecordMapByQuarter[quarter]?.[regionCode] ?? null;
}

export function getQuarterSummary(quarter: QuarterValue): QuarterSummaryMetrics {
  return activeSummaries[quarter];
}

export function getTop10RegionCodes(quarter: QuarterValue): ReadonlySet<string> {
  return activeTop10ByQuarter[quarter];
}

export function getRegionComparisonDelta(
  regionCode: string,
  quarter: QuarterValue,
): ComparisonDelta {
  const cur = activeRecordMapByQuarter[quarter]?.[regionCode];
  const baseQuarter = `2021Q${quarter[5]}` as QuarterValue;
  const base = activeRecordMapByQuarter[baseQuarter]?.[regionCode];
  if (!cur || !base) {
    return { priceDeltaPct: null, growthDelta: null, errorDelta: null };
  }

  const priceDeltaPct =
    cur.pricePerSqm !== null && base.pricePerSqm !== null && base.pricePerSqm > 0
      ? Number((((cur.pricePerSqm - base.pricePerSqm) / base.pricePerSqm) * 100).toFixed(1))
      : null;
  const growthDelta =
    cur.actualGrowth !== null && base.actualGrowth !== null
      ? Number((cur.actualGrowth - base.actualGrowth).toFixed(2))
      : null;
  const curErr = cur.predictions?.price_lcns.error ?? null;
  const baseErr = base.predictions?.price_lcns.error ?? null;
  const errorDelta =
    curErr !== null && baseErr !== null
      ? Number((Math.abs(curErr) - Math.abs(baseErr)).toFixed(2))
      : null;
  return { priceDeltaPct, growthDelta, errorDelta };
}

export interface QuarterAccuracyBreakdown {
  evaluatedCount: number;
  hitCount: number;
  missCount: number;
  hitRatePct: number;
  missRatePct: number;
  bands: Record<ErrorToleranceBand, { count: number; pct: number }>;
}

export interface QuarterAccuracyHistoryPoint {
  quarter: QuarterValue;
  hitRatePct: number;
  missRatePct: number;
  evaluatedCount: number;
  bandPcts: Record<ErrorToleranceBand, number>;
}

export function classifyToleranceBand(absError: number): ErrorToleranceBand {
  if (absError <= 2.0) return '0_2';
  if (absError <= 4.0) return '2_4';
  if (absError <= 6.0) return '4_6';
  return '6_plus';
}

export function getQuarterAccuracyBreakdown(
  quarter: QuarterValue,
  model: ModelName,
): QuarterAccuracyBreakdown {
  const records = activeRecordsByQuarter[quarter];
  let evaluatedCount = 0;
  let hitCount = 0;
  const bandCounts: Record<ErrorToleranceBand, number> = {
    '0_2': 0,
    '2_4': 0,
    '4_6': 0,
    '6_plus': 0,
  };

  for (const r of records) {
    const err = r.predictions?.[model].error ?? null;
    if (err !== null) {
      evaluatedCount++;
      const absErr = Math.abs(err);
      bandCounts[classifyToleranceBand(absErr)]++;
      if (isPredictionHit(err)) {
        hitCount++;
      }
    }
  }

  const missCount = evaluatedCount - hitCount;
  const hitRatePct = evaluatedCount > 0 ? Math.round((hitCount / evaluatedCount) * 1000) / 10 : 0;
  const missRatePct = evaluatedCount > 0 ? Math.round((100 - hitRatePct) * 10) / 10 : 0;

  const toBandStat = (count: number) => ({
    count,
    pct: evaluatedCount > 0 ? Math.round((count / evaluatedCount) * 1000) / 10 : 0,
  });

  return {
    evaluatedCount,
    hitCount,
    missCount,
    hitRatePct,
    missRatePct,
    bands: {
      '0_2': toBandStat(bandCounts['0_2']),
      '2_4': toBandStat(bandCounts['2_4']),
      '4_6': toBandStat(bandCounts['4_6']),
      '6_plus': toBandStat(bandCounts['6_plus']),
    },
  };
}

export interface SggAccuracyRow {
  sggName: string;
  hitRatePct: number;
  evaluatedCount: number;
}

export interface QuarterSggAccuracySummary {
  topSggs: SggAccuracyRow[];
  bottomSggs: SggAccuracyRow[];
  underMissCount: number;
  overMissCount: number;
  underMissPct: number;
  overMissPct: number;
}

export function getQuarterSggAccuracySummary(
  quarter: QuarterValue,
  model: ModelName,
): QuarterSggAccuracySummary {
  const records = activeRecordsByQuarter[quarter];
  const bySgg = new Map<string, { total: number; hits: number }>();
  let underMissCount = 0;
  let overMissCount = 0;

  for (const r of records) {
    const err = r.predictions?.[model].error ?? null;
    if (err === null) continue;
    const entry = bySgg.get(r.sggName) ?? { total: 0, hits: 0 };
    entry.total++;
    if (isPredictionHit(err)) {
      entry.hits++;
    } else if (err > 0) {
      underMissCount++;
    } else {
      overMissCount++;
    }
    bySgg.set(r.sggName, entry);
  }

  const rows: SggAccuracyRow[] = [];
  for (const [sggName, stat] of bySgg.entries()) {
    if (stat.total >= 3) {
      rows.push({
        sggName,
        hitRatePct: Math.round((stat.hits / stat.total) * 1000) / 10,
        evaluatedCount: stat.total,
      });
    }
  }

  const sortedDesc = [...rows].sort(
    (a, b) => b.hitRatePct - a.hitRatePct || b.evaluatedCount - a.evaluatedCount,
  );
  const sortedAsc = [...rows].sort(
    (a, b) => a.hitRatePct - b.hitRatePct || b.evaluatedCount - a.evaluatedCount,
  );

  const totalMiss = underMissCount + overMissCount;
  const underMissPct = totalMiss > 0 ? Math.round((underMissCount / totalMiss) * 100) : 0;
  const overMissPct = totalMiss > 0 ? 100 - underMissPct : 0;

  return {
    topSggs: sortedDesc.slice(0, 5),
    bottomSggs: sortedAsc.slice(0, 5),
    underMissCount,
    overMissCount,
    underMissPct,
    overMissPct,
  };
}

export function getRecentAccuracyHistory(
  upToQuarter: QuarterValue,
  model: ModelName,
  count = 10,
): QuarterAccuracyHistoryPoint[] {
  const upIdx = TIMELINE_QUARTERS.indexOf(upToQuarter);
  const endIdx = upIdx >= 0 ? upIdx : TIMELINE_QUARTERS.length - 1;
  const evalQuarters = TIMELINE_QUARTERS.slice(0, endIdx + 1).filter(
    (q) => activeSummaries[q].periodType === 'eval',
  );
  const slice = evalQuarters.slice(-count);
  return slice.map((q) => {
    const b = getQuarterAccuracyBreakdown(q, model);
    return {
      quarter: q,
      hitRatePct: b.hitRatePct,
      missRatePct: b.missRatePct,
      evaluatedCount: b.evaluatedCount,
      bandPcts: {
        '0_2': b.bands['0_2'].pct,
        '2_4': b.bands['2_4'].pct,
        '4_6': b.bands['4_6'].pct,
        '6_plus': b.bands['6_plus'].pct,
      },
    };
  });
}

export function getSpotlightRegions(
  quarter: QuarterValue,
  model: ModelName,
  limit = 5,
  viewMode: MapViewMode = 'market',
  accuracyFilter: AiAccuracyFilter = 'all',
): RegionQuarterRecord[] {
  const summary = activeSummaries[quarter];
  const records = activeRecordsByQuarter[quarter];

  if (summary.periodType === 'forecast') {
    return records
      .filter((r) => r.predictions !== null)
      .sort(
        (a, b) =>
          (b.predictions?.[model].predictedGrowth ?? -Infinity) -
          (a.predictions?.[model].predictedGrowth ?? -Infinity),
      )
      .slice(0, limit);
  }

  if (viewMode === 'error' && summary.periodType === 'eval') {
    const evaluated = records.filter(
      (r) => r.predictions?.[model].error !== null && r.predictions?.[model].error !== undefined,
    );
    if (accuracyFilter === 'hit') {
      return evaluated
        .filter((r) => isPredictionHit(r.predictions![model].error!))
        .sort(
          (a, b) =>
            (b.predictions?.[model].predictedGrowth ?? -Infinity) -
            (a.predictions?.[model].predictedGrowth ?? -Infinity),
        )
        .slice(0, limit);
    }
    if (accuracyFilter === 'miss') {
      return evaluated
        .filter((r) => !isPredictionHit(r.predictions![model].error!))
        .sort(
          (a, b) =>
            Math.abs(b.predictions?.[model].error ?? 0) -
            Math.abs(a.predictions?.[model].error ?? 0),
        )
        .slice(0, limit);
    }
    return evaluated
      .sort(
        (a, b) =>
          (b.predictions?.[model].predictedGrowth ?? -Infinity) -
          (a.predictions?.[model].predictedGrowth ?? -Infinity),
      )
      .slice(0, limit);
  }

  const valid = records.filter((r) => r.actualGrowth !== null);

  return [...valid]
    .sort((a, b) => (b.actualGrowth ?? -Infinity) - (a.actualGrowth ?? -Infinity))
    .slice(0, limit);
}

export function getIndustryTopDongCodes(
  quarter: QuarterValue,
  industry: IndustryKey,
  limit = 16,
): string[] {
  return [...activeRecordsByQuarter[quarter]]
    .sort((a, b) => b.industryStats[industry].activeCnt - a.industryStats[industry].activeCnt)
    .slice(0, limit)
    .map((r) => r.regionCode);
}

export function getRegionQuarterTrend(
  regionCode: string,
  model: ModelName,
  upToQuarter: QuarterValue,
  count = 12,
): RegionQuarterTrendPoint[] {
  const endIdx = TIMELINE_QUARTERS.indexOf(upToQuarter);
  const safeEnd = endIdx >= 0 ? endIdx : TIMELINE_QUARTERS.length - 1;
  const startIdx = Math.max(0, safeEnd - count + 1);
  const slice = TIMELINE_QUARTERS.slice(startIdx, safeEnd + 1);

  return slice.map((quarter) => {
    const rec = activeRecordMapByQuarter[quarter]?.[regionCode];
    if (!rec) {
      return {
        quarter,
        priceIdx: null,
        predPriceIdx: null,
        pricePerSqm: null,
        totalOpenCnt: 0,
        totalCloseCnt: 0,
        totalActiveCnt: 0,
        totalNetCnt: 0,
      };
    }

    let totalOpenCnt = 0;
    let totalCloseCnt = 0;
    let totalActiveCnt = 0;
    for (const key of INDUSTRY_ORDER) {
      const s = rec.industryStats[key];
      totalOpenCnt += s.openCnt;
      totalCloseCnt += s.closeCnt;
      totalActiveCnt += s.activeCnt;
    }

    return {
      quarter,
      priceIdx: rec.priceIdx,
      predPriceIdx: rec.predictions?.[model].predPriceIdx ?? null,
      pricePerSqm: rec.pricePerSqm,
      totalOpenCnt,
      totalCloseCnt,
      totalActiveCnt,
      totalNetCnt: totalOpenCnt - totalCloseCnt,
    };
  });
}

export function getFacilityHubCodes(facility: FacilityKey, minScore = 84, limit = 14): string[] {
  return [...SEOUL_REGIONS_META]
    .sort((a, b) => b.facilityScores[facility] - a.facilityScores[facility])
    .filter((r) => r.facilityScores[facility] >= minScore)
    .slice(0, limit)
    .map((r) => r.regionCode);
}

export function getJobFlowLinks(): readonly FacilityHubLink[] {
  return SEOUL_JOB_FLOW_LINKS;
}

export function getTransitCorridors(): readonly TransitCorridor[] {
  return SEOUL_TRANSIT_CORRIDORS;
}
