import type { IndustryKey } from '../types/dashboard';

export interface IndustryMetaEntry {
  key: IndustryKey;
  label: string;
  shortLabel: string;
  layerSubtitle: string;
  color: string;
  description: string;
}

export const INDUSTRY_ORDER: readonly IndustryKey[] = [
  'GENERAL_FOOD',
  'REST_FOOD',
  'CAFE',
  'CLINIC',
  'PHARMACY',
  'BEAUTY',
];

export const INITIAL_ACTIVE_INDUSTRIES: Record<IndustryKey, boolean> = {
  GENERAL_FOOD: true,
  REST_FOOD: false,
  CAFE: true,
  CLINIC: false,
  PHARMACY: false,
  BEAUTY: false,
};

export const INDUSTRY_META: Record<IndustryKey, IndustryMetaEntry> = {
  GENERAL_FOOD: {
    key: 'GENERAL_FOOD',
    label: '일반음식점',
    shortLabel: '일반음식',
    layerSubtitle: '분기 말 영업·순증 상위 법정동',
    color: '#f59e0b',
    description: '한식·중식·일식 등 일반음식점 인허가 (비음식입지·카페 제외)',
  },
  REST_FOOD: {
    key: 'REST_FOOD',
    label: '휴게음식점',
    shortLabel: '휴게음식',
    layerSubtitle: '분기 말 영업·순증 상위 법정동',
    color: '#fb7185',
    description: '카페·편의점을 제외한 휴게음식점(분식·패스트푸드 등)',
  },
  CAFE: {
    key: 'CAFE',
    label: '카페',
    shortLabel: '카페',
    layerSubtitle: '분기 말 영업·순증 상위 법정동',
    color: '#38bdf8',
    description: '커피숍·카페 업태 및 상호 키워드 규칙 분류 업소',
  },
  CLINIC: {
    key: 'CLINIC',
    label: '의원',
    shortLabel: '의원',
    layerSubtitle: '분기 말 영업 수(재고) 상위 법정동',
    color: '#10b981',
    description: '의원·치과의원·한의원 의료 인프라 인허가',
  },
  PHARMACY: {
    key: 'PHARMACY',
    label: '약국',
    shortLabel: '약국',
    layerSubtitle: '분기 말 영업 수(재고) 상위 법정동',
    color: '#22d3ee',
    description: '법정동별 약국 인허가 영업 현황',
  },
  BEAUTY: {
    key: 'BEAUTY',
    label: '미용업',
    shortLabel: '미용업',
    layerSubtitle: '분기 말 영업·순증 상위 법정동',
    color: '#a855f7',
    description: '일반미용·피부·네일 등 생활 밀착 미용업 인허가',
  },
};
