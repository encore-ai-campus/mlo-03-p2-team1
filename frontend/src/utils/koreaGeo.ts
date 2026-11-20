import { geoMercator } from 'd3-geo';
import * as THREE from 'three';
import * as topojson from 'topojson-client';
import { REGIONS_META } from '../data/regionsMeta';
import type { GeoSourceStatus, ProjectedRegionGeometry } from '../types/dashboard';

export const KOREA_TOPOJSON_URL =
  'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-topo-simple.json';

// Centered Mercator projection onto XZ plane (South Korea centered at [127.78, 35.95])
const projection = geoMercator()
  .center([127.78, 35.95])
  .scale(410)
  .translate([0, 0]);

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
      if (Math.hypot(sx - prev[0], sy - prev[1]) < 0.008) continue;
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

    // Holes
    for (let h = 1; h < poly.length; h++) {
      const holePts = ringTo2DPoints(poly[h]);
      if (holePts.length < 3) continue;
      if (polygonArea(holePts) < 0.003) continue;
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
  // Keep main landmass + significant islands, always keeping at least the largest polygon
  candidateShapes.sort((a, b) => b.area - a.area);
  const filtered = candidateShapes.filter((s, idx) => idx === 0 || s.area >= 0.006);
  return filtered.map((s) => s.shape);
}

// Half-plane clip of a 2D convex polygon: keeps points where (p - pointOnLine) . normal <= 0
function clipPolygonHalfPlane(
  poly: [number, number][],
  linePt: [number, number],
  normal: [number, number]
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
 * around all 229 projected South Korean municipal centroids when remote GeoJSON fails.
 */
export function buildFallbackKoreaGeometries(): ProjectedRegionGeometry[] {
  const projectedCenters = REGIONS_META.map((r) => {
    const [px, py] = projectLngLat(r.centroid);
    return {
      regionCode: r.regionCode,
      tier: r.tier,
      px,
      py,
      sx: px,
      sy: -py, // Shape space
    };
  });

  const results: ProjectedRegionGeometry[] = [];

  for (let i = 0; i < projectedCenters.length; i++) {
    const cur = projectedCenters[i];
    // Find nearest neighbor distance to size initial bounding polygon naturally
    let minDist = Infinity;
    const neighbors: { sx: number; sy: number; d: number }[] = [];

    for (let j = 0; j < projectedCenters.length; j++) {
      if (i === j) continue;
      const other = projectedCenters[j];
      const d = Math.hypot(other.sx - cur.sx, other.sy - cur.sy);
      if (d < minDist) minDist = d;
      if (d < 3.4) {
        neighbors.push({ sx: other.sx, sy: other.sy, d });
      }
    }

    const baseR =
      cur.tier === 'PRIME_SEOUL' || cur.tier === 'CORE_SEOUL'
        ? THREE.MathUtils.clamp(minDist * 0.72, 0.22, 0.42)
        : THREE.MathUtils.clamp(minDist * 0.78, 0.34, 1.32);

    // Start with an 8-gon around (cur.sx, cur.sy)
    const sides = 8;
    let poly: [number, number][] = [];
    for (let s = 0; s < sides; s++) {
      const angle = (s / sides) * Math.PI * 2 + Math.PI / 8;
      poly.push([cur.sx + Math.cos(angle) * baseR, cur.sy + Math.sin(angle) * baseR]);
    }

    // Clip against nearby Voronoi perpendicular bisectors with small seam margin
    neighbors.sort((a, b) => a.d - b.d);
    for (const nb of neighbors) {
      if (nb.d > baseR * 2.1) break;
      const dx = nb.sx - cur.sx;
      const dy = nb.sy - cur.sy;
      const len = Math.hypot(dx, dy);
      if (len < 1e-5) continue;
      const nx = dx / len;
      const ny = dy / len;
      const seamGap = 0.015;
      const midX = (cur.sx + nb.sx) * 0.5 - nx * seamGap;
      const midY = (cur.sy + nb.sy) * 0.5 - ny * seamGap;
      poly = clipPolygonHalfPlane(poly, [midX, midY], [nx, ny]);
      if (poly.length < 3) break;
    }

    if (poly.length < 3) {
      // Emergency hexagon fallback if tightly surrounded
      poly = [];
      for (let s = 0; s < 6; s++) {
        const angle = (s / 6) * Math.PI * 2;
        poly.push([cur.sx + Math.cos(angle) * 0.16, cur.sy + Math.sin(angle) * 0.16]);
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

interface TopoGeometryObj {
  type: string;
  properties?: { code?: string; name?: string };
}

export async function loadKoreaGeometries(forceFallback = false): Promise<{
  geometries: ProjectedRegionGeometry[];
  status: Exclude<GeoSourceStatus, 'loading'>;
}> {
  if (forceFallback) {
    return {
      geometries: buildFallbackKoreaGeometries(),
      status: 'fallback',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(KOREA_TOPOJSON_URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const topology = await res.json();
    const objectKey = Object.keys(topology.objects)[0];
    const topoObject = topology.objects[objectKey];
    const rawGeoms = topoObject.geometries as TopoGeometryObj[];

    // Group 일반구 (code >= 31xxx and name matches "*시*구") under 4-digit city + '0'
    const groups = new Map<string, TopoGeometryObj[]>();
    for (const geom of rawGeoms) {
      const code = geom.properties?.code ?? '';
      const name = geom.properties?.name ?? '';
      if (!code) continue;
      const prefix2 = Number(code.slice(0, 2));
      const isDoSiGu = prefix2 >= 31 && /시.+구$/.test(name);
      const mergedCode = isDoSiGu ? `${code.slice(0, 4)}0` : code;
      if (!groups.has(mergedCode)) groups.set(mergedCode, []);
      groups.get(mergedCode)!.push(geom);
    }

    let fallbackMap: Map<string, ProjectedRegionGeometry> | null = null;
    const getFallbackRegion = (regionCode: string) => {
      if (!fallbackMap) {
        fallbackMap = new Map(
          buildFallbackKoreaGeometries().map((g) => [g.regionCode, g])
        );
      }
      return fallbackMap.get(regionCode);
    };

    const output: ProjectedRegionGeometry[] = [];

    for (const meta of REGIONS_META) {
      const group = groups.get(meta.regionCode);
      const [cx, cz] = projectLngLat(meta.centroid);
      if (!group || group.length === 0) {
        const fb = getFallbackRegion(meta.regionCode);
        if (fb) output.push(fb);
        continue;
      }

      let polygons: number[][][][] = [];
      if (group.length > 1) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const merged = topojson.merge(topology as any, group as any);
        polygons = merged.coordinates;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const feature = topojson.feature(topology as any, group[0] as any) as any;
        if (feature.geometry.type === 'Polygon') {
          polygons = [feature.geometry.coordinates];
        } else if (feature.geometry.type === 'MultiPolygon') {
          polygons = feature.geometry.coordinates;
        }
      }

      const shapes = coordsToShapes(polygons);
      if (shapes.length === 0) {
        const fb = getFallbackRegion(meta.regionCode);
        if (fb) output.push(fb);
        continue;
      }

      const districtName = group[0].properties?.code?.startsWith('11') ? group[0].properties?.name : undefined;
      const center = districtName
        ? new THREE.Box2().setFromPoints(shapes.flatMap((shape) => shape.getPoints())).getCenter(new THREE.Vector2())
        : null;
      output.push({
        regionCode: meta.regionCode,
        shapes,
        districtName,
        districtCenter3D: center ? [center.x, -center.y] : undefined,
        center3D: [cx, cz],
        boundsRadius: 0.5,
      });
    }

    return {
      geometries: output,
      status: 'topojson',
    };
  } catch {
    clearTimeout(timeoutId);
    return {
      geometries: buildFallbackKoreaGeometries(),
      status: 'fallback',
    };
  }
}
