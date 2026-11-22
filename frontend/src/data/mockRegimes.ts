import { INDUSTRY_ORDER } from '../config/industries';
import { SEOUL_REGIONS_META as REGIONS_META } from './seoulRegionsMeta';
import {
  FORECAST_QUARTER,
  TIMELINE_QUARTERS,
  type ComparisonDelta,
  type FacilityKey,
  type IndustryKey,
  type IndustryQuarterStats,
  type IndustryStatsMap,
  type MarketRegime,
  type ModelName,
  type ModelPredictionMetrics,
  type QuarterNum,
  type QuarterPeriodType,
  type QuarterSummaryMetrics,
  type QuarterValue,
  type RegionMeta,
  type RegionQuarterRecord,
  type RegionTier,
  type TimelineYear,
} from '../types/dashboard';
import { isPredictionHit } from '../utils/formatters';

function hash01(str: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function parseQuarter(q: QuarterValue): { year: TimelineYear; quarterNum: QuarterNum } {
  return {
    year: Number(q.slice(0, 4)) as TimelineYear,
    quarterNum: Number(q.slice(5, 6)) as QuarterNum,
  };
}

function getPeriodType(q: QuarterValue, year: TimelineYear): QuarterPeriodType {
  if (q === FORECAST_QUARTER) return 'forecast';
  if (year < 2021) return 'train';
  return 'eval';
}

function getRegimeForYear(year: TimelineYear): {
  regime: MarketRegime;
  label: string;
  description: string;
} {
  if (year <= 2021) {
    return {
      regime: 'BOOM',
      label: '동반 상승기',
      description:
        '저금리 유동성 장세로 서울 전역 법정동 매매가 동반 상승 및 과소 예측(+Y) 확산 국면',
    };
  }
  if (year <= 2023) {
    return {
      regime: 'SLUMP',
      label: '금리 침체기',
      description:
        '기준금리 인상 충격으로 거래량 급감·가격 하락, 2022~2023 롤링 검증 오차(-Y) 확대 구간',
    };
  }
  return {
    regime: 'POLARIZATION',
    label: '초양극화 국면',
    description: '외곽 거래 희소·보합 속 강남·서초·송파·용산·성동 핵심 법정동 중심으로 상승세 집중',
  };
}

// Deterministically select exactly 129 non-trade dongs (matching Gold dim_region: 338 observed / 129 non-trade)
// Prefer tiny historic/commercial dongs in Jongno(11110) and Jung-gu(11140) first, matching real Seoul patterns.
const NON_TRADE_CODE_SET: ReadonlySet<string> = (() => {
  const scored = REGIONS_META.map((r) => {
    const commercialBias = r.sggCode === '11110' || r.sggCode === '11140' ? -0.55 : 0;
    const score = commercialBias + hash01(r.regionCode, 901);
    return { code: r.regionCode, score };
  });
  scored.sort((a, b) => a.score - b.score);
  return new Set(scored.slice(0, 129).map((s) => s.code));
})();

// Deterministically select 269 rolling-CV evaluated dongs and 221 forecast dongs among the 338 observed dongs
const OBSERVED_RANKED_CODES = REGIONS_META.filter((r) => !NON_TRADE_CODE_SET.has(r.regionCode))
  .map((r) => ({ code: r.regionCode, score: hash01(r.regionCode, 907) }))
  .sort((a, b) => a.score - b.score)
  .map((s) => s.code);

const EVALUATED_CODE_SET: ReadonlySet<string> = new Set(OBSERVED_RANKED_CODES.slice(0, 269));
const FORECAST_CODE_SET: ReadonlySet<string> = new Set(OBSERVED_RANKED_CODES.slice(0, 221));

interface TierQuarterProfile {
  actualRange: [number, number];
  priceErrorBias: number;
}

function getTierQuarterProfile(
  year: TimelineYear,
  quarterNum: QuarterNum,
  tier: RegionTier,
): TierQuarterProfile {
  const seasonal = quarterNum === 2 || quarterNum === 3 ? 0.45 : -0.25;

  if (year <= 2019) {
    const base =
      tier === 'PRIME_SEOUL' ? [1.2, 4.4] : tier === 'CORE_SEOUL' ? [0.8, 3.6] : [0.3, 2.8];
    return {
      actualRange: [base[0] + seasonal, base[1] + seasonal],
      priceErrorBias: 0.6,
    };
  }
  if (year === 2020) {
    const base =
      tier === 'PRIME_SEOUL' ? [2.4, 6.2] : tier === 'CORE_SEOUL' ? [2.6, 6.6] : [2.0, 5.8];
    return {
      actualRange: [base[0] + seasonal, base[1] + seasonal],
      priceErrorBias: 1.4,
    };
  }
  if (year === 2021) {
    const base =
      tier === 'PRIME_SEOUL' ? [3.2, 7.6] : tier === 'CORE_SEOUL' ? [3.8, 8.4] : [4.0, 9.2];
    return {
      actualRange: [base[0] + seasonal, base[1] + seasonal],
      priceErrorBias: 2.2,
    };
  }
  if (year === 2022) {
    const base =
      tier === 'PRIME_SEOUL' ? [-4.2, -1.0] : tier === 'CORE_SEOUL' ? [-6.8, -2.4] : [-9.5, -4.0];
    return {
      actualRange: [base[0] + seasonal * 0.5, base[1] + seasonal * 0.5],
      priceErrorBias: tier === 'PRIME_SEOUL' ? -2.4 : -5.6,
    };
  }
  if (year === 2023) {
    const base =
      tier === 'PRIME_SEOUL' ? [-1.2, 2.6] : tier === 'CORE_SEOUL' ? [-3.4, 0.8] : [-5.2, -0.8];
    return {
      actualRange: [base[0] + seasonal * 0.4, base[1] + seasonal * 0.4],
      priceErrorBias: tier === 'PRIME_SEOUL' ? 0.5 : -2.6,
    };
  }
  if (year === 2024) {
    const base =
      tier === 'PRIME_SEOUL' ? [2.8, 7.5] : tier === 'CORE_SEOUL' ? [0.6, 3.8] : [-2.2, 1.2];
    return {
      actualRange: [base[0] + seasonal * 0.4, base[1] + seasonal * 0.4],
      priceErrorBias: tier === 'PRIME_SEOUL' ? 2.4 : -0.6,
    };
  }
  if (year === 2025) {
    const base =
      tier === 'PRIME_SEOUL' ? [3.4, 8.6] : tier === 'CORE_SEOUL' ? [0.4, 3.4] : [-2.6, 0.9];
    return {
      actualRange: [base[0] + seasonal * 0.5, base[1] + seasonal * 0.5],
      priceErrorBias: tier === 'PRIME_SEOUL' ? 3.1 : -0.9,
    };
  }
  // 2026
  const base =
    tier === 'PRIME_SEOUL' ? [3.0, 8.2] : tier === 'CORE_SEOUL' ? [0.5, 3.6] : [-2.4, 1.0];
  return {
    actualRange: [base[0] + seasonal * 0.4, base[1] + seasonal * 0.4],
    priceErrorBias: tier === 'PRIME_SEOUL' ? 2.8 : -0.8,
  };
}

function computeTopDrivers(region: RegionMeta, year: TimelineYear): [FacilityKey, FacilityKey] {
  const weights: Record<FacilityKey, number> =
    year <= 2021
      ? { jobs: 1.04, subway: 1.12, school: 0.95, commercial: 1.0, hospital: 0.9 }
      : year <= 2023
        ? { jobs: 1.1, subway: 1.08, school: 1.05, commercial: 0.92, hospital: 0.95 }
        : { jobs: 1.15, subway: 1.08, school: 1.14, commercial: 0.96, hospital: 0.9 };

  const entries = (Object.keys(region.facilityScores) as FacilityKey[]).map((key) => ({
    key,
    weighted: region.facilityScores[key] * weights[key],
  }));
  entries.sort((a, b) => b.weighted - a.weighted);
  return [entries[0].key, entries[1].key];
}

// Base scale per industry (aligned with Seoul 2026Q3 Gold active_cnt distribution across 467 dongs)
const INDUSTRY_BASE_SCALE: Record<IndustryKey, { mean: number; churnRate: number; salt: number }> =
  {
    GENERAL_FOOD: { mean: 245, churnRate: 0.036, salt: 101 },
    REST_FOOD: { mean: 68, churnRate: 0.044, salt: 107 },
    CAFE: { mean: 54, churnRate: 0.048, salt: 113 },
    CLINIC: { mean: 40, churnRate: 0.014, salt: 127 },
    PHARMACY: { mean: 13, churnRate: 0.012, salt: 131 },
    BEAUTY: { mean: 72, churnRate: 0.031, salt: 137 },
  };

function buildInitialIndustryActive(region: RegionMeta): Record<IndustryKey, number> {
  const tierMult = region.tier === 'PRIME_SEOUL' ? 1.45 : region.tier === 'CORE_SEOUL' ? 1.1 : 0.78;
  const commMult = 0.65 + (region.facilityScores.commercial / 100) * 0.7;
  const out = {} as Record<IndustryKey, number>;

  for (const key of INDUSTRY_ORDER) {
    const cfg = INDUSTRY_BASE_SCALE[key];
    const noise = 0.35 + hash01(region.regionCode, cfg.salt) * 1.45;
    out[key] = Math.max(0, Math.round(cfg.mean * tierMult * commMult * noise * 0.88));
  }
  return out;
}

function stepQuarterIndustries(
  region: RegionMeta,
  qIdx: number,
  year: TimelineYear,
  prevActive: Record<IndustryKey, number>,
): {
  stats: IndustryStatsMap;
  nextActive: Record<IndustryKey, number>;
  convenienceActiveCnt: number;
} {
  const macroBias = year <= 2021 ? 0.008 : year <= 2023 ? -0.006 : 0.004;
  const stats = {} as IndustryStatsMap;
  const nextActive = {} as Record<IndustryKey, number>;

  for (const key of INDUSTRY_ORDER) {
    const cfg = INDUSTRY_BASE_SCALE[key];
    const base = prevActive[key];
    const openNoise = hash01(region.regionCode, qIdx * 71 + cfg.salt);
    const closeNoise = hash01(region.regionCode, qIdx * 83 + cfg.salt + 5);

    const openCnt = Math.max(
      0,
      Math.round(base * cfg.churnRate * (0.55 + openNoise * 1.05 + macroBias * 8)),
    );
    const closeCnt = Math.max(
      0,
      Math.round(base * cfg.churnRate * (0.5 + closeNoise * 0.95 - macroBias * 6)),
    );
    const activeCnt = Math.max(0, base + openCnt - closeCnt);
    const entry: IndustryQuarterStats = {
      openCnt,
      closeCnt,
      activeCnt,
      netCnt: openCnt - closeCnt,
    };
    stats[key] = entry;
    nextActive[key] = activeCnt;
  }

  const convenienceActiveCnt = Math.max(
    0,
    Math.round(
      (nextActive.CAFE * 0.32 + 4) * (0.7 + hash01(region.regionCode, qIdx * 19 + 401) * 0.6),
    ),
  );

  return { stats, nextActive, convenienceActiveCnt };
}

function buildAllQuarterData() {
  const dataByQuarter = {} as Record<QuarterValue, RegionQuarterRecord[]>;
  const mapByQuarter = {} as Record<QuarterValue, Record<string, RegionQuarterRecord>>;
  const summaries = {} as Record<QuarterValue, QuarterSummaryMetrics>;
  const top10ByQuarter = {} as Record<QuarterValue, Set<string>>;

  const runningPrice = new Map<string, number>();
  const runningIdx = new Map<string, number>();
  const runningIndustry = new Map<string, Record<IndustryKey, number>>();

  for (const r of REGIONS_META) {
    // Back-cast 2017Q1 starting price from 2020 baseline
    runningPrice.set(r.regionCode, Math.round(r.basePricePerSqm * 0.72));
    runningIdx.set(r.regionCode, 100);
    runningIndustry.set(r.regionCode, buildInitialIndustryActive(r));
  }

  for (let qIdx = 0; qIdx < TIMELINE_QUARTERS.length; qIdx++) {
    const quarter = TIMELINE_QUARTERS[qIdx];
    const { year, quarterNum } = parseQuarter(quarter);
    const periodType = getPeriodType(quarter, year);
    const regimeInfo = getRegimeForYear(year);

    const records: RegionQuarterRecord[] = [];
    const recordMap: Record<string, RegionQuarterRecord> = {};

    for (const region of REGIONS_META) {
      const prevInd = runningIndustry.get(region.regionCode)!;
      const {
        stats: industryStats,
        nextActive,
        convenienceActiveCnt,
      } = periodType === 'forecast'
        ? {
            stats: Object.fromEntries(
              INDUSTRY_ORDER.map((k) => [
                k,
                { openCnt: 0, closeCnt: 0, activeCnt: prevInd[k], netCnt: 0 },
              ]),
            ) as IndustryStatsMap,
            nextActive: prevInd,
            convenienceActiveCnt: Math.max(0, Math.round(prevInd.CAFE * 0.32 + 4)),
          }
        : stepQuarterIndustries(region, qIdx, year, prevInd);

      runningIndustry.set(region.regionCode, nextActive);

      const hasObservedTradeYn = !NON_TRADE_CODE_SET.has(region.regionCode);

      if (!hasObservedTradeYn) {
        const rec: RegionQuarterRecord = {
          regionCode: region.regionCode,
          regionName: region.regionName,
          sido: region.sido,
          sggCode: region.sggCode,
          sggName: region.sggName,
          centroid: region.centroid,
          quarter,
          hasObservedTradeYn: false,
          tradeCnt: 0,
          lowSampleYn: false,
          pricePerSqm: null,
          priceIdx: null,
          actualGrowth: null,
          predictions: null,
          industryStats,
          convenienceActiveCnt,
          facilityScores: region.facilityScores,
          topDrivers: computeTopDrivers(region, year),
          growthDelta: null,
          priceDeltaPct: null,
          errorDelta: null,
        };
        records.push(rec);
        recordMap[region.regionCode] = rec;
        continue;
      }

      const profile = getTierQuarterProfile(year, quarterNum, region.tier);
      const tActual = hash01(region.regionCode, qIdx * 17 + 3);
      const rawActual =
        profile.actualRange[0] + tActual * (profile.actualRange[1] - profile.actualRange[0]);

      const facilityBonus =
        ((region.facilityScores.jobs +
          region.facilityScores.subway +
          region.facilityScores.school) /
          300 -
          0.55) *
        1.6;

      const simulatedGrowth = round2(rawActual + facilityBonus);
      const prevPrice = runningPrice.get(region.regionCode) ?? region.basePricePerSqm;
      const prevIdx = runningIdx.get(region.regionCode) ?? 100;

      if (periodType === 'forecast') {
        const hasForecast = FORECAST_CODE_SET.has(region.regionCode);
        let predictions: Record<ModelName, ModelPredictionMetrics> | null = null;

        if (hasForecast) {
          const pricePred = round2(
            simulatedGrowth + (hash01(region.regionCode, qIdx * 23 + 11) - 0.5) * 1.4,
          );
          const lcnsAdj = (hash01(region.regionCode, qIdx * 29 + 5) - 0.48) * 0.45;
          const priceLcnsPred = round2(pricePred + lcnsAdj);

          predictions = {
            baseline: {
              predictedGrowth: 0,
              error: null,
              predPricePerSqm: prevPrice,
              predPriceIdx: round2(prevIdx),
            },
            price: {
              predictedGrowth: pricePred,
              error: null,
              predPricePerSqm: Math.max(95, Math.round(prevPrice * (1 + pricePred / 100))),
              predPriceIdx: round2(prevIdx * (1 + pricePred / 100)),
            },
            price_lcns: {
              predictedGrowth: priceLcnsPred,
              error: null,
              predPricePerSqm: Math.max(95, Math.round(prevPrice * (1 + priceLcnsPred / 100))),
              predPriceIdx: round2(prevIdx * (1 + priceLcnsPred / 100)),
            },
          };
        }

        const rec: RegionQuarterRecord = {
          regionCode: region.regionCode,
          regionName: region.regionName,
          sido: region.sido,
          sggCode: region.sggCode,
          sggName: region.sggName,
          centroid: region.centroid,
          quarter,
          hasObservedTradeYn: true,
          tradeCnt: 0,
          lowSampleYn: false,
          pricePerSqm: null,
          priceIdx: null,
          actualGrowth: null,
          predictions,
          industryStats,
          convenienceActiveCnt,
          facilityScores: region.facilityScores,
          topDrivers: computeTopDrivers(region, year),
          growthDelta: null,
          priceDeltaPct: null,
          errorDelta: null,
        };
        records.push(rec);
        recordMap[region.regionCode] = rec;
        continue;
      }

      // Observed quarter (2017Q1 ~ 2026Q3)
      const slumpFactor = year === 2022 || year === 2023 ? 0.52 : 1.0;
      const tierVolume =
        region.tier === 'PRIME_SEOUL' ? 42 : region.tier === 'CORE_SEOUL' ? 28 : 18;
      const rawTrade = Math.round(
        tierVolume * slumpFactor * (0.1 + hash01(region.regionCode, qIdx * 41 + 9) * 1.65),
      );
      const isEvaluated = periodType === 'eval' && EVALUATED_CODE_SET.has(region.regionCode);
      const tradeCnt = isEvaluated ? Math.max(5, rawTrade) : rawTrade;
      const lowSampleYn = tradeCnt < 5;

      const nextPrice =
        tradeCnt > 0 ? Math.max(120, Math.round(prevPrice * (1 + simulatedGrowth / 100))) : null;
      const nextIdx = tradeCnt > 0 ? round2(prevIdx * (1 + simulatedGrowth / 100)) : null;
      if (nextPrice !== null) {
        runningPrice.set(region.regionCode, nextPrice);
      }
      if (nextIdx !== null) {
        runningIdx.set(region.regionCode, nextIdx);
      }

      const actualGrowth = tradeCnt > 0 ? simulatedGrowth : null;

      let predictions: Record<ModelName, ModelPredictionMetrics> | null = null;
      if (isEvaluated && actualGrowth !== null) {
        const noise = (hash01(region.regionCode, qIdx * 31 + 19) - 0.5) * 3.8;
        const hitChance = hash01(region.regionCode, qIdx * 53 + 7);
        let priceErr = profile.priceErrorBias + noise;
        if (Math.abs(profile.priceErrorBias) < 2.2 && hitChance < 0.48) {
          priceErr = (hitChance - 0.24) * 3.2;
        }
        priceErr = round2(priceErr);

        const pricePred = round2(actualGrowth - priceErr);
        const lcnsDelta = (hash01(region.regionCode, qIdx * 61 + 13) - 0.52) * 0.5;
        const priceLcnsErr = round2(priceErr + lcnsDelta);
        const priceLcnsPred = round2(actualGrowth - priceLcnsErr);

        predictions = {
          baseline: {
            predictedGrowth: 0,
            error: actualGrowth,
            predPricePerSqm: prevPrice,
            predPriceIdx: round2(prevIdx),
          },
          price: {
            predictedGrowth: pricePred,
            error: priceErr,
            predPricePerSqm: Math.max(95, Math.round(prevPrice * (1 + pricePred / 100))),
            predPriceIdx: round2(prevIdx * (1 + pricePred / 100)),
          },
          price_lcns: {
            predictedGrowth: priceLcnsPred,
            error: priceLcnsErr,
            predPricePerSqm: Math.max(95, Math.round(prevPrice * (1 + priceLcnsPred / 100))),
            predPriceIdx: round2(prevIdx * (1 + priceLcnsPred / 100)),
          },
        };
      }

      const rec: RegionQuarterRecord = {
        regionCode: region.regionCode,
        regionName: region.regionName,
        sido: region.sido,
        sggCode: region.sggCode,
        sggName: region.sggName,
        centroid: region.centroid,
        quarter,
        hasObservedTradeYn: true,
        tradeCnt,
        lowSampleYn,
        pricePerSqm: nextPrice,
        priceIdx: nextIdx,
        actualGrowth,
        predictions,
        industryStats,
        convenienceActiveCnt,
        facilityScores: region.facilityScores,
        topDrivers: computeTopDrivers(region, year),
        growthDelta: null,
        priceDeltaPct: null,
        errorDelta: null,
      };

      records.push(rec);
      recordMap[region.regionCode] = rec;
    }

    // Compute quarter summary metrics
    const observedWithGrowth = records.filter((r) => r.actualGrowth !== null);
    const nonTradeDongCount = records.filter((r) => !r.hasObservedTradeYn).length;
    const lowSampleDongCount = records.filter((r) => r.hasObservedTradeYn && r.lowSampleYn).length;
    const evaluatedRecords = records.filter((r) => r.predictions !== null);

    let polarizationIndex: number | null = null;
    let avgActualGrowth: number | null = null;
    const top10Set = new Set<string>();

    if (observedWithGrowth.length > 0) {
      const sortedByGrowth = [...observedWithGrowth].sort(
        (a, b) => (b.actualGrowth ?? 0) - (a.actualGrowth ?? 0),
      );
      const decileCount = Math.max(1, Math.round(sortedByGrowth.length * 0.1));
      const top10 = sortedByGrowth.slice(0, decileCount);
      const bottom10 = sortedByGrowth.slice(-decileCount);
      top10.forEach((r) => top10Set.add(r.regionCode));

      const top10Avg = top10.reduce((s, r) => s + (r.actualGrowth ?? 0), 0) / decileCount;
      const bottom10Avg = bottom10.reduce((s, r) => s + (r.actualGrowth ?? 0), 0) / decileCount;
      polarizationIndex = round2(top10Avg - bottom10Avg);
      avgActualGrowth = round2(
        observedWithGrowth.reduce((s, r) => s + (r.actualGrowth ?? 0), 0) /
          observedWithGrowth.length,
      );
    } else if (periodType === 'forecast') {
      const sortedByForecast = [...evaluatedRecords].sort(
        (a, b) =>
          (b.predictions?.price_lcns.predictedGrowth ?? 0) -
          (a.predictions?.price_lcns.predictedGrowth ?? 0),
      );
      const decileCount = Math.max(1, Math.round(sortedByForecast.length * 0.1));
      sortedByForecast.slice(0, decileCount).forEach((r) => top10Set.add(r.regionCode));
    }

    const hitRateByModel: Record<ModelName, number | null> = {
      baseline: null,
      price: null,
      price_lcns: null,
    };
    const maeByModel: Record<ModelName, number | null> = {
      baseline: null,
      price: null,
      price_lcns: null,
    };

    if (periodType === 'eval' && evaluatedRecords.length > 0) {
      for (const m of ['baseline', 'price', 'price_lcns'] as const) {
        const errs = evaluatedRecords
          .map((r) => r.predictions?.[m].error)
          .filter((e): e is number => e !== null && e !== undefined);
        if (errs.length > 0) {
          const hits = errs.filter((e) => isPredictionHit(e)).length;
          hitRateByModel[m] = round2((hits / errs.length) * 100);
          maeByModel[m] = round2(errs.reduce((s, e) => s + Math.abs(e), 0) / errs.length);
        }
      }
    }

    dataByQuarter[quarter] = records;
    mapByQuarter[quarter] = recordMap;
    top10ByQuarter[quarter] = top10Set;
    summaries[quarter] = {
      quarter,
      year,
      quarterNum,
      periodType,
      regime: regimeInfo.regime,
      regimeLabel: periodType === 'forecast' ? '다음 분기 예측' : regimeInfo.label,
      regimeDescription:
        periodType === 'forecast'
          ? '2026Q3 기준 학습 모델(v.57b6837e9744)로 추정한 221개 서울 법정동 2026Q4 변화율·매매가 예측'
          : regimeInfo.description,
      observedDongCount: REGIONS_META.length - nonTradeDongCount,
      lowSampleDongCount,
      nonTradeDongCount,
      evaluatedDongCount: evaluatedRecords.length,
      hitRateByModel,
      maeByModel,
      polarizationIndex,
      avgActualGrowth,
    };
  }

  // Precompute 2021 same-quarter comparison deltas once at startup
  const comparisonDeltaByQuarter = {} as Record<QuarterValue, Record<string, ComparisonDelta>>;
  for (const quarter of TIMELINE_QUARTERS) {
    const { quarterNum } = parseQuarter(quarter);
    const baseQuarter = `2021Q${quarterNum}` as QuarterValue;
    const baseMap = mapByQuarter[baseQuarter];
    const deltaMap: Record<string, ComparisonDelta> = {};

    for (const rec of dataByQuarter[quarter]) {
      const base = baseMap[rec.regionCode];
      if (base && rec.actualGrowth !== null && base.actualGrowth !== null) {
        rec.growthDelta = round2(rec.actualGrowth - base.actualGrowth);
      }
      if (base && rec.pricePerSqm !== null && base.pricePerSqm !== null && base.pricePerSqm > 0) {
        rec.priceDeltaPct = round2(((rec.pricePerSqm - base.pricePerSqm) / base.pricePerSqm) * 100);
      }
      const recErr = rec.predictions?.price_lcns.error ?? null;
      const baseErr = base?.predictions?.price_lcns.error ?? null;
      if (recErr !== null && baseErr !== null) {
        rec.errorDelta = round2(recErr - baseErr);
      }

      deltaMap[rec.regionCode] = {
        growthDelta: rec.growthDelta,
        priceDeltaPct: rec.priceDeltaPct,
        errorDelta: rec.errorDelta,
      };
    }

    comparisonDeltaByQuarter[quarter] = deltaMap;
  }

  return { dataByQuarter, mapByQuarter, summaries, top10ByQuarter, comparisonDeltaByQuarter };
}

const BUILT = buildAllQuarterData();

export const REGIME_DATA_BY_QUARTER = BUILT.dataByQuarter;
export const REGIME_MAP_BY_QUARTER = BUILT.mapByQuarter;
export const QUARTER_SUMMARIES = BUILT.summaries;
export const TOP_10_CODES_BY_QUARTER = BUILT.top10ByQuarter;
export const COMPARISON_DELTA_BY_QUARTER = BUILT.comparisonDeltaByQuarter;

const NULL_DELTA: ComparisonDelta = { growthDelta: null, priceDeltaPct: null, errorDelta: null };

export function getRegionComparisonDelta(
  regionCode: string,
  quarter: QuarterValue,
): ComparisonDelta {
  return COMPARISON_DELTA_BY_QUARTER[quarter]?.[regionCode] ?? NULL_DELTA;
}
