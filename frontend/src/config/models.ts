import type { ModelName } from '../types/dashboard';

export const MODEL_VERSION = '57b6837e9744';

export interface ModelMetaEntry {
  key: ModelName;
  label: string;
  shortLabel: string;
  description: string;
  overallMapePct: number;
  directionAccPct: number | null;
}

export const MODEL_ORDER: readonly ModelName[] = ['baseline', 'price', 'price_lcns'];

export const MODEL_META: Record<ModelName, ModelMetaEntry> = {
  baseline: {
    key: 'baseline',
    label: '기준선 (Baseline)',
    shortLabel: '기준선',
    description: '다음 분기 변화율 0% 가정 (비교 기준)',
    overallMapePct: 4.74,
    directionAccPct: null,
  },
  price: {
    key: 'price',
    label: '집값만 (Price)',
    shortLabel: '집값만',
    description: '동·구·서울 가격 흐름 및 거래 건수 피처',
    overallMapePct: 4.38,
    directionAccPct: 72.3,
  },
  price_lcns: {
    key: 'price_lcns',
    label: '집값+상권 (Price+Lcns)',
    shortLabel: '집값+상권',
    description: '집값 피처 + 인허가 6개 업종 증감 피처',
    overallMapePct: 4.37,
    directionAccPct: 72.4,
  },
};
