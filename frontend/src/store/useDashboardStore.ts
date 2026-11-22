import { create } from 'zustand';
import { INITIAL_ACTIVE_FACILITIES } from '../config/facilities';
import { INITIAL_ACTIVE_INDUSTRIES } from '../config/industries';
import {
  LATEST_OBSERVED_QUARTER,
  TIMELINE_QUARTERS,
  type AiAccuracyFilter,
  type BriefingTab,
  type ErrorToleranceBand,
  type FacilityKey,
  type GeoSourceStatus,
  type IndustryKey,
  type MapViewMode,
  type ModelName,
  type QuarterValue,
} from '../types/dashboard';

export const INITIAL_TOLERANCE_BANDS: Record<ErrorToleranceBand, boolean> = {
  '0_2': true,
  '2_4': true,
  '4_6': true,
  '6_plus': true,
};

export interface DashboardState {
  selectedQuarter: QuarterValue;
  selectedModel: ModelName;
  viewMode: MapViewMode;
  aiAccuracyFilter: AiAccuracyFilter;
  activeToleranceBands: Record<ErrorToleranceBand, boolean>;
  briefingTab: BriefingTab;
  isPlaying: boolean;
  spotlightMode: boolean;
  comparisonMode: boolean;
  activeFacilities: Record<FacilityKey, boolean>;
  activeIndustries: Record<IndustryKey, boolean>;
  selectedRegionCode: string | null;
  hoveredRegionCode: string | null;
  geoStatus: GeoSourceStatus;
  forceFallbackGeo: boolean;
  ecoMode: boolean;
  cameraResetTick: number;
  dataSource: 'mock' | 'postgres';
  dataVersion: number;

  setSelectedQuarter: (quarter: QuarterValue) => void;
  stepQuarter: () => void;
  setSelectedModel: (model: ModelName) => void;
  setViewMode: (mode: MapViewMode) => void;
  setAiAccuracyFilter: (filter: AiAccuracyFilter) => void;
  toggleToleranceBand: (band: ErrorToleranceBand) => void;
  resetToleranceBands: () => void;
  setBriefingTab: (tab: BriefingTab) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  toggleSpotlightMode: () => void;
  toggleComparisonMode: () => void;
  toggleFacility: (key: FacilityKey) => void;
  toggleIndustry: (key: IndustryKey) => void;
  setSelectedRegionCode: (code: string | null) => void;
  setHoveredRegionCode: (code: string | null) => void;
  setGeoStatus: (status: GeoSourceStatus) => void;
  toggleForceFallbackGeo: () => void;
  toggleEcoMode: () => void;
  triggerCameraReset: () => void;
  markPostgresDataLoaded: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedQuarter: LATEST_OBSERVED_QUARTER,
  selectedModel: 'price_lcns',
  viewMode: 'market',
  aiAccuracyFilter: 'all',
  activeToleranceBands: { ...INITIAL_TOLERANCE_BANDS },
  briefingTab: 'ratio',
  isPlaying: false,
  spotlightMode: false,
  comparisonMode: false,
  activeFacilities: { ...INITIAL_ACTIVE_FACILITIES },
  activeIndustries: { ...INITIAL_ACTIVE_INDUSTRIES },
  selectedRegionCode: null,
  hoveredRegionCode: null,
  geoStatus: 'loading',
  forceFallbackGeo: false,
  ecoMode: false,
  cameraResetTick: 0,
  dataSource: 'mock',
  dataVersion: 0,

  setSelectedQuarter: (quarter) => set({ selectedQuarter: quarter }),

  stepQuarter: () =>
    set((state) => {
      const idx = TIMELINE_QUARTERS.indexOf(state.selectedQuarter);
      if (idx >= TIMELINE_QUARTERS.length - 1) {
        return { isPlaying: false };
      }
      const nextIdx = idx + 1;
      return {
        selectedQuarter: TIMELINE_QUARTERS[nextIdx],
        isPlaying: nextIdx < TIMELINE_QUARTERS.length - 1,
      };
    }),

  setSelectedModel: (model) => set({ selectedModel: model }),
  setViewMode: (mode) =>
    set({
      viewMode: mode,
      aiAccuracyFilter: 'all',
      activeToleranceBands: { ...INITIAL_TOLERANCE_BANDS },
    }),
  setAiAccuracyFilter: (filter) => set({ aiAccuracyFilter: filter }),
  toggleToleranceBand: (band) =>
    set((state) => ({
      aiAccuracyFilter: 'all',
      activeToleranceBands: {
        ...state.activeToleranceBands,
        [band]: !state.activeToleranceBands[band],
      },
    })),
  resetToleranceBands: () =>
    set({
      aiAccuracyFilter: 'all',
      activeToleranceBands: { ...INITIAL_TOLERANCE_BANDS },
    }),
  setBriefingTab: (tab) => set({ briefingTab: tab }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  togglePlaying: () =>
    set((state) => {
      if (state.isPlaying) {
        return { isPlaying: false };
      }
      const atEnd = state.selectedQuarter === TIMELINE_QUARTERS[TIMELINE_QUARTERS.length - 1];
      return {
        selectedQuarter: atEnd ? TIMELINE_QUARTERS[0] : state.selectedQuarter,
        isPlaying: true,
      };
    }),
  toggleSpotlightMode: () => set((state) => ({ spotlightMode: !state.spotlightMode })),
  toggleComparisonMode: () => set((state) => ({ comparisonMode: !state.comparisonMode })),

  toggleFacility: (key) =>
    set((state) => ({
      activeFacilities: {
        ...state.activeFacilities,
        [key]: !state.activeFacilities[key],
      },
    })),

  toggleIndustry: (key) =>
    set((state) => ({
      activeIndustries: {
        ...state.activeIndustries,
        [key]: !state.activeIndustries[key],
      },
    })),

  setSelectedRegionCode: (code) =>
    set((state) => {
      const nextCode = state.selectedRegionCode === code ? null : code;
      const shouldResetCamera = nextCode === null && state.selectedRegionCode !== null;
      return {
        selectedRegionCode: nextCode,
        cameraResetTick: shouldResetCamera ? state.cameraResetTick + 1 : state.cameraResetTick,
      };
    }),

  setHoveredRegionCode: (code) => set({ hoveredRegionCode: code }),
  setGeoStatus: (status) => set({ geoStatus: status }),
  toggleForceFallbackGeo: () => set((state) => ({ forceFallbackGeo: !state.forceFallbackGeo })),
  toggleEcoMode: () => set((state) => ({ ecoMode: !state.ecoMode })),
  triggerCameraReset: () =>
    set((state) => ({
      selectedRegionCode: null,
      cameraResetTick: state.cameraResetTick + 1,
    })),
  markPostgresDataLoaded: () =>
    set((state) => ({
      dataSource: 'postgres',
      dataVersion: state.dataVersion + 1,
    })),
}));
