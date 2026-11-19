import { create } from 'zustand';
import type { FacilityKey, GeoSourceStatus, YearValue } from '../types/dashboard';

export interface DashboardState {
  selectedYear: YearValue;
  isPlaying: boolean;
  spotlightMode: boolean;
  comparisonMode: boolean;
  activeFacilities: Record<FacilityKey, boolean>;
  selectedRegionCode: string | null;
  hoveredRegionCode: string | null;
  geoStatus: GeoSourceStatus;
  forceFallbackGeo: boolean;
  ecoMode: boolean;
  cameraResetTick: number;

  setSelectedYear: (year: YearValue) => void;
  stepYear: () => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  toggleSpotlightMode: () => void;
  toggleComparisonMode: () => void;
  toggleFacility: (key: FacilityKey) => void;
  setSelectedRegionCode: (code: string | null) => void;
  setHoveredRegionCode: (code: string | null) => void;
  setGeoStatus: (status: GeoSourceStatus) => void;
  toggleForceFallbackGeo: () => void;
  toggleEcoMode: () => void;
  triggerCameraReset: () => void;
}

const YEARS: YearValue[] = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedYear: 2025,
  isPlaying: false,
  spotlightMode: false,
  comparisonMode: false,
  activeFacilities: {
    jobs: true,
    subway: true,
    school: false,
    commercial: false,
    hospital: false,
  },
  selectedRegionCode: null,
  hoveredRegionCode: null,
  geoStatus: 'loading',
  forceFallbackGeo: false,
  ecoMode: false,
  cameraResetTick: 0,

  setSelectedYear: (year) => set({ selectedYear: year }),

  stepYear: () =>
    set((state) => {
      const idx = YEARS.indexOf(state.selectedYear);
      const next = YEARS[(idx + 1) % YEARS.length];
      return { selectedYear: next };
    }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleSpotlightMode: () => set((state) => ({ spotlightMode: !state.spotlightMode })),
  toggleComparisonMode: () => set((state) => ({ comparisonMode: !state.comparisonMode })),

  toggleFacility: (key) =>
    set((state) => ({
      activeFacilities: {
        ...state.activeFacilities,
        [key]: !state.activeFacilities[key],
      },
    })),

  setSelectedRegionCode: (code) =>
    set((state) => ({
      selectedRegionCode: state.selectedRegionCode === code ? null : code,
    })),

  setHoveredRegionCode: (code) => set({ hoveredRegionCode: code }),
  setGeoStatus: (status) => set({ geoStatus: status }),
  toggleForceFallbackGeo: () => set((state) => ({ forceFallbackGeo: !state.forceFallbackGeo })),
  toggleEcoMode: () => set((state) => ({ ecoMode: !state.ecoMode })),
  triggerCameraReset: () =>
    set((state) => ({
      selectedRegionCode: null,
      cameraResetTick: state.cameraResetTick + 1,
    })),
}));
