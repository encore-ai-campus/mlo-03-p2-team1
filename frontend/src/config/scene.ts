import type * as THREE from 'three';

export const ERROR_HIT_THRESHOLD = 2.0;

export const MAP_PROJECTION_CONFIG = {
  // Centered on the Han River (Nodeul / Banpo / Ichon axis)
  center: [126.985, 37.522] as [number, number],
  scale: 3900,
  translate: [0, 0] as [number, number],
  geoJsonUrl: '/geo/seoul_ldong_467.geojson',
  fetchTimeoutMs: 5000,
} as const;

export const SCENE_COLORS = {
  background: '#050811',
  fog: '#050811',
  keyLight: '#f8fafc',
  rimLight: '#38bdf8',
  gridCenter: '#1e293b',
  gridLines: '#0f172a',
} as const;

export const CAMERA_CONFIG = {
  defaultPosition: [0, 20, 19] as [number, number, number],
  defaultTarget: [0, -0.3, 0] as [number, number, number],
  focusTargetY: 0.25,
  focusOffsetY: 6.2,
  focusOffsetZ: 5.8,
  fov: 42,
  near: 0.1,
  far: 180,
  minDistance: 3.5,
  maxDistance: 46,
  panSpeed: 1.15,
  dampingFactor: 0.08,
  lerpSpeed: 4.5,
} as const;

export const FRAME_SCHEDULER_CONFIG = {
  burstWindowMs: 1200,
  burstIntervalMs: 16,
  idleIntervalMs: 33,
  ecoIntervalMs: 55,
} as const;

export const TERRAIN_CONFIG = {
  extrudeOptions: {
    depth: 0.36,
    bevelEnabled: false,
    curveSegments: 2,
  } satisfies THREE.ExtrudeGeometryOptions,
  edgeThresholdAngle: 24,
  dampSpeed: 6.5,
  settleThreshold: 0.002,
} as const;

export const ERROR_BAR_CONFIG = {
  dampSpeed: 6.0,
  heightExponent: 0.65,
  heightScale: 0.42,
  maxHeight: 2.8,
  minVisibleHeight: 0.03,
  barSettleThreshold: 0.001,
  ringSettleThreshold: 0.002,
} as const;

export const TIMELINE_CONFIG = {
  autoplayIntervalMs: 750,
} as const;
