import { REGIONS_META } from './regionsMeta';
import {
  TIMELINE_YEARS,
  type ComparisonDelta,
  type FacilityKey,
  type MarketRegime,
  type RegionMeta,
  type RegionTier,
  type RegionYearRecord,
  type YearSummaryMetrics,
  type YearValue,
} from '../types/dashboard';

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

function getRegimeForYear(year: YearValue): {
  regime: MarketRegime;
  label: string;
  description: string;
} {
  if (year <= 2021) {
    return {
      regime: 'BOOM',
      label: '동반 상승기',
      description: '초저금리 유동성 장세로 수도권 외곽·지방 광역시까지 전국적 동반 급등 및 과소 예측(+Y) 확산',
    };
  }
  if (year <= 2023) {
    return {
      regime: 'SLUMP',
      label: '금리 침체기',
      description: '급격한 기준금리 인상 충격으로 전국 동반 하락, 변동성 과대 지역의 지형 하부 음의 오차(-Y) 심화',
    };
  }
  return {
    regime: 'POLARIZATION',
    label: '초양극화 국면',
    description: '지방·외곽 침체 속 강남·서초·송파·용산·성동 및 판교(성남) 등 소수 상급지만 붉은 바늘처럼 폭등',
  };
}

// Specific showcase overrides to guarantee authentic Korean real-estate narratives
const SEJONG_CODE = '29010';
const PANGYO_CODE = '31020'; // 성남시
const GWACHEON_CODE = '31110';
const DAEGU_SUSEONG = '22060';
const BUSAN_HAEUNDAE = '21090';
const INCHEON_YEONSU = '23040';
const DAEJEON_YUSEONG = '25040';

interface TierProfile {
  actualRange: [number, number];
  errorBias: number;
}

function getTierProfile(year: YearValue, tier: RegionTier, code: string): TierProfile {
  if (year === 2020) {
    switch (tier) {
      case 'PRIME_SEOUL':
        return { actualRange: [11.5, 16.5], errorBias: 1.8 };
      case 'CORE_SEOUL':
        return { actualRange: [12.0, 17.5], errorBias: 2.4 };
      case 'CORE_GYEONGGI':
        return { actualRange: [14.0, 21.0], errorBias: 4.5 };
      case 'OUTER_METRO':
        return { actualRange: [11.0, 18.0], errorBias: 3.4 };
      case 'METRO_CITY_CORE':
        return { actualRange: [13.5, 22.0], errorBias: 4.8 };
      case 'METRO_CITY':
        return { actualRange: [10.0, 16.5], errorBias: 2.9 };
      case 'PROVINCIAL_HUB':
        return { actualRange: [8.5, 14.5], errorBias: 2.1 };
      case 'PROVINCIAL_RURAL':
        return { actualRange: [3.0, 9.5], errorBias: 0.6 };
    }
  }

  if (year === 2021) {
    // Peak nationwide liquidity boom (especially outer Gyeonggi, Incheon, Metro cities)
    if (code === SEJONG_CODE) return { actualRange: [18.0, 22.0], errorBias: 5.4 };
    if (code === INCHEON_YEONSU) return { actualRange: [22.0, 25.5], errorBias: 8.6 };
    switch (tier) {
      case 'PRIME_SEOUL':
        return { actualRange: [13.0, 17.5], errorBias: 2.1 };
      case 'CORE_SEOUL':
        return { actualRange: [14.5, 19.5], errorBias: 3.3 };
      case 'CORE_GYEONGGI':
        return { actualRange: [18.5, 25.0], errorBias: 7.4 };
      case 'OUTER_METRO':
        return { actualRange: [16.5, 23.8], errorBias: 6.8 };
      case 'METRO_CITY_CORE':
        return { actualRange: [15.5, 22.5], errorBias: 5.8 };
      case 'METRO_CITY':
        return { actualRange: [13.0, 19.5], errorBias: 4.6 };
      case 'PROVINCIAL_HUB':
        return { actualRange: [11.0, 17.5], errorBias: 3.7 };
      case 'PROVINCIAL_RURAL':
        return { actualRange: [6.0, 12.8], errorBias: 1.5 };
    }
  }

  if (year === 2022) {
    if (code === SEJONG_CODE) return { actualRange: [-18.0, -15.5], errorBias: -8.8 };
    if (code === DAEGU_SUSEONG) return { actualRange: [-16.0, -13.5], errorBias: -7.6 };
    if (code === INCHEON_YEONSU) return { actualRange: [-16.5, -14.0], errorBias: -7.9 };
    switch (tier) {
      case 'PRIME_SEOUL':
        return { actualRange: [-6.5, -3.5], errorBias: -1.2 };
      case 'CORE_SEOUL':
        return { actualRange: [-10.5, -6.5], errorBias: -3.2 };
      case 'CORE_GYEONGGI':
        return { actualRange: [-14.5, -9.5], errorBias: -5.8 };
      case 'OUTER_METRO':
        return { actualRange: [-16.5, -11.5], errorBias: -6.9 };
      case 'METRO_CITY_CORE':
        return { actualRange: [-14.5, -10.0], errorBias: -5.9 };
      case 'METRO_CITY':
        return { actualRange: [-13.0, -8.5], errorBias: -4.8 };
      case 'PROVINCIAL_HUB':
        return { actualRange: [-10.5, -6.0], errorBias: -3.4 };
      case 'PROVINCIAL_RURAL':
        return { actualRange: [-7.5, -3.5], errorBias: -1.4 };
    }
  }

  if (year === 2023) {
    if (code === DAEGU_SUSEONG) return { actualRange: [-13.5, -10.5], errorBias: -6.2 };
    if (code === BUSAN_HAEUNDAE) return { actualRange: [-11.5, -8.5], errorBias: -4.9 };
    switch (tier) {
      case 'PRIME_SEOUL':
        return { actualRange: [-3.2, 1.8], errorBias: 1.4 };
      case 'CORE_SEOUL':
        return { actualRange: [-6.5, -2.5], errorBias: -1.1 };
      case 'CORE_GYEONGGI':
        return { actualRange: [-10.5, -5.5], errorBias: -3.9 };
      case 'OUTER_METRO':
        return { actualRange: [-14.0, -8.5], errorBias: -5.8 };
      case 'METRO_CITY_CORE':
        return { actualRange: [-12.5, -7.8], errorBias: -5.1 };
      case 'METRO_CITY':
        return { actualRange: [-11.8, -7.2], errorBias: -4.4 };
      case 'PROVINCIAL_HUB':
        return { actualRange: [-9.5, -5.0], errorBias: -3.1 };
      case 'PROVINCIAL_RURAL':
        return { actualRange: [-8.0, -4.0], errorBias: -2.3 };
    }
  }

  // 2024 ~ 2026: Hyper-polarization (초양극화기)
  const polarizationIntensity = year === 2024 ? 0.78 : year === 2025 ? 1.0 : 1.16;

  if (code === PANGYO_CODE || code === GWACHEON_CODE) {
    return {
      actualRange: [11.5 * polarizationIntensity, 16.5 * polarizationIntensity],
      errorBias: 6.4 * polarizationIntensity,
    };
  }
  if (code === DAEJEON_YUSEONG || code === BUSAN_HAEUNDAE || code === DAEGU_SUSEONG) {
    return {
      actualRange: [1.5, 4.8],
      errorBias: 1.2,
    };
  }

  switch (tier) {
    case 'PRIME_SEOUL':
      return {
        actualRange: [14.0 * polarizationIntensity, 21.5 * polarizationIntensity],
        errorBias: 8.2 * polarizationIntensity,
      };
    case 'CORE_SEOUL':
      return {
        actualRange: [7.5 * polarizationIntensity, 13.5 * polarizationIntensity],
        errorBias: 4.3 * polarizationIntensity,
      };
    case 'CORE_GYEONGGI':
      return {
        actualRange: [2.2, 7.5],
        errorBias: 1.6,
      };
    case 'OUTER_METRO':
      return {
        actualRange: [-2.8, 1.6],
        errorBias: -1.4,
      };
    case 'METRO_CITY_CORE':
      return {
        actualRange: [-1.5, 2.8],
        errorBias: -0.9,
      };
    case 'METRO_CITY':
      return {
        actualRange: [-4.5, -0.5],
        errorBias: -2.4,
      };
    case 'PROVINCIAL_HUB':
      return {
        actualRange: [-4.2, -0.2],
        errorBias: -2.2,
      };
    case 'PROVINCIAL_RURAL':
      return {
        actualRange: [-6.8, -1.8],
        errorBias: -3.2,
      };
  }
}

function computeTopDrivers(region: RegionMeta, year: YearValue): [FacilityKey, FacilityKey] {
  const weights: Record<FacilityKey, number> =
    year <= 2021
      ? { subway: 1.25, commercial: 1.12, jobs: 1.08, school: 0.92, hospital: 0.85 }
      : year <= 2023
      ? { jobs: 1.22, subway: 1.18, hospital: 0.98, school: 0.95, commercial: 0.88 }
      : { jobs: 1.38, school: 1.26, subway: 1.22, hospital: 1.02, commercial: 0.94 };

  const ranked = (Object.keys(region.facilityScores) as FacilityKey[])
    .map((key) => ({
      key,
      weighted: region.facilityScores[key] * weights[key],
    }))
    .sort((a, b) => b.weighted - a.weighted);

  return [ranked[0].key, ranked[1].key];
}

function buildAllRegimeData() {
  const dataByYear = {} as Record<YearValue, RegionYearRecord[]>;
  const mapByYear = {} as Record<YearValue, Record<string, RegionYearRecord>>;
  const summaries = {} as Record<YearValue, YearSummaryMetrics>;
  const top10ByYear = {} as Record<YearValue, Set<string>>;

  const runningPrice = new Map<string, number>();
  for (const r of REGIONS_META) {
    runningPrice.set(r.regionCode, r.basePricePerSqm);
  }

  for (const year of TIMELINE_YEARS) {
    const records: RegionYearRecord[] = [];
    const recordMap: Record<string, RegionYearRecord> = {};
    const regimeInfo = getRegimeForYear(year);

    for (const region of REGIONS_META) {
      const profile = getTierProfile(year, region.tier, region.regionCode);
      const tActual = hash01(region.regionCode, year * 17 + 3);
      const rawActual =
        profile.actualRange[0] + tActual * (profile.actualRange[1] - profile.actualRange[0]);

      // Facility quality nudges growth up in prime/core regions
      const facilityBonus =
        ((region.facilityScores.jobs + region.facilityScores.subway + region.facilityScores.school) /
          300 -
          0.55) *
        3.2;

      const actualGrowth = round2(rawActual + facilityBonus);

      // Error variance around tier errorBias; some regions stay within |error| <= 2.0 (model hits)
      const noise = (hash01(region.regionCode, year * 31 + 19) - 0.5) * 4.4;
      // Inject ~32% near-hit regions during stable/transition pockets so cyan rings are clearly observable
      const hitChance = hash01(region.regionCode, year * 53 + 7);
      let error = profile.errorBias + noise;
      if (Math.abs(profile.errorBias) < 2.6 && hitChance < 0.45) {
        error = (hitChance - 0.22) * 3.5; // inside [-1.8, +1.8]
      }
      error = round2(error);

      const predictedGrowth = round2(actualGrowth - error);

      const prevPrice = runningPrice.get(region.regionCode) ?? region.basePricePerSqm;
      const nextPrice = Math.max(95, Math.round(prevPrice * (1 + actualGrowth / 100)));
      runningPrice.set(region.regionCode, nextPrice);

      const rec: RegionYearRecord = {
        regionCode: region.regionCode,
        regionName: region.regionName,
        sido: region.sido,
        centroid: region.centroid,
        actualGrowth,
        predictedGrowth,
        error,
        pricePerSqm: nextPrice,
        facilityScores: region.facilityScores,
        topDrivers: computeTopDrivers(region, year),
        growthDelta: 0,
        priceDeltaPct: 0,
        errorDelta: 0,
      };

      records.push(rec);
      recordMap[region.regionCode] = rec;
    }

    // Compute summary metrics & top 10% threshold
    const sortedByGrowth = [...records].sort((a, b) => b.actualGrowth - a.actualGrowth);
    const decileCount = Math.max(1, Math.round(records.length * 0.1));
    const top10 = sortedByGrowth.slice(0, decileCount);
    const bottom10 = sortedByGrowth.slice(-decileCount);

    const top10Avg = top10.reduce((s, r) => s + r.actualGrowth, 0) / decileCount;
    const bottom10Avg = bottom10.reduce((s, r) => s + r.actualGrowth, 0) / decileCount;
    const hitCount = records.filter((r) => Math.abs(r.error) <= 2.0).length;
    const mae = records.reduce((s, r) => s + Math.abs(r.error), 0) / records.length;
    const avgActual = records.reduce((s, r) => s + r.actualGrowth, 0) / records.length;

    dataByYear[year] = records;
    mapByYear[year] = recordMap;
    top10ByYear[year] = new Set(top10.map((r) => r.regionCode));
    summaries[year] = {
      year,
      regime: regimeInfo.regime,
      regimeLabel: regimeInfo.label,
      regimeDescription: regimeInfo.description,
      hitRatePct: round2((hitCount / records.length) * 100),
      polarizationIndex: round2(top10Avg - bottom10Avg),
      avgActualGrowth: round2(avgActual),
      mae: round2(mae),
    };
  }

  // Precompute 2021 comparison deltas once at startup for zero-allocation lookups
  const comparisonDeltaByYear = {} as Record<YearValue, Record<string, ComparisonDelta>>;
  const base2021Map = mapByYear[2021];
  for (const year of TIMELINE_YEARS) {
    const deltaMap: Record<string, ComparisonDelta> = {};
    for (const rec of dataByYear[year]) {
      const base2021 = base2021Map[rec.regionCode];
      if (base2021) {
        rec.growthDelta = round2(rec.actualGrowth - base2021.actualGrowth);
        rec.priceDeltaPct = round2(
          ((rec.pricePerSqm - base2021.pricePerSqm) / base2021.pricePerSqm) * 100
        );
        rec.errorDelta = round2(rec.error - base2021.error);
      }
      deltaMap[rec.regionCode] = {
        growthDelta: rec.growthDelta,
        priceDeltaPct: rec.priceDeltaPct,
        errorDelta: rec.errorDelta,
      };
    }
    comparisonDeltaByYear[year] = deltaMap;
  }

  return { dataByYear, mapByYear, summaries, top10ByYear, comparisonDeltaByYear };
}

const BUILT = buildAllRegimeData();

export const REGIME_DATA_BY_YEAR = BUILT.dataByYear;
export const REGIME_MAP_BY_YEAR = BUILT.mapByYear;
export const YEAR_SUMMARIES = BUILT.summaries;
export const TOP_10_CODES_BY_YEAR = BUILT.top10ByYear;
export const COMPARISON_DELTA_BY_YEAR = BUILT.comparisonDeltaByYear;

const ZERO_DELTA: ComparisonDelta = { growthDelta: 0, priceDeltaPct: 0, errorDelta: 0 };

export function getRegionComparisonDelta(
  regionCode: string,
  year: YearValue
): ComparisonDelta {
  return COMPARISON_DELTA_BY_YEAR[year]?.[regionCode] ?? ZERO_DELTA;
}
