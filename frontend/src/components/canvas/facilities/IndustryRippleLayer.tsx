import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { INDUSTRY_META } from '../../../config/industries';
import { getIndustryTopDongCodes, getRegionQuarterRecord } from '../../../services/dashboardData';
import { useDashboardStore } from '../../../store/useDashboardStore';
import type { IndustryKey } from '../../../types/dashboard';

const PULSE_RING_GEO = new THREE.RingGeometry(0.11, 0.16, 28);
const MAX_RIPPLE_INSTANCES = 36;

const _rippleDummy = new THREE.Object3D();
const _rippleColor = new THREE.Color();

interface IndustryRippleLayerProps {
  industry: IndustryKey;
  centerMap: Map<string, [number, number]>;
}

export function IndustryRippleLayer({ industry, centerMap }: IndustryRippleLayerProps) {
  const isFilterActive = useDashboardStore((s) => s.activeIndustries[industry]);
  const viewMode = useDashboardStore((s) => s.viewMode);
  const selectedQuarter = useDashboardStore((s) => s.selectedQuarter);
  const selectedCode = useDashboardStore((s) => s.selectedRegionCode);
  const hoveredCode = useDashboardStore((s) => s.hoveredRegionCode);
  const focusCode = selectedCode ?? hoveredCode;

  const hubs = useMemo(
    () => getIndustryTopDongCodes(selectedQuarter, industry, 16),
    [selectedQuarter, industry],
  );

  const activeCodes = useMemo(() => {
    const set = new Set<string>();
    if (isFilterActive && viewMode === 'market') {
      hubs.forEach((c) => set.add(c));
      if (focusCode) {
        const rec = getRegionQuarterRecord(selectedQuarter, focusCode);
        if (rec && rec.industryStats[industry].activeCnt > 0) {
          set.add(focusCode);
        }
      }
    }
    return Array.from(set);
  }, [isFilterActive, viewMode, hubs, focusCode, selectedQuarter, industry]);

  const baseColor = useMemo(() => new THREE.Color(INDUSTRY_META[industry].color), [industry]);
  const instancedRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = instancedRef.current;
    if (!mesh) return;
    _rippleDummy.position.set(0, -1000, 0);
    _rippleDummy.rotation.set(-Math.PI / 2, 0, 0);
    _rippleDummy.scale.setScalar(0.0001);
    _rippleDummy.updateMatrix();
    _rippleColor.setRGB(0, 0, 0);
    for (let i = 0; i < MAX_RIPPLE_INSTANCES; i++) {
      mesh.setMatrixAt(i, _rippleDummy.matrix);
      mesh.setColorAt(i, _rippleColor);
    }
    mesh.count = 0;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    const mesh = instancedRef.current;
    if (!mesh) return;

    if (activeCodes.length === 0) {
      if (mesh.count !== 0) {
        mesh.count = 0;
      }
      return;
    }

    const tBase = clock.elapsedTime * 0.68;
    let idx = 0;

    for (let i = 0; i < activeCodes.length && idx + 1 < MAX_RIPPLE_INSTANCES; i++) {
      const code = activeCodes[i];
      const pos = centerMap.get(code);
      if (!pos) continue;

      const isFocus = code === focusCode;
      for (let wave = 0; wave < 2; wave++) {
        const phase = (tBase + i * 0.21 + wave * 0.5) % 1;
        const maxScale = isFocus ? 3.2 : 2.1;
        const s = 0.5 + phase * maxScale;

        _rippleDummy.position.set(pos[0], 0.055, pos[1]);
        _rippleDummy.rotation.set(-Math.PI / 2, 0, 0);
        _rippleDummy.scale.setScalar(s);
        _rippleDummy.updateMatrix();
        mesh.setMatrixAt(idx, _rippleDummy.matrix);

        const brightness = (1 - phase) * (isFocus ? 0.9 : 0.65);
        _rippleColor.copy(baseColor).multiplyScalar(brightness);
        mesh.setColorAt(idx, _rippleColor);
        idx++;
      }
    }

    mesh.count = idx;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      name={`industry-ripple-${industry}`}
      ref={instancedRef}
      args={[PULSE_RING_GEO, undefined, MAX_RIPPLE_INSTANCES]}
      visible={activeCodes.length > 0}
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
  );
}
