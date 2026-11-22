import * as THREE from 'three';
import { ERROR_HIT_THRESHOLD } from '../config/scene';
import type { ErrorToleranceBand } from '../types/dashboard';

// Immutable module-level reference colors (zero per-frame allocations)
const COLOR_BASE_SLATE = new THREE.Color('#182235');
const COLOR_COLD_MID = new THREE.Color('#1e40af');
const COLOR_COLD_BLUE = new THREE.Color('#3b82f6');
const COLOR_WARM_MID = new THREE.Color('#991b1b');
const COLOR_HOT_RED = new THREE.Color('#ef4444');

const EMISSIVE_BLACK = new THREE.Color('#000000');
const EMISSIVE_COMP_WARM = new THREE.Color('#ef4444');
const EMISSIVE_COMP_COLD = new THREE.Color('#2563eb');
const EMISSIVE_HOT_BASE = new THREE.Color('#2b0a12');
const EMISSIVE_HOT_GLOW = new THREE.Color('#f43f5e');
const EMISSIVE_COLD_BASE = new THREE.Color('#071329');
const EMISSIVE_COLD_GLOW = new THREE.Color('#2563eb');
const EMISSIVE_DEFAULT = new THREE.Color('#090f1d');

// Steep Korean traffic-light accuracy palette (Green <=2%p, Yellow 2~3.5%p, Red >3.5%p)
const ACC_HIT_GREEN = new THREE.Color('#059669');
const ACC_WARN_YELLOW = new THREE.Color('#eab308');
const ACC_MISS_RED = new THREE.Color('#dc2626');
const ACC_HIT_EMISSIVE = new THREE.Color('#10b981');
const ACC_WARN_EMISSIVE = new THREE.Color('#fde047');
const ACC_MISS_EMISSIVE = new THREE.Color('#ef4444');

const ERR_PIN_AMBER = new THREE.Color('#f59e0b');
const ERR_PIN_RED = new THREE.Color('#ef4444');

const MARKET_UP_LOW = new THREE.Color('#fb7185');
const MARKET_UP_HIGH = new THREE.Color('#ef4444');
const MARKET_DOWN_LOW = new THREE.Color('#60a5fa');
const MARKET_DOWN_HIGH = new THREE.Color('#2563eb');

export function getTerrainColor(
  growth: number,
  isComparison: boolean,
  out: THREE.Color,
): THREE.Color {
  if (isComparison) {
    // Delta vs 2021 boom (-35%p to +15%p)
    const t = THREE.MathUtils.clamp((growth + 25) / 35, 0, 1);
    if (t < 0.5) {
      const k = t * 2;
      out.setRGB(
        THREE.MathUtils.lerp(0.05, 0.11, k),
        THREE.MathUtils.lerp(0.16, 0.16, k),
        THREE.MathUtils.lerp(0.55, 0.24, k),
      );
    } else {
      const k = (t - 0.5) * 2;
      out.setRGB(
        THREE.MathUtils.lerp(0.11, 0.96, k),
        THREE.MathUtils.lerp(0.16, 0.58, k),
        THREE.MathUtils.lerp(0.24, 0.12, k),
      );
    }
    return out;
  }

  // High-contrast market temperature (Korean Red = 상승, Blue = 하락):
  // Saturates at ±9% so both actual and smoother AI predicted growth pop cleanly
  if (growth < 0) {
    const k = THREE.MathUtils.clamp(Math.abs(growth) / 9, 0, 1);
    if (k < 0.45) {
      const t = k / 0.45;
      return out.copy(COLOR_BASE_SLATE).lerp(COLOR_COLD_MID, t);
    }
    const t = (k - 0.45) / 0.55;
    return out.copy(COLOR_COLD_MID).lerp(COLOR_COLD_BLUE, t);
  }

  const k = THREE.MathUtils.clamp(growth / 9, 0, 1);
  if (k < 0.4) {
    const t = k / 0.4;
    return out.copy(COLOR_BASE_SLATE).lerp(COLOR_WARM_MID, t);
  }
  const t = (k - 0.4) / 0.6;
  return out.copy(COLOR_WARM_MID).lerp(COLOR_HOT_RED, t);
}

export function getTerrainEmissive(
  growth: number,
  isComparison: boolean,
  out: THREE.Color,
): THREE.Color {
  if (isComparison) {
    if (growth > 0) {
      const k = THREE.MathUtils.clamp(growth / 12, 0, 1);
      return out.copy(EMISSIVE_BLACK).lerp(EMISSIVE_COMP_WARM, k * 0.9);
    }
    const k = THREE.MathUtils.clamp(Math.abs(growth) / 28, 0, 1);
    return out.copy(EMISSIVE_BLACK).lerp(EMISSIVE_COMP_COLD, k * 0.55);
  }

  if (growth >= 1.8) {
    const k = THREE.MathUtils.clamp((growth - 1.8) / 8, 0, 1);
    return out.copy(EMISSIVE_HOT_BASE).lerp(EMISSIVE_HOT_GLOW, k);
  }
  if (growth <= -1.8) {
    const k = THREE.MathUtils.clamp((Math.abs(growth) - 1.8) / 8, 0, 1);
    return out.copy(EMISSIVE_COLD_BASE).lerp(EMISSIVE_COLD_GLOW, k * 0.78);
  }
  return out.copy(EMISSIVE_DEFAULT);
}

export function getAccuracyTerrainColor(absError: number, out: THREE.Color): THREE.Color {
  // Steep 3-band traffic light:
  // <= 2.0%p: solid Signal Green
  // 2.0 ~ 3.5%p: crisp Signal Yellow (very tight 0.3%p blend at boundary to avoid muddy olive)
  // > 3.5%p: vivid Signal Red (tight 0.4%p blend into pure red)
  if (absError <= ERROR_HIT_THRESHOLD) {
    return out.copy(ACC_HIT_GREEN);
  }
  if (absError <= 2.3) {
    const t = THREE.MathUtils.clamp((absError - ERROR_HIT_THRESHOLD) / 0.3, 0, 1);
    return out.copy(ACC_HIT_GREEN).lerp(ACC_WARN_YELLOW, t);
  }
  if (absError <= 3.5) {
    return out.copy(ACC_WARN_YELLOW);
  }
  const t = THREE.MathUtils.clamp((absError - 3.5) / 0.4, 0, 1);
  return out.copy(ACC_WARN_YELLOW).lerp(ACC_MISS_RED, t);
}

export function getAccuracyTerrainEmissive(absError: number, out: THREE.Color): THREE.Color {
  if (absError <= ERROR_HIT_THRESHOLD) {
    return out.copy(ACC_HIT_EMISSIVE);
  }
  if (absError <= 2.3) {
    const t = THREE.MathUtils.clamp((absError - ERROR_HIT_THRESHOLD) / 0.3, 0, 1);
    return out.copy(ACC_HIT_EMISSIVE).lerp(ACC_WARN_EMISSIVE, t);
  }
  if (absError <= 3.5) {
    return out.copy(ACC_WARN_EMISSIVE);
  }
  const t = THREE.MathUtils.clamp((absError - 3.5) / 0.4, 0, 1);
  return out.copy(ACC_WARN_EMISSIVE).lerp(ACC_MISS_EMISSIVE, t);
}

export function getErrorBarColor(error: number, out: THREE.Color): THREE.Color {
  const absErr = Math.abs(error);
  const t = THREE.MathUtils.clamp((absErr - 3) / 4, 0, 1);
  return out.copy(ERR_PIN_AMBER).lerp(ERR_PIN_RED, t);
}

const BAND_COLOR_0_2 = new THREE.Color('#047857'); // Deep calm emerald (0~2%p)
const BAND_COLOR_2_4 = new THREE.Color('#0369a1'); // Cool sky blue (2~4%p)
const BAND_COLOR_4_6 = new THREE.Color('#d97706'); // Warm amber (4~6%p)
const BAND_COLOR_6_PLUS = new THREE.Color('#e11d48'); // Vivid rose red (6%p+)

const BAND_EMISSIVE_0_2 = new THREE.Color('#10b981');
const BAND_EMISSIVE_2_4 = new THREE.Color('#38bdf8');
const BAND_EMISSIVE_4_6 = new THREE.Color('#f59e0b');
const BAND_EMISSIVE_6_PLUS = new THREE.Color('#f43f5e');

export function getToleranceBandColor(band: ErrorToleranceBand, out: THREE.Color): THREE.Color {
  switch (band) {
    case '0_2':
      return out.copy(BAND_COLOR_0_2);
    case '2_4':
      return out.copy(BAND_COLOR_2_4);
    case '4_6':
      return out.copy(BAND_COLOR_4_6);
    case '6_plus':
      return out.copy(BAND_COLOR_6_PLUS);
  }
}

export function getToleranceBandEmissive(band: ErrorToleranceBand, out: THREE.Color): THREE.Color {
  switch (band) {
    case '0_2':
      return out.copy(BAND_EMISSIVE_0_2);
    case '2_4':
      return out.copy(BAND_EMISSIVE_2_4);
    case '4_6':
      return out.copy(BAND_EMISSIVE_4_6);
    case '6_plus':
      return out.copy(BAND_EMISSIVE_6_PLUS);
  }
}

export function getMarketPillarColor(growth: number, out: THREE.Color): THREE.Color {
  if (growth >= 0) {
    const t = THREE.MathUtils.clamp(growth / 10, 0, 1);
    return out.copy(MARKET_UP_LOW).lerp(MARKET_UP_HIGH, t); // Korean Red: 상승
  }
  const t = THREE.MathUtils.clamp(Math.abs(growth) / 10, 0, 1);
  return out.copy(MARKET_DOWN_LOW).lerp(MARKET_DOWN_HIGH, t); // Korean Blue: 하락
}
