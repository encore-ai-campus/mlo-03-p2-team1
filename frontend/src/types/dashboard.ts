import type * as THREE from 'three';

export type MarketRegime = 'BOOM' | 'SLUMP' | 'POLARIZATION';

export type FacilityKey = 'subway' | 'jobs' | 'school' | 'commercial' | 'hospital';

export type YearValue = 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026;

export const TIMELINE_YEARS: YearValue[] = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

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
  regionCode: string;
  regionName: string;
  sido: string;
  centroid: [number, number]; // [lng, lat]
  tier: RegionTier;
  basePricePerSqm: number; // 2020 baseline price in 만원/m²
  facilityScores: FacilityScores;
}

export interface ComparisonDelta {
  growthDelta: number;
  priceDeltaPct: number;
  errorDelta: number;
}

export interface RegionYearRecord {
  regionCode: string;
  regionName: string;
  sido: string;
  centroid: [number, number];
  actualGrowth: number; // %
  predictedGrowth: number; // %
  error: number; // actualGrowth - predictedGrowth (%p)
  pricePerSqm: number; // 만원/m²
  facilityScores: FacilityScores;
  topDrivers: [FacilityKey, FacilityKey];
  growthDelta: number;
  priceDeltaPct: number;
  errorDelta: number;
}

export interface YearSummaryMetrics {
  year: YearValue;
  regime: MarketRegime;
  regimeLabel: string;
  regimeDescription: string;
  hitRatePct: number; // % of regions where |error| <= 2.0
  polarizationIndex: number; // top 10% avg growth - bottom 10% avg growth (%p)
  avgActualGrowth: number;
  mae: number; // Mean Absolute Error (%p)
}

export interface ProjectedRegionGeometry {
  regionCode: string;
  shapes: THREE.Shape[];
  districtName?: string;
  districtCenter3D?: [number, number];
  center3D: [number, number]; // [x, z] in world space
  boundsRadius: number;
}

export type GeoSourceStatus = 'loading' | 'topojson' | 'fallback';

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
