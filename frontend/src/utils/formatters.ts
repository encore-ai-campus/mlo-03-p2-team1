import { ERROR_HIT_THRESHOLD } from '../config/scene';

export type ErrorDirection = 'hit' | 'underpredicted' | 'overpredicted';

export function isPredictionHit(error: number): boolean {
  return Math.abs(error) <= ERROR_HIT_THRESHOLD;
}

export function classifyError(error: number): ErrorDirection {
  if (isPredictionHit(error)) return 'hit';
  return error > ERROR_HIT_THRESHOLD ? 'underpredicted' : 'overpredicted';
}

export function formatSignedPercent(value: number, digits = 1): string {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(digits)}%`;
}

export function formatSignedPctPoint(value: number, digits = 1): string {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(digits)}%p`;
}
