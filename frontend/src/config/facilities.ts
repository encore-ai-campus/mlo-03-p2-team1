import type { FacilityKey } from '../types/dashboard';

export interface FacilityMetaEntry {
  label: string;
  shortLabel: string;
  layerSubtitle: string;
  color: string;
  description: string;
}

export const FACILITY_ORDER: readonly FacilityKey[] = [
  'jobs',
  'subway',
  'school',
  'commercial',
  'hospital',
];

export type RippleFacilityKey = Extract<FacilityKey, 'school' | 'commercial' | 'hospital'>;

export const RIPPLE_FACILITIES: readonly RippleFacilityKey[] = ['school', 'commercial', 'hospital'];

export const INITIAL_ACTIVE_FACILITIES: Record<FacilityKey, boolean> = {
  jobs: true,
  subway: true,
  school: false,
  commercial: false,
  hospital: false,
};

export const FACILITY_META: Record<FacilityKey, FacilityMetaEntry> = {
  jobs: {
    label: '일자리·업무지구',
    shortLabel: '일자리',
    layerSubtitle: '업무지구 유입 입자',
    color: '#f59e0b',
    description: '핵심 업무지구(GBD·YBD·판교·지방산단)로의 직주근접 에너지 유입',
  },
  subway: {
    label: '지하철·광역철도',
    shortLabel: '지하철',
    layerSubtitle: '철도축 빛 펄스',
    color: '#38bdf8',
    description: '수도권 GTX·지하철 및 광역시 핵심 철도축 접근성 펄스',
  },
  school: {
    label: '학군·교육인프라',
    shortLabel: '학교',
    layerSubtitle: '우수 지역 파동 링',
    color: '#a855f7',
    description: '명문 학군지 및 학원가 밀집 지역 파동 영향력',
  },
  commercial: {
    label: '대형상권·생활편의',
    shortLabel: '상권',
    layerSubtitle: '우수 지역 파동 링',
    color: '#ec4899',
    description: '핵심 상권·백화점·복합쇼핑몰 집객 파동',
  },
  hospital: {
    label: '상급종합병원',
    shortLabel: '병원',
    layerSubtitle: '우수 지역 파동 링',
    color: '#10b981',
    description: '권역 상급종합병원 및 의료 인프라 접근성',
  },
};
