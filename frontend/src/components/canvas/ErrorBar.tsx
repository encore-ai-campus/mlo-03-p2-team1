import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { REGIME_MAP_BY_YEAR, TOP_10_CODES_BY_YEAR } from '../../data/mockRegimes';
import { useDashboardStore } from '../../store/useDashboardStore';
import type { ProjectedRegionGeometry } from '../../types/dashboard';
import { getErrorBarColor } from '../../utils/colorScales';

const SHARED_BAR_GEO = new THREE.CylinderGeometry(0.065, 0.095, 1, 8);
const SHARED_TIP_GEO = new THREE.SphereGeometry(0.085, 10, 10);
const SHARED_RING_GEO = new THREE.RingGeometry(0.11, 0.175, 24);
const SHARED_OUTER_RING_GEO = new THREE.RingGeometry(0.19, 0.22, 24);

// Module-level scratch objects (zero per-frame allocations)
const _dummy = new THREE.Object3D();
const _errColor = new THREE.Color();
const _scratchColor = new THREE.Color();
const _dimBarColor = new THREE.Color('#1e293b');
const _ringInnerColor = new THREE.Color('#22d3ee');
const _ringOuterColor = new THREE.Color('#34d399');

interface ErrorBarsLayerProps {
  geometries: ProjectedRegionGeometry[];
}

export function ErrorBarsLayer({ geometries }: ErrorBarsLayerProps) {
  const count = geometries.length;

  const barsMeshRef = useRef<THREE.InstancedMesh>(null);
  const tipsMeshRef = useRef<THREE.InstancedMesh>(null);
  const innerRingsMeshRef = useRef<THREE.InstancedMesh>(null);
  const outerRingsMeshRef = useRef<THREE.InstancedMesh>(null);

  const buffers = useMemo(() => {
    const signedHeights = new Float32Array(count);
    const radiusScales = new Float32Array(count);
    radiusScales.fill(1);
    const barColors = new Float32Array(count * 3);
    const tipColors = new Float32Array(count * 3);
    const ringOpacities = new Float32Array(count);
    return {
      signedHeights,
      radiusScales,
      barColors,
      tipColors,
      ringOpacities,
    };
  }, [count]);

  const animStateRef = useRef({
    lastKey: '',
    barsSettled: false,
    ringsOpacitySettled: false,
    activeRingCount: 0,
  });

  useEffect(() => {
    animStateRef.current.lastKey = '';
    animStateRef.current.barsSettled = false;
    animStateRef.current.ringsOpacitySettled = false;
    animStateRef.current.activeRingCount = 0;
  }, [geometries]);

  // Initialize instanceColor & hidden matrices on mount before first draw
  useLayoutEffect(() => {
    const barsMesh = barsMeshRef.current;
    const tipsMesh = tipsMeshRef.current;
    const innerRingsMesh = innerRingsMeshRef.current;
    const outerRingsMesh = outerRingsMeshRef.current;
    if (!barsMesh || !tipsMesh || !innerRingsMesh || !outerRingsMesh || count === 0) {
      return;
    }

    _dummy.position.set(0, -1000, 0);
    _dummy.rotation.set(0, 0, 0);
    _dummy.scale.setScalar(0.0001);
    _dummy.updateMatrix();
    _scratchColor.setRGB(0, 0, 0);

    for (let i = 0; i < count; i++) {
      barsMesh.setMatrixAt(i, _dummy.matrix);
      barsMesh.setColorAt(i, _scratchColor);
      tipsMesh.setMatrixAt(i, _dummy.matrix);
      tipsMesh.setColorAt(i, _scratchColor);
      innerRingsMesh.setMatrixAt(i, _dummy.matrix);
      innerRingsMesh.setColorAt(i, _scratchColor);
      outerRingsMesh.setMatrixAt(i, _dummy.matrix);
      outerRingsMesh.setColorAt(i, _scratchColor);
    }

    barsMesh.instanceMatrix.needsUpdate = true;
    tipsMesh.instanceMatrix.needsUpdate = true;
    innerRingsMesh.instanceMatrix.needsUpdate = true;
    outerRingsMesh.instanceMatrix.needsUpdate = true;
    if (barsMesh.instanceColor) barsMesh.instanceColor.needsUpdate = true;
    if (tipsMesh.instanceColor) tipsMesh.instanceColor.needsUpdate = true;
    if (innerRingsMesh.instanceColor) innerRingsMesh.instanceColor.needsUpdate = true;
    if (outerRingsMesh.instanceColor) outerRingsMesh.instanceColor.needsUpdate = true;
  }, [count, geometries]);

  useFrame((clockState, delta) => {
    if (count === 0) return;

    const barsMesh = barsMeshRef.current;
    const tipsMesh = tipsMeshRef.current;
    const innerRingsMesh = innerRingsMeshRef.current;
    const outerRingsMesh = outerRingsMeshRef.current;
    if (!barsMesh || !tipsMesh || !innerRingsMesh || !outerRingsMesh) return;

    const store = useDashboardStore.getState();
    const yearMap = REGIME_MAP_BY_YEAR[store.selectedYear];
    const top10Set = TOP_10_CODES_BY_YEAR[store.selectedYear];
    const stateKey = `${store.selectedYear}|${store.spotlightMode ? 1 : 0}|${store.selectedRegionCode ?? ''}|${store.hoveredRegionCode ?? ''}`;

    const animState = animStateRef.current;
    if (stateKey !== animState.lastKey) {
      animState.lastKey = stateKey;
      animState.barsSettled = false;
      animState.ringsOpacitySettled = false;
    }

    const updateBars = !animState.barsSettled;
    const updateRingOpacities = !animState.ringsOpacitySettled;
    const updateRingMatrices = updateRingOpacities || animState.activeRingCount > 0;

    if (!updateBars && !updateRingMatrices) {
      return;
    }

    const damp = 1 - Math.exp(-Math.min(delta, 0.1) * 6.0);
    const elapsed = clockState.clock.elapsedTime;
    const { signedHeights, radiusScales, barColors, tipColors, ringOpacities } = buffers;

    let maxBarDelta = 0;
    let maxRingDelta = 0;
    let activeRings = 0;

    for (let i = 0; i < count; i++) {
      const geo = geometries[i];
      const record = yearMap[geo.regionCode];
      if (!record) continue;

      const isTop10 = top10Set.has(geo.regionCode);
      const isSelected = store.selectedRegionCode === geo.regionCode;
      const isHovered = store.hoveredRegionCode === geo.regionCode;
      const dimmed = store.spotlightMode && !isTop10 && !isSelected;

      const err = record.error;
      const isHit = Math.abs(err) <= 2.0;

      if (updateBars) {
        // Non-linear scaling: Math.pow(Math.abs(error), 0.72)
        const rawScaled = isHit ? 0 : Math.pow(Math.abs(err), 0.72) * 0.85;
        const targetHeight = isHit ? 0 : (err > 0 ? 1 : -1) * rawScaled;

        const prevH = signedHeights[i];
        const nextH = THREE.MathUtils.lerp(prevH, targetHeight, damp);
        signedHeights[i] = nextH;
        const hDelta = Math.abs(targetHeight - nextH);
        if (hDelta > maxBarDelta) maxBarDelta = hDelta;

        const targetRadius = dimmed ? 0.55 : isSelected ? 1.45 : isHovered ? 1.28 : 1.0;
        const nextRadius = THREE.MathUtils.lerp(radiusScales[i], targetRadius, damp);
        radiusScales[i] = nextRadius;
        const rDelta = Math.abs(targetRadius - nextRadius);
        if (rDelta > maxBarDelta) maxBarDelta = rDelta;

        const absH = Math.abs(nextH);
        const x = geo.center3D[0];
        const z = geo.center3D[1];

        if (absH > 0.03 && !dimmed) {
          _dummy.rotation.set(0, 0, 0);
          _dummy.position.set(x, nextH * 0.5, z);
          _dummy.scale.set(nextRadius, absH, nextRadius);
          _dummy.updateMatrix();
          barsMesh.setMatrixAt(i, _dummy.matrix);

          _dummy.position.set(x, nextH, z);
          _dummy.scale.setScalar(nextRadius);
          _dummy.updateMatrix();
          tipsMesh.setMatrixAt(i, _dummy.matrix);
        } else if (absH > 0.03 && dimmed) {
          _dummy.rotation.set(0, 0, 0);
          _dummy.position.set(x, nextH * 0.35 * 0.5, z);
          _dummy.scale.set(nextRadius, absH * 0.35, nextRadius);
          _dummy.updateMatrix();
          barsMesh.setMatrixAt(i, _dummy.matrix);

          _dummy.position.set(0, -1000, 0);
          _dummy.scale.setScalar(0.0001);
          _dummy.updateMatrix();
          tipsMesh.setMatrixAt(i, _dummy.matrix);
        } else {
          _dummy.rotation.set(0, 0, 0);
          _dummy.position.set(0, -1000, 0);
          _dummy.scale.setScalar(0.0001);
          _dummy.updateMatrix();
          barsMesh.setMatrixAt(i, _dummy.matrix);
          tipsMesh.setMatrixAt(i, _dummy.matrix);
        }

        getErrorBarColor(err, _errColor);
        const cIdx = i * 3;

        const targetBase = dimmed ? _dimBarColor : _errColor;
        const barBoost = dimmed ? 0.25 : isSelected ? 2.4 : isHovered ? 2.0 : 1.55;
        const tR = targetBase.r * barBoost;
        const tG = targetBase.g * barBoost;
        const tB = targetBase.b * barBoost;

        barColors[cIdx] = THREE.MathUtils.lerp(barColors[cIdx], tR, damp);
        barColors[cIdx + 1] = THREE.MathUtils.lerp(barColors[cIdx + 1], tG, damp);
        barColors[cIdx + 2] = THREE.MathUtils.lerp(barColors[cIdx + 2], tB, damp);

        const cDelta = Math.max(
          Math.abs(tR - barColors[cIdx]),
          Math.abs(tG - barColors[cIdx + 1]),
          Math.abs(tB - barColors[cIdx + 2])
        );
        if (cDelta > maxBarDelta) maxBarDelta = cDelta;

        _scratchColor.setRGB(barColors[cIdx], barColors[cIdx + 1], barColors[cIdx + 2]);
        barsMesh.setColorAt(i, _scratchColor);

        const tipBoost = dimmed ? 0 : isSelected ? 3.2 : 2.1;
        const ttR = _errColor.r * tipBoost;
        const ttG = _errColor.g * tipBoost;
        const ttB = _errColor.b * tipBoost;

        tipColors[cIdx] = THREE.MathUtils.lerp(tipColors[cIdx], ttR, damp);
        tipColors[cIdx + 1] = THREE.MathUtils.lerp(tipColors[cIdx + 1], ttG, damp);
        tipColors[cIdx + 2] = THREE.MathUtils.lerp(tipColors[cIdx + 2], ttB, damp);

        const tcDelta = Math.max(
          Math.abs(ttR - tipColors[cIdx]),
          Math.abs(ttG - tipColors[cIdx + 1]),
          Math.abs(ttB - tipColors[cIdx + 2])
        );
        if (tcDelta > maxBarDelta) maxBarDelta = tcDelta;

        _scratchColor.setRGB(tipColors[cIdx], tipColors[cIdx + 1], tipColors[cIdx + 2]);
        tipsMesh.setColorAt(i, _scratchColor);
      }

      if (updateRingMatrices) {
        if (updateRingOpacities) {
          const targetOpacity = isHit && !dimmed ? (isSelected ? 0.95 : 0.78) : 0;
          const nextOpacity = THREE.MathUtils.lerp(ringOpacities[i], targetOpacity, damp);
          ringOpacities[i] = nextOpacity;
          const oDelta = Math.abs(targetOpacity - nextOpacity);
          if (oDelta > maxRingDelta) maxRingDelta = oDelta;
        }

        const ringOpacity = ringOpacities[i];
        if (ringOpacity > 0.02) {
          activeRings++;
          const pulse = 1 + 0.12 * Math.sin(elapsed * 3.2 + geo.center3D[0]);
          const ringScale = isSelected ? 1.35 * pulse : pulse;

          _dummy.position.set(geo.center3D[0], 0.03, geo.center3D[1]);
          _dummy.rotation.set(-Math.PI / 2, 0, 0);
          _dummy.scale.setScalar(ringScale);
          _dummy.updateMatrix();
          innerRingsMesh.setMatrixAt(i, _dummy.matrix);
          outerRingsMesh.setMatrixAt(i, _dummy.matrix);

          if (updateRingOpacities) {
            _scratchColor.copy(_ringInnerColor).multiplyScalar(ringOpacity);
            innerRingsMesh.setColorAt(i, _scratchColor);
            _scratchColor.copy(_ringOuterColor).multiplyScalar(ringOpacity * 0.45);
            outerRingsMesh.setColorAt(i, _scratchColor);
          }
        } else if (updateRingOpacities) {
          _dummy.position.set(0, -1000, 0);
          _dummy.rotation.set(0, 0, 0);
          _dummy.scale.setScalar(0.0001);
          _dummy.updateMatrix();
          innerRingsMesh.setMatrixAt(i, _dummy.matrix);
          outerRingsMesh.setMatrixAt(i, _dummy.matrix);

          _scratchColor.setRGB(0, 0, 0);
          innerRingsMesh.setColorAt(i, _scratchColor);
          outerRingsMesh.setColorAt(i, _scratchColor);
        }
      }
    }

    if (updateBars) {
      barsMesh.instanceMatrix.needsUpdate = true;
      tipsMesh.instanceMatrix.needsUpdate = true;
      if (barsMesh.instanceColor) barsMesh.instanceColor.needsUpdate = true;
      if (tipsMesh.instanceColor) tipsMesh.instanceColor.needsUpdate = true;
      if (maxBarDelta < 0.001) {
        animState.barsSettled = true;
      }
    }

    if (updateRingMatrices) {
      innerRingsMesh.instanceMatrix.needsUpdate = true;
      outerRingsMesh.instanceMatrix.needsUpdate = true;
      if (updateRingOpacities) {
        animState.activeRingCount = activeRings;
        if (innerRingsMesh.instanceColor) innerRingsMesh.instanceColor.needsUpdate = true;
        if (outerRingsMesh.instanceColor) outerRingsMesh.instanceColor.needsUpdate = true;
        if (maxRingDelta < 0.002) {
          animState.ringsOpacitySettled = true;
        }
      }
    }
  });

  if (count === 0) return null;

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    const geo = geometries[e.instanceId];
    if (!geo) return;
    document.body.style.cursor = 'pointer';
    useDashboardStore.getState().setHoveredRegionCode(geo.regionCode);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    const geo = geometries[e.instanceId];
    if (!geo) return;
    const store = useDashboardStore.getState();
    if (store.hoveredRegionCode !== geo.regionCode) {
      document.body.style.cursor = 'pointer';
      store.setHoveredRegionCode(geo.regionCode);
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'auto';
    const store = useDashboardStore.getState();
    if (e.instanceId !== undefined) {
      const geo = geometries[e.instanceId];
      if (geo && store.hoveredRegionCode === geo.regionCode) {
        store.setHoveredRegionCode(null);
      }
    } else {
      store.setHoveredRegionCode(null);
    }
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    const geo = geometries[e.instanceId];
    if (geo) {
      useDashboardStore.getState().setSelectedRegionCode(geo.regionCode);
    }
  };

  return (
    <group name="prediction-error-bars" key={count}>
      {/* Opaque neon shaft so -Y bars render before translucent glass terrain */}
      <instancedMesh
        ref={barsMeshRef}
        args={[SHARED_BAR_GEO, undefined, count]}
        frustumCulled={false}
        onPointerOver={handlePointerOver}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.2}
          metalness={0.35}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Unlit emissive tip */}
      <instancedMesh
        ref={tipsMeshRef}
        args={[SHARED_TIP_GEO, undefined, count]}
        frustumCulled={false}
      >
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>

      {/* Prediction hit inner rings (|error| <= 2.0%p) */}
      <instancedMesh
        ref={innerRingsMeshRef}
        args={[SHARED_RING_GEO, undefined, count]}
        frustumCulled={false}
      >
        <meshBasicMaterial
          color="#ffffff"
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Prediction hit outer rings */}
      <instancedMesh
        ref={outerRingsMeshRef}
        args={[SHARED_OUTER_RING_GEO, undefined, count]}
        frustumCulled={false}
      >
        <meshBasicMaterial
          color="#ffffff"
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
