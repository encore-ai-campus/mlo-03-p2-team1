import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { TERRAIN_CONFIG } from '../../config/scene';
import {
  classifyToleranceBand,
  getQuarterRecordMap,
  getTop10RegionCodes,
} from '../../services/dashboardData';
import { useDashboardStore } from '../../store/useDashboardStore';
import type { ProjectedRegionGeometry } from '../../types/dashboard';
import {
  getTerrainColor,
  getTerrainEmissive,
  getToleranceBandColor,
  getToleranceBandEmissive,
} from '../../utils/colorScales';
import { isPredictionHit } from '../../utils/formatters';

// Module-level scratch colors (zero per-frame allocations)
const _baseColor = new THREE.Color();
const _baseEmissive = new THREE.Color();
const _targetColor = new THREE.Color();
const _targetEmissive = new THREE.Color();
const _targetEdgeColor = new THREE.Color();

const _dimColor = new THREE.Color('#0b1120');
const _dimEmissive = new THREE.Color('#020617');
const _noTradeColor = new THREE.Color('#0d1526');
const _noTradeEmissive = new THREE.Color('#040814');
const _selectTint = new THREE.Color('#38bdf8');
const _hoverTint = new THREE.Color('#f8fafc');
const _edgeSelected = new THREE.Color('#38bdf8');
const _edgeHovered = new THREE.Color('#e2e8f0');
const _edgeDimmed = new THREE.Color('#1e293b');
const _edgeDefault = new THREE.Color('#475569');

interface MergedTerrainData {
  terrainGeo: THREE.BufferGeometry;
  edgesGeo: THREE.BufferGeometry;
  faceToRegion: Uint16Array;
  vertexOffsets: Int32Array;
  vertexCounts: Int32Array;
  edgeOffsets: Int32Array;
  edgeCounts: Int32Array;
  count: number;
}

function buildMergedTerrain(geometries: ProjectedRegionGeometry[]): MergedTerrainData | null {
  const count = geometries.length;
  if (count === 0) return null;

  const tempTerrain: THREE.BufferGeometry[] = new Array(count);
  const tempEdges: THREE.BufferGeometry[] = new Array(count);
  const vertexOffsets = new Int32Array(count);
  const vertexCounts = new Int32Array(count);
  const edgeOffsets = new Int32Array(count);
  const edgeCounts = new Int32Array(count);

  let totalVerts = 0;
  let totalEdgeVerts = 0;

  for (let i = 0; i < count; i++) {
    const raw = new THREE.ExtrudeGeometry(geometries[i].shapes, TERRAIN_CONFIG.extrudeOptions);
    const nonIndexed = raw.index ? raw.toNonIndexed() : raw;
    if (nonIndexed !== raw) raw.dispose();
    if (!nonIndexed.getAttribute('normal')) {
      nonIndexed.computeVertexNormals();
    }

    const edges = new THREE.EdgesGeometry(nonIndexed, TERRAIN_CONFIG.edgeThresholdAngle);

    const vCount = nonIndexed.getAttribute('position').count;
    const eCount = edges.getAttribute('position').count;

    vertexOffsets[i] = totalVerts;
    vertexCounts[i] = vCount;
    edgeOffsets[i] = totalEdgeVerts;
    edgeCounts[i] = eCount;

    totalVerts += vCount;
    totalEdgeVerts += eCount;

    tempTerrain[i] = nonIndexed;
    tempEdges[i] = edges;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const colors = new Float32Array(totalVerts * 4);
  const faceToRegion = new Uint16Array(Math.floor(totalVerts / 3));

  const edgePositions = new Float32Array(totalEdgeVerts * 3);
  const edgeColors = new Float32Array(totalEdgeVerts * 4);

  for (let i = 0; i < count; i++) {
    const tGeo = tempTerrain[i];
    const eGeo = tempEdges[i];

    const vOff = vertexOffsets[i];
    const vCnt = vertexCounts[i];
    const posArr = tGeo.getAttribute('position').array as Float32Array;
    const normArr = tGeo.getAttribute('normal').array as Float32Array;

    positions.set(posArr, vOff * 3);
    normals.set(normArr, vOff * 3);

    const faceStart = Math.floor(vOff / 3);
    const faceCount = Math.floor(vCnt / 3);
    faceToRegion.fill(i, faceStart, faceStart + faceCount);

    // Default dark slate RGBA
    for (let v = vOff; v < vOff + vCnt; v++) {
      const cIdx = v * 4;
      colors[cIdx] = 0.094;
      colors[cIdx + 1] = 0.133;
      colors[cIdx + 2] = 0.208;
      colors[cIdx + 3] = 0.72;
    }

    const eOff = edgeOffsets[i];
    const eCnt = edgeCounts[i];
    const ePosArr = eGeo.getAttribute('position').array as Float32Array;
    edgePositions.set(ePosArr, eOff * 3);

    for (let v = eOff; v < eOff + eCnt; v++) {
      const cIdx = v * 4;
      edgeColors[cIdx] = 0.278;
      edgeColors[cIdx + 1] = 0.333;
      edgeColors[cIdx + 2] = 0.412;
      edgeColors[cIdx + 3] = 0.48;
    }

    tGeo.dispose();
    eGeo.dispose();
  }

  const terrainGeo = new THREE.BufferGeometry();
  terrainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  terrainGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  const colorAttr = new THREE.BufferAttribute(colors, 4);
  colorAttr.setUsage(THREE.DynamicDrawUsage);
  terrainGeo.setAttribute('color', colorAttr);
  terrainGeo.computeBoundingSphere();

  const edgesGeo = new THREE.BufferGeometry();
  edgesGeo.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
  const edgeColorAttr = new THREE.BufferAttribute(edgeColors, 4);
  edgeColorAttr.setUsage(THREE.DynamicDrawUsage);
  edgesGeo.setAttribute('color', edgeColorAttr);
  edgesGeo.computeBoundingSphere();

  return {
    terrainGeo,
    edgesGeo,
    faceToRegion,
    vertexOffsets,
    vertexCounts,
    edgeOffsets,
    edgeCounts,
    count,
  };
}

interface RegionPolygonsLayerProps {
  geometries: ProjectedRegionGeometry[];
}

export function RegionPolygonsLayer({ geometries }: RegionPolygonsLayerProps) {
  const merged = useMemo(() => buildMergedTerrain(geometries), [geometries]);

  const animRef = useRef({
    lastKey: '',
    settled: false,
    curR: new Float32Array(0),
    curG: new Float32Array(0),
    curB: new Float32Array(0),
    curA: new Float32Array(0),
    edgeR: new Float32Array(0),
    edgeG: new Float32Array(0),
    edgeB: new Float32Array(0),
    edgeA: new Float32Array(0),
  });

  useEffect(() => {
    if (!merged) return;
    const n = merged.count;
    const anim = animRef.current;
    anim.lastKey = '';
    anim.settled = false;
    anim.curR = new Float32Array(n).fill(0.094);
    anim.curG = new Float32Array(n).fill(0.133);
    anim.curB = new Float32Array(n).fill(0.208);
    anim.curA = new Float32Array(n).fill(0.72);
    anim.edgeR = new Float32Array(n).fill(0.278);
    anim.edgeG = new Float32Array(n).fill(0.333);
    anim.edgeB = new Float32Array(n).fill(0.412);
    anim.edgeA = new Float32Array(n).fill(0.48);

    return () => {
      merged.terrainGeo.dispose();
      merged.edgesGeo.dispose();
    };
  }, [merged]);

  useFrame((_, delta) => {
    if (!merged) return;

    const state = useDashboardStore.getState();
    const bands = state.activeToleranceBands;
    const bandKey = `${bands['0_2'] ? 1 : 0}${bands['2_4'] ? 1 : 0}${bands['4_6'] ? 1 : 0}${bands['6_plus'] ? 1 : 0}`;
    const hasBandFilter = bandKey !== '1111';
    const key = `${state.dataVersion}|${state.selectedQuarter}|${state.selectedModel}|${state.viewMode}|${state.aiAccuracyFilter}|${bandKey}|${state.spotlightMode ? 1 : 0}|${state.comparisonMode ? 1 : 0}|${state.selectedRegionCode ?? ''}|${state.hoveredRegionCode ?? ''}`;
    const anim = animRef.current;

    if (key !== anim.lastKey) {
      anim.lastKey = key;
      anim.settled = false;
    }

    if (anim.settled) return;

    const quarterMap = getQuarterRecordMap(state.selectedQuarter);
    const top10Set = getTop10RegionCodes(state.selectedQuarter);
    const damp = 1 - Math.exp(-Math.min(delta, 0.1) * TERRAIN_CONFIG.dampSpeed);
    const isErrorMode = state.viewMode === 'error';

    const colorAttr = merged.terrainGeo.getAttribute('color') as THREE.BufferAttribute;
    const colorArr = colorAttr.array as Float32Array;
    const edgeColorAttr = merged.edgesGeo.getAttribute('color') as THREE.BufferAttribute;
    const edgeColorArr = edgeColorAttr.array as Float32Array;

    let maxDelta = 0;

    for (let i = 0; i < merged.count; i++) {
      const geo = geometries[i];
      const record = quarterMap[geo.regionCode];
      if (!record) continue;

      const isTop10 = top10Set.has(geo.regionCode);
      const isSelected = state.selectedRegionCode === geo.regionCode;
      const isHovered = state.hoveredRegionCode === geo.regionCode;

      const modelPred = record.predictions?.[state.selectedModel] ?? null;
      const err = modelPred?.error ?? null;
      const bandDimmed =
        isErrorMode &&
        hasBandFilter &&
        !isSelected &&
        (err === null || !bands[classifyToleranceBand(Math.abs(err))]);
      const accuracyDimmed =
        isErrorMode &&
        state.aiAccuracyFilter !== 'all' &&
        !isSelected &&
        (err === null ||
          (state.aiAccuracyFilter === 'hit' && !isPredictionHit(err)) ||
          (state.aiAccuracyFilter === 'miss' && isPredictionHit(err)));
      const dimmed =
        (state.spotlightMode && !isTop10 && !isSelected) || accuracyDimmed || bandDimmed;
      const metricValue = isErrorMode
        ? (modelPred?.predictedGrowth ?? null)
        : state.comparisonMode
          ? record.growthDelta
          : (record.actualGrowth ?? modelPred?.predictedGrowth ?? null);

      const hasMetric = isErrorMode
        ? modelPred !== null
        : record.hasObservedTradeYn && metricValue !== null;

      if (dimmed) {
        _targetColor.copy(_dimColor);
        _targetEmissive.copy(_dimEmissive);
      } else if (isErrorMode && err !== null) {
        // AI Eval Quarter: color terrain by 4-band Error Tolerance matching Left cards & Right 100% bar
        const band = classifyToleranceBand(Math.abs(err));
        getToleranceBandColor(band, _baseColor);
        getToleranceBandEmissive(band, _baseEmissive);
        _targetColor.copy(_baseColor);
        _targetEmissive.copy(_baseEmissive);
        if (isSelected) {
          _targetEmissive.lerp(_selectTint, 0.45);
        } else if (isHovered) {
          _targetEmissive.lerp(_hoverTint, 0.25);
        }
      } else if (!hasMetric || metricValue === null) {
        _targetColor.copy(_noTradeColor);
        _targetEmissive.copy(_noTradeEmissive);
        if (isSelected) {
          _targetEmissive.lerp(_selectTint, 0.35);
        } else if (isHovered) {
          _targetEmissive.lerp(_hoverTint, 0.2);
        }
      } else {
        const useComparison = !isErrorMode && state.comparisonMode;
        getTerrainColor(metricValue, useComparison, _baseColor);
        getTerrainEmissive(metricValue, useComparison, _baseEmissive);
        _targetColor.copy(_baseColor);
        _targetEmissive.copy(_baseEmissive);
        if (isSelected) {
          _targetEmissive.lerp(_selectTint, 0.45);
        } else if (isHovered) {
          _targetEmissive.lerp(_hoverTint, 0.25);
        }
      }

      const emissiveWeight = dimmed
        ? 0.08
        : !hasMetric && !(isErrorMode && err !== null)
          ? isSelected
            ? 0.65
            : 0.18
          : isSelected
            ? 0.95
            : isHovered
              ? 0.72
              : isErrorMode && err !== null
                ? Math.abs(err) <= 2.0
                  ? 0.26
                  : Math.abs(err) <= 4.0
                    ? 0.38
                    : 0.62
                : isErrorMode
                  ? 0.68
                  : record.lowSampleYn
                    ? 0.36
                    : 0.52;
      const tR = _targetColor.r + _targetEmissive.r * emissiveWeight;
      const tG = _targetColor.g + _targetEmissive.g * emissiveWeight;
      const tB = _targetColor.b + _targetEmissive.b * emissiveWeight;
      const tA = dimmed
        ? 0.14
        : !hasMetric
          ? isSelected || isHovered
            ? 0.68
            : 0.38
          : isSelected || isHovered
            ? 0.9
            : isErrorMode
              ? 0.84
              : record.lowSampleYn
                ? 0.58
                : 0.74;

      const nR = THREE.MathUtils.lerp(anim.curR[i], tR, damp);
      const nG = THREE.MathUtils.lerp(anim.curG[i], tG, damp);
      const nB = THREE.MathUtils.lerp(anim.curB[i], tB, damp);
      const nA = THREE.MathUtils.lerp(anim.curA[i], tA, damp);

      anim.curR[i] = nR;
      anim.curG[i] = nG;
      anim.curB[i] = nB;
      anim.curA[i] = nA;

      const vStart = merged.vertexOffsets[i];
      const vEnd = vStart + merged.vertexCounts[i];
      for (let v = vStart; v < vEnd; v++) {
        const cIdx = v * 4;
        colorArr[cIdx] = nR;
        colorArr[cIdx + 1] = nG;
        colorArr[cIdx + 2] = nB;
        colorArr[cIdx + 3] = nA;
      }

      _targetEdgeColor.copy(
        isSelected ? _edgeSelected : isHovered ? _edgeHovered : dimmed ? _edgeDimmed : _edgeDefault,
      );
      const tEdgeA = isSelected ? 0.95 : isHovered ? 0.85 : dimmed ? 0.32 : 0.48;

      const neR = THREE.MathUtils.lerp(anim.edgeR[i], _targetEdgeColor.r, damp);
      const neG = THREE.MathUtils.lerp(anim.edgeG[i], _targetEdgeColor.g, damp);
      const neB = THREE.MathUtils.lerp(anim.edgeB[i], _targetEdgeColor.b, damp);
      const neA = THREE.MathUtils.lerp(anim.edgeA[i], tEdgeA, damp);

      anim.edgeR[i] = neR;
      anim.edgeG[i] = neG;
      anim.edgeB[i] = neB;
      anim.edgeA[i] = neA;

      const eStart = merged.edgeOffsets[i];
      const eEnd = eStart + merged.edgeCounts[i];
      for (let v = eStart; v < eEnd; v++) {
        const cIdx = v * 4;
        edgeColorArr[cIdx] = neR;
        edgeColorArr[cIdx + 1] = neG;
        edgeColorArr[cIdx + 2] = neB;
        edgeColorArr[cIdx + 3] = neA;
      }

      const regionMax = Math.max(
        Math.abs(nR - tR),
        Math.abs(nG - tG),
        Math.abs(nB - tB),
        Math.abs(nA - tA),
        Math.abs(neR - _targetEdgeColor.r),
        Math.abs(neG - _targetEdgeColor.g),
        Math.abs(neB - _targetEdgeColor.b),
        Math.abs(neA - tEdgeA),
      );
      if (regionMax > maxDelta) maxDelta = regionMax;
    }

    colorAttr.needsUpdate = true;
    edgeColorAttr.needsUpdate = true;

    if (maxDelta < TERRAIN_CONFIG.settleThreshold) {
      anim.settled = true;
    }
  });

  if (!merged) return null;

  const resolveRegionCode = (faceIndex: number | null | undefined): string | null => {
    if (faceIndex == null || faceIndex < 0 || faceIndex >= merged.faceToRegion.length) {
      return null;
    }
    const regionIdx = merged.faceToRegion[faceIndex];
    return geometries[regionIdx]?.regionCode ?? null;
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const code = resolveRegionCode(e.faceIndex);
    if (!code) return;
    document.body.style.cursor = 'pointer';
    const store = useDashboardStore.getState();
    if (store.hoveredRegionCode !== code) {
      store.setHoveredRegionCode(code);
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'auto';
    useDashboardStore.getState().setHoveredRegionCode(null);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const code = resolveRegionCode(e.faceIndex);
    if (code) {
      useDashboardStore.getState().setSelectedRegionCode(code);
    }
  };

  return (
    <group name="korea-terrain-polygons" position={[0, -0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh
        geometry={merged.terrainGeo}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <meshLambertMaterial vertexColors transparent depthWrite toneMapped={false} />
      </mesh>
      <lineSegments geometry={merged.edgesGeo}>
        <lineBasicMaterial vertexColors transparent />
      </lineSegments>
    </group>
  );
}
