import * as THREE from 'three';

// Immutable module-level reference colors (zero per-frame allocations)
const COLOR_BASE_SLATE = new THREE.Color('#182235');
const COLOR_COLD_BLUE = new THREE.Color('#0c3b82');
const COLOR_WARM_AMBER = new THREE.Color('#92400e');
const COLOR_HOT_ORANGE = new THREE.Color('#ff7b1c');

const EMISSIVE_BLACK = new THREE.Color('#000000');
const EMISSIVE_COMP_WARM = new THREE.Color('#ff6a00');
const EMISSIVE_COMP_COLD = new THREE.Color('#1d4ed8');
const EMISSIVE_HOT_BASE = new THREE.Color('#331100');
const EMISSIVE_HOT_GLOW = new THREE.Color('#ff5e14');
const EMISSIVE_COLD_BASE = new THREE.Color('#051024');
const EMISSIVE_COLD_GLOW = new THREE.Color('#1e40af');
const EMISSIVE_DEFAULT = new THREE.Color('#090f1d');

const ERR_HIT_CYAN = new THREE.Color('#22d3ee');
const ERR_POS_LOW = new THREE.Color('#fb923c');
const ERR_POS_HIGH = new THREE.Color('#ff1e56');
const ERR_NEG_LOW = new THREE.Color('#3b82f6');
const ERR_NEG_HIGH = new THREE.Color('#a855f7');

export function getTerrainColor(
  growth: number,
  isComparison: boolean,
  out: THREE.Color
): THREE.Color {
  if (isComparison) {
    // Delta vs 2021 boom (-35%p to +15%p)
    const t = THREE.MathUtils.clamp((growth + 25) / 35, 0, 1);
    if (t < 0.5) {
      const k = t * 2;
      out.setRGB(
        THREE.MathUtils.lerp(0.05, 0.11, k),
        THREE.MathUtils.lerp(0.16, 0.16, k),
        THREE.MathUtils.lerp(0.55, 0.24, k)
      );
    } else {
      const k = (t - 0.5) * 2;
      out.setRGB(
        THREE.MathUtils.lerp(0.11, 0.96, k),
        THREE.MathUtils.lerp(0.16, 0.58, k),
        THREE.MathUtils.lerp(0.24, 0.12, k)
      );
    }
    return out;
  }

  // Standard market temperature:
  // <= -12%: deep cool ice blue (#0c3b82)
  // 0%: dark slate (#182235)
  // >= +16%: glowing molten gold/orange (#ff7b1c)
  if (growth < 0) {
    const k = THREE.MathUtils.clamp(Math.abs(growth) / 14, 0, 1);
    return out.copy(COLOR_BASE_SLATE).lerp(COLOR_COLD_BLUE, k);
  }

  const k = THREE.MathUtils.clamp(growth / 20, 0, 1);
  if (k < 0.45) {
    const t = k / 0.45;
    return out.copy(COLOR_BASE_SLATE).lerp(COLOR_WARM_AMBER, t);
  }
  const t = (k - 0.45) / 0.55;
  return out.copy(COLOR_WARM_AMBER).lerp(COLOR_HOT_ORANGE, t);
}

export function getTerrainEmissive(
  growth: number,
  isComparison: boolean,
  out: THREE.Color
): THREE.Color {
  if (isComparison) {
    if (growth > 0) {
      const k = THREE.MathUtils.clamp(growth / 12, 0, 1);
      return out.copy(EMISSIVE_BLACK).lerp(EMISSIVE_COMP_WARM, k * 0.9);
    }
    const k = THREE.MathUtils.clamp(Math.abs(growth) / 28, 0, 1);
    return out.copy(EMISSIVE_BLACK).lerp(EMISSIVE_COMP_COLD, k * 0.55);
  }

  if (growth >= 4) {
    const k = THREE.MathUtils.clamp((growth - 4) / 16, 0, 1);
    return out.copy(EMISSIVE_HOT_BASE).lerp(EMISSIVE_HOT_GLOW, k);
  }
  if (growth <= -5) {
    const k = THREE.MathUtils.clamp((Math.abs(growth) - 5) / 12, 0, 1);
    return out.copy(EMISSIVE_COLD_BASE).lerp(EMISSIVE_COLD_GLOW, k * 0.65);
  }
  return out.copy(EMISSIVE_DEFAULT);
}

export function getErrorBarColor(error: number, out: THREE.Color): THREE.Color {
  if (Math.abs(error) <= 2.0) {
    return out.copy(ERR_HIT_CYAN); // Cyan hit ring
  }
  if (error > 2.0) {
    const k = THREE.MathUtils.clamp((error - 2) / 9, 0, 1);
    return out.copy(ERR_POS_LOW).lerp(ERR_POS_HIGH, k); // Orange -> Neon Crimson
  }
  const k = THREE.MathUtils.clamp((Math.abs(error) - 2) / 8, 0, 1);
  return out.copy(ERR_NEG_LOW).lerp(ERR_NEG_HIGH, k); // Electric Blue -> Deep Violet
}
