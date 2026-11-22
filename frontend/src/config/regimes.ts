import type { MarketRegime } from '../types/dashboard';

export interface RegimeThemeStyle {
  shortLabel: string;
  pill: string;
  dot: string;
  dotSimple: string;
  activeButton: string;
}

export const REGIME_THEME: Record<MarketRegime, RegimeThemeStyle> = {
  BOOM: {
    shortLabel: '동반상승',
    pill: 'bg-amber-500/15 text-amber-300 border-amber-400/35',
    dot: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
    dotSimple: 'bg-amber-400',
    activeButton:
      'border-amber-400/70 bg-amber-500/20 text-amber-200 shadow-[0_0_16px_-4px_rgba(251,191,36,0.55)]',
  },
  SLUMP: {
    shortLabel: '금리침체',
    pill: 'bg-blue-500/15 text-blue-300 border-blue-400/35',
    dot: 'bg-blue-400 shadow-[0_0_8px_#60a5fa]',
    dotSimple: 'bg-blue-400',
    activeButton:
      'border-blue-400/70 bg-blue-500/20 text-blue-200 shadow-[0_0_16px_-4px_rgba(96,165,250,0.55)]',
  },
  POLARIZATION: {
    shortLabel: '초양극화',
    pill: 'bg-rose-500/15 text-rose-300 border-rose-400/35',
    dot: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]',
    dotSimple: 'bg-rose-500',
    activeButton:
      'border-rose-400/70 bg-rose-500/20 text-rose-200 shadow-[0_0_16px_-4px_rgba(244,63,94,0.55)]',
  },
};
