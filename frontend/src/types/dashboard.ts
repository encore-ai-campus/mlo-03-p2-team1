import type * as THREE from 'three';

export type MarketRegime = 'BOOM' | 'SLUMP' | 'POLARIZATION';

export type FacilityKey = 'subway' | 'jobs' | 'school' | 'commercial' | 'hospital';

export type IndustryKey = 'GENERAL_FOOD' | 'REST_FOOD' | 'CAFE' | 'CLINIC' | 'PHARMACY' | 'BEAUTY';

export interface IndustryQuarterStats {
  openCnt: number; // 분기 개업 수
  closeCnt: number; // 분기 폐업 수
  activeCnt: number; // 분기 말 영업 수 (재고)
  netCnt: number; // 순증 (openCnt - closeCnt)
}

export type IndustryStatsMap = Record<IndustryKey, IndustryQuarterStats>;

export interface RegionQuarterTrendPoint {
  quarter: QuarterValue;
  priceIdx: number | null;
  predPriceIdx: number | null;
  pricePerSqm: number | null;
  totalOpenCnt: number;
  totalCloseCnt: number;
  totalActiveCnt: number;
  totalNetCnt: number;
}

export type ModelName = 'baseline' | 'price' | 'price_lcns';

export type MapViewMode = 'market' | 'error';

export type AiAccuracyFilter = 'all' | 'hit' | 'miss';

export type ErrorToleranceBand = '0_2' | '2_4' | '4_6' | '6_plus';

export type BriefingTab = 'ratio' | 'top6';

export type QuarterNum = 1 | 2 | 3 | 4;

export type TimelineYear = 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026;

export type QuarterValue = `${TimelineYear}Q${QuarterNum}`;

export const TIMELINE_YEARS: readonly TimelineYear[] = [
  2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
];

export const TIMELINE_QUARTERS: readonly QuarterValue[] = TIMELINE_YEARS.flatMap((year) =>
  ([1, 2, 3, 4] as const).map((q) => `${year}Q${q}` as QuarterValue),
);

export const LATEST_OBSERVED_QUARTER: QuarterValue = '2026Q3';
export const FORECAST_QUARTER: QuarterValue = '2026Q4';

export type QuarterPeriodType = 'train' | 'eval' | 'forecast';

export type RegionTier =
  | 'PRIME_SEOUL'
  | 'CORE_SEOUL'
  | 'CORE_GYEONGGI'
  | 'OUTER_METRO'
  | 'METRO_CITY_CORE'
  | 'METRO_CITY'
  | 'PROVINCIAL_HUB'
  | 'PROVINCIAL_RURAL';

export type FacilityScores = Record<FacilityKey, number>;

export interface RegionMeta {
  regionCode: string; // 10-digit LDONG_CD
  regionName: string; // 법정동명 (LDONG_NM)
  sido: string; // 시도명
  sggCode: string; // 5-digit SGG_CD
  sggName: string; // 자치구명 (SGG_NM)
  centroid: [number, number]; // [lng, lat]
  tier: RegionTier;
  basePricePerSqm: number; // baseline price in 만원/m²
  facilityScores: FacilityScores;
}

export interface ComparisonDelta {
  growthDelta: number | null;
  priceDeltaPct: number | null;
  errorDelta: number | null;
}

export interface ModelPredictionMetrics {
  predictedGrowth: number; // % (same-complex 1Q predicted return)
  error: number | null; // actualGrowth - predictedGrowth (%p), null on forecast quarter
  predPricePerSqm: number | null; // 만원/m²
  predPriceIdx: number | null; // BASE_PRICE_IDX * exp(PRED_RET)
}

export interface RegionQuarterRecord {
  regionCode: string;
  regionName: string;
  sido: string;
  sggCode: string;
  sggName: string;
  centroid: [number, number];
  quarter: QuarterValue;
  hasObservedTradeYn: boolean; // dim_region.HAS_OBSERVED_TRADE_YN
  tradeCnt: number; // fact_apt_trd_qtr.TRADE_CNT
  lowSampleYn: boolean; // 표본 < 5건 (LOW_SAMPLE_YN)
  pricePerSqm: number | null; // 만원/m² (거래 없으면 null)
  priceIdx: number | null; // fact_apt_idx_qtr 같은 단지 가격 지수 (기준 100)
  actualGrowth: number | null; // % (미관측 또는 2026Q4 예측 분기는 null)
  predictions: Record<ModelName, ModelPredictionMetrics> | null;
  industryStats: IndustryStatsMap; // Gold 인허가 분석 업종 6개 (open/close/active/net)
  convenienceActiveCnt: number; // 참고 지표: 편의점 분기 말 영업 수
  facilityScores: FacilityScores;
  topDrivers: [FacilityKey, FacilityKey];
  growthDelta: number | null; // vs 2021 same quarter (%p)
  priceDeltaPct: number | null; // vs 2021 same quarter (%)
  errorDelta: number | null; // vs 2021 same quarter (%p)
}

export interface QuarterSummaryMetrics {
  quarter: QuarterValue;
  year: TimelineYear;
  quarterNum: QuarterNum;
  periodType: QuarterPeriodType;
  regime: MarketRegime;
  regimeLabel: string;
  regimeDescription: string;
  observedDongCount: number;
  lowSampleDongCount: number;
  nonTradeDongCount: number;
  evaluatedDongCount: number;
  hitRateByModel: Record<ModelName, number | null>; // % where |error| <= 2.0
  maeByModel: Record<ModelName, number | null>; // %p
  polarizationIndex: number | null; // top 10% - bottom 10% (%p)
  avgActualGrowth: number | null;
}

export interface ProjectedRegionGeometry {
  regionCode: string;
  shapes: THREE.Shape[];
  center3D: [number, number]; // [x, z] in world space
  boundsRadius: number;
}

export type GeoSourceStatus = 'loading' | 'geojson' | 'fallback';

export interface FacilityHubLink {
  fromCode: string;
  toCode: string;
  strength: number;
}

export interface TransitCorridor {
  id: string;
  name: string;
  color: string;
  regionCodes: string[];
}
