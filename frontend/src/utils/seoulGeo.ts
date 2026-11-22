import { geoMercator } from 'd3-geo';
import * as THREE from 'three';
import { MAP_PROJECTION_CONFIG } from '../config/scene';
import { getRegionsMeta } from '../services/dashboardData';
import type { GeoSourceStatus, ProjectedRegionGeometry } from '../types/dashboard';

export const SEOUL_LDONG_GEOJSON_URL = MAP_PROJECTION_CONFIG.geoJsonUrl;

// Centered Mercator projection onto XZ plane (Seoul centered at [126.978, 37.565])
const projection = geoMercator()
  .center(MAP_PROJECTION_CONFIG.center)
  .scale(MAP_PROJECTION_CONFIG.scale)
  .translate(MAP_PROJECTION_CONFIG.translate);

export function projectLngLat(centroid: [number, number]): [number, number] {
  const pt = projection(centroid);
  return pt ? [pt[0], pt[1]] : [0, 0];
}

function ringTo2DPoints(ring: number[][]): [number, number][] {
  const pts: [number, number][] = [];
  for (const coord of ring) {
    const p = projection([coord[0], coord[1]]);
    if (!p) continue;
    // Shape uses (x, -y) so that rotating mesh by -PI/2 maps shapeY -> -worldZ (north)
    const sx = p[0];
    const sy = -p[1];
    if (pts.length > 0) {
      const prev = pts[pts.length - 1];
      if (Math.hypot(sx - prev[0], sy - prev[1]) < 0.004) continue;
    }
    pts.push([sx, sy]);
  }
  return pts;
}

function polygonArea(pts: [number, number][]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    a += x0 * y1 - x1 * y0;
  }
  return Math.abs(a) * 0.5;
}

function coordsToShapes(polygons: number[][][][]): THREE.Shape[] {
  const candidateShapes: { shape: THREE.Shape; area: number }[] = [];

  for (const poly of polygons) {
    if (!poly.length) continue;
    const outer = ringTo2DPoints(poly[0]);
    if (outer.length < 3) continue;
    const area = polygonArea(outer);

    const shape = new THREE.Shape();
    shape.moveTo(outer[0][0], outer[0][1]);
    for (let i = 1; i < outer.length; i++) {
      shape.lineTo(outer[i][0], outer[i][1]);
    }
    shape.closePath();

    for (let h = 1; h < poly.length; h++) {
      const holePts = ringTo2DPoints(poly[h]);
      if (holePts.length < 3) continue;
      if (polygonArea(holePts) < 0.001) continue;
      const holePath = new THREE.Path();
      holePath.moveTo(holePts[0][0], holePts[0][1]);
      for (let i = 1; i < holePts.length; i++) {
        holePath.lineTo(holePts[i][0], holePts[i][1]);
      }
      holePath.closePath();
      shape.holes.push(holePath);
    }

    candidateShapes.push({ shape, area });
  }

  if (!candidateShapes.length) return [];
  candidateShapes.sort((a, b) => b.area - a.area);
  const filtered = candidateShapes.filter((s, idx) => idx === 0 || s.area >= 0.002);
  return filtered.map((s) => s.shape);
}

function clipPolygonHalfPlane(
  poly: [number, number][],
  linePt: [number, number],
  normal: [number, number],
): [number, number][] {
  if (poly.length < 3) return [];
  const out: [number, number][] = [];
  const dist = (p: [number, number]) =>
    (p[0] - linePt[0]) * normal[0] + (p[1] - linePt[1]) * normal[1];

  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const nxt = poly[(i + 1) % poly.length];
    const dCur = dist(cur);
    const dNxt = dist(nxt);
    const inCur = dCur <= 0;
    const inNxt = dNxt <= 0;

    if (inCur && inNxt) {
      out.push(nxt);
    } else if (inCur && !inNxt) {
      const t = dCur / (dCur - dNxt);
      out.push([cur[0] + t * (nxt[0] - cur[0]), cur[1] + t * (nxt[1] - cur[1])]);
    } else if (!inCur && inNxt) {
      const t = dCur / (dCur - dNxt);
      out.push([cur[0] + t * (nxt[0] - cur[0]), cur[1] + t * (nxt[1] - cur[1])]);
      out.push(nxt);
    }
  }
  return out;
}

/**
 * Fallback generator: builds clean bounded Voronoi-clipped polygonal cells
 * around all 467 Seoul legal-dong centroids.
 */
export function buildFallbackSeoulGeometries(): ProjectedRegionGeometry[] {
  const projectedCenters = getRegionsMeta().map((r) => {
    const [px, py] = projectLngLat(r.centroid);
    return {
      regionCode: r.regionCode,
      px,
      py,
      sx: px,
      sy: -py,
    };
  });

  const results: ProjectedRegionGeometry[] = [];

  for (let i = 0; i < projectedCenters.length; i++) {
    const cur = projectedCenters[i];
    let minDist = Infinity;
    const neighbors: { sx: number; sy: number; d: number }[] = [];

    for (let j = 0; j < projectedCenters.length; j++) {
      if (i === j) continue;
      const other = projectedCenters[j];
      const d = Math.hypot(other.sx - cur.sx, other.sy - cur.sy);
      if (d < minDist) minDist = d;
      if (d < 2.4) {
        neighbors.push({ sx: other.sx, sy: other.sy, d });
      }
    }

    const baseR = THREE.MathUtils.clamp(minDist * 0.82, 0.14, 0.95);

    const sides = 8;
    let poly: [number, number][] = [];
    for (let s = 0; s < sides; s++) {
      const angle = (s / sides) * Math.PI * 2 + Math.PI / 8;
      poly.push([cur.sx + Math.cos(angle) * baseR, cur.sy + Math.sin(angle) * baseR]);
    }

    neighbors.sort((a, b) => a.d - b.d);
    for (const nb of neighbors) {
      if (nb.d > baseR * 2.1) break;
      const dx = nb.sx - cur.sx;
      const dy = nb.sy - cur.sy;
      const len = Math.hypot(dx, dy);
      if (len < 1e-5) continue;
      const nx = dx / len;
      const ny = dy / len;
      const seamGap = 0.01;
      const midX = (cur.sx + nb.sx) * 0.5 - nx * seamGap;
      const midY = (cur.sy + nb.sy) * 0.5 - ny * seamGap;
      poly = clipPolygonHalfPlane(poly, [midX, midY], [nx, ny]);
      if (poly.length < 3) break;
    }

    if (poly.length < 3) {
      poly = [];
      for (let s = 0; s < 6; s++) {
        const angle = (s / 6) * Math.PI * 2;
        poly.push([cur.sx + Math.cos(angle) * 0.1, cur.sy + Math.sin(angle) * 0.1]);
      }
    }

    const shape = new THREE.Shape();
    shape.moveTo(poly[0][0], poly[0][1]);
    for (let k = 1; k < poly.length; k++) {
      shape.lineTo(poly[k][0], poly[k][1]);
    }
    shape.closePath();

    results.push({
      regionCode: cur.regionCode,
      shapes: [shape],
      center3D: [cur.px, cur.py],
      boundsRadius: baseR,
    });
  }

  return results;
}

interface SeoulGeoFeature {
  type: 'Feature';
  properties: {
    ldongCd: string;
    ldongNm: string;
    sggCd: string;
    sggNm: string;
    centroid: [number, number];
  };
  geometry:
    | { type: 'Polygon'; coordinates: number[][][] }
    | { type: 'MultiPolygon'; coordinates: number[][][][] };
}

interface SeoulFeatureCollection {
  type: 'FeatureCollection';
  features: SeoulGeoFeature[];
}

export async function loadSeoulGeometries(forceFallback = false): Promise<{
  geometries: ProjectedRegionGeometry[];
  status: Exclude<GeoSourceStatus, 'loading'>;
}> {
  if (forceFallback) {
    return {
      geometries: buildFallbackSeoulGeometries(),
      status: 'fallback',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MAP_PROJECTION_CONFIG.fetchTimeoutMs);

  try {
    const res = await fetch(SEOUL_LDONG_GEOJSON_URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const collection = (await res.json()) as SeoulFeatureCollection;
    const featureMap = new Map<string, SeoulGeoFeature>();
    for (const feat of collection.features) {
      if (feat.properties?.ldongCd) {
        featureMap.set(feat.properties.ldongCd, feat);
      }
    }

    let fallbackMap: Map<string, ProjectedRegionGeometry> | null = null;
    const getFallbackRegion = (regionCode: string) => {
      if (!fallbackMap) {
        fallbackMap = new Map(buildFallbackSeoulGeometries().map((g) => [g.regionCode, g]));
      }
      return fallbackMap.get(regionCode);
    };

    const output: ProjectedRegionGeometry[] = [];

    for (const meta of getRegionsMeta()) {
      const feat = featureMap.get(meta.regionCode);
      const [cx, cz] = projectLngLat(meta.centroid);
      if (!feat) {
        const fb = getFallbackRegion(meta.regionCode);
        if (fb) output.push(fb);
        continue;
      }

      const polygons =
        feat.geometry.type === 'Polygon' ? [feat.geometry.coordinates] : feat.geometry.coordinates;

      const shapes = coordsToShapes(polygons);
      if (shapes.length === 0) {
        const fb = getFallbackRegion(meta.regionCode);
        if (fb) output.push(fb);
        continue;
      }

      output.push({
        regionCode: meta.regionCode,
        shapes,
        center3D: [cx, cz],
        boundsRadius: 0.35,
      });
    }

    return {
      geometries: output,
      status: 'geojson',
    };
  } catch {
    clearTimeout(timeoutId);
    return {
      geometries: buildFallbackSeoulGeometries(),
      status: 'fallback',
    };
  }
}
