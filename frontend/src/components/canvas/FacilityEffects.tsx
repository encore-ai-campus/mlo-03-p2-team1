import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  FACILITY_META,
  JOB_FLOW_LINKS,
  REGIONS_META,
  REGIONS_META_MAP,
  TRANSIT_CORRIDORS,
} from '../../data/regionsMeta';
import { useDashboardStore } from '../../store/useDashboardStore';
import type { FacilityKey } from '../../types/dashboard';

interface FacilityEffectsProps {
  centerMap: Map<string, [number, number]>;
}

const PARTICLE_SPHERE = new THREE.SphereGeometry(0.055, 8, 8);
const PULSE_RING_GEO = new THREE.RingGeometry(0.14, 0.2, 28);
const MAX_RIPPLE_INSTANCES = 30;

// Module-level scratch objects (zero per-frame allocations)
const _tempVec = new THREE.Vector3();
const _rippleDummy = new THREE.Object3D();
const _rippleColor = new THREE.Color();

function JobsFlowLayer({
  centerMap,
}: {
  centerMap: Map<string, [number, number]>;
}) {
  const active = useDashboardStore((s) => s.activeFacilities.jobs);
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { curves, mergedLinesGeo } = useMemo(() => {
    const built = JOB_FLOW_LINKS.map((link, idx) => {
      const from = centerMap.get(link.fromCode);
      const to = centerMap.get(link.toCode);
      if (!from || !to) return null;

      const start = new THREE.Vector3(from[0], 0.08, from[1]);
      const end = new THREE.Vector3(to[0], 0.14, to[1]);
      const dist = start.distanceTo(end);
      const mid = new THREE.Vector3()
        .addVectors(start, end)
        .multiplyScalar(0.5);
      mid.y += Math.max(0.65, dist * 0.42);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(24);
      return { curve, points, idx, strength: link.strength };
    }).filter((c): c is NonNullable<typeof c> => c !== null);

    let segCount = 0;
    for (const c of built) segCount += Math.max(0, c.points.length - 1);

    const pos = new Float32Array(segCount * 2 * 3);
    const col = new Float32Array(segCount * 2 * 4);
    const baseColor = new THREE.Color('#f59e0b');
    let ptr = 0;
    let cPtr = 0;

    for (const c of built) {
      const alpha = 0.32 + c.strength * 0.22;
      for (let i = 0; i < c.points.length - 1; i++) {
        const a = c.points[i];
        const b = c.points[i + 1];
        pos[ptr++] = a.x;
        pos[ptr++] = a.y;
        pos[ptr++] = a.z;
        pos[ptr++] = b.x;
        pos[ptr++] = b.y;
        pos[ptr++] = b.z;

        col[cPtr++] = baseColor.r;
        col[cPtr++] = baseColor.g;
        col[cPtr++] = baseColor.b;
        col[cPtr++] = alpha;
        col[cPtr++] = baseColor.r;
        col[cPtr++] = baseColor.g;
        col[cPtr++] = baseColor.b;
        col[cPtr++] = alpha;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 4));
    return { curves: built, mergedLinesGeo: geo };
  }, [centerMap]);

  useEffect(() => {
    return () => {
      mergedLinesGeo.dispose();
    };
  }, [mergedLinesGeo]);

  const particlesPerCurve = 3;
  const totalParticles = curves.length * particlesPerCurve;

  useFrame(({ clock }) => {
    if (!active || !instancedRef.current || totalParticles === 0) return;
    const tBase = clock.elapsedTime * 0.42;
    let instanceIdx = 0;

    for (let cIdx = 0; cIdx < curves.length; cIdx++) {
      const { curve, strength } = curves[cIdx];
      for (let p = 0; p < particlesPerCurve; p++) {
        const t = (tBase * (0.85 + strength * 0.35) + cIdx * 0.17 + p / particlesPerCurve) % 1;
        curve.getPointAt(t, _tempVec);
        const scale = Math.sin(t * Math.PI) * (0.8 + strength * 0.45);
        dummy.position.copy(_tempVec);
        dummy.scale.setScalar(Math.max(0.01, scale));
        dummy.updateMatrix();
        instancedRef.current.setMatrixAt(instanceIdx++, dummy.matrix);
      }
    }
    instancedRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group name="jobs-flow-layer" visible={active}>
      <lineSegments geometry={mergedLinesGeo}>
        <lineBasicMaterial vertexColors transparent toneMapped={false} />
      </lineSegments>
      <instancedMesh
        ref={instancedRef}
        args={[PARTICLE_SPHERE, undefined, Math.max(1, totalParticles)]}
        frustumCulled={false}
      >
        <meshBasicMaterial color="#fbbf24" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function SubwayPulseLayer({
  centerMap,
}: {
  centerMap: Map<string, [number, number]>;
}) {
  const active = useDashboardStore((s) => s.activeFacilities.subway);
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { tracks, mergedTracksGeo } = useMemo(() => {
    const built = TRANSIT_CORRIDORS.map((corridor) => {
      const pts = corridor.regionCodes
        .map((code) => centerMap.get(code))
        .filter((p): p is [number, number] => Boolean(p))
        .map(([x, z]) => new THREE.Vector3(x, 0.09, z));

      if (pts.length < 2) return null;
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);
      const points = curve.getPoints(48);
      return { id: corridor.id, color: corridor.color, curve, points };
    }).filter((t): t is NonNullable<typeof t> => t !== null);

    let segCount = 0;
    for (const t of built) segCount += Math.max(0, t.points.length - 1);

    const pos = new Float32Array(segCount * 2 * 3);
    const col = new Float32Array(segCount * 2 * 3);
    const tmpCol = new THREE.Color();
    let ptr = 0;
    let cPtr = 0;

    for (const t of built) {
      tmpCol.set(t.color);
      for (let i = 0; i < t.points.length - 1; i++) {
        const a = t.points[i];
        const b = t.points[i + 1];
        pos[ptr++] = a.x;
        pos[ptr++] = a.y;
        pos[ptr++] = a.z;
        pos[ptr++] = b.x;
        pos[ptr++] = b.y;
        pos[ptr++] = b.z;

        col[cPtr++] = tmpCol.r;
        col[cPtr++] = tmpCol.g;
        col[cPtr++] = tmpCol.b;
        col[cPtr++] = tmpCol.r;
        col[cPtr++] = tmpCol.g;
        col[cPtr++] = tmpCol.b;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return { tracks: built, mergedTracksGeo: geo };
  }, [centerMap]);

  useEffect(() => {
    return () => {
      mergedTracksGeo.dispose();
    };
  }, [mergedTracksGeo]);

  const pulsesPerTrack = 4;
  const totalPulses = tracks.length * pulsesPerTrack;

  useFrame(({ clock }) => {
    if (!active || !instancedRef.current || totalPulses === 0) return;
    const elapsed = clock.elapsedTime;
    let idx = 0;

    for (let tIdx = 0; tIdx < tracks.length; tIdx++) {
      const { curve } = tracks[tIdx];
      for (let p = 0; p < pulsesPerTrack; p++) {
        // Ping-pong pulse along rail axis
        const raw = (elapsed * 0.28 + tIdx * 0.19 + p / pulsesPerTrack) % 2;
        const u = raw <= 1 ? raw : 2 - raw;
        curve.getPointAt(THREE.MathUtils.clamp(u, 0.001, 0.999), _tempVec);
        const pulseScale = 0.85 + 0.35 * Math.sin(elapsed * 5 + p);
        dummy.position.copy(_tempVec);
        dummy.scale.setScalar(pulseScale);
        dummy.updateMatrix();
        instancedRef.current.setMatrixAt(idx++, dummy.matrix);
      }
    }
    instancedRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group name="subway-pulse-layer" visible={active}>
      <lineSegments geometry={mergedTracksGeo}>
        <lineBasicMaterial vertexColors transparent opacity={0.65} toneMapped={false} />
      </lineSegments>
      <instancedMesh
        ref={instancedRef}
        args={[PARTICLE_SPHERE, undefined, Math.max(1, totalPulses)]}
        frustumCulled={false}
      >
        <meshBasicMaterial color="#7dd3fc" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

type RippleFacility = Extract<FacilityKey, 'school' | 'commercial' | 'hospital'>;

function RippleFacilityLayer({
  facility,
  centerMap,
}: {
  facility: RippleFacility;
  centerMap: Map<string, [number, number]>;
}) {
  const isFilterActive = useDashboardStore((s) => s.activeFacilities[facility]);
  const selectedCode = useDashboardStore((s) => s.selectedRegionCode);
  const hoveredCode = useDashboardStore((s) => s.hoveredRegionCode);
  const focusCode = selectedCode ?? hoveredCode;

  const hubs = useMemo(() => {
    const sorted = [...REGIONS_META]
      .sort((a, b) => b.facilityScores[facility] - a.facilityScores[facility])
      .filter((r) => r.facilityScores[facility] >= 84)
      .slice(0, 14);
    return sorted.map((r) => r.regionCode);
  }, [facility]);

  const activeCodes = useMemo(() => {
    const set = new Set<string>();
    if (isFilterActive) {
      hubs.forEach((c) => set.add(c));
    }
    if (focusCode) {
      const meta = REGIONS_META_MAP[focusCode];
      if (meta && (isFilterActive || meta.facilityScores[facility] >= 75)) {
        set.add(focusCode);
      }
    }
    return Array.from(set);
  }, [isFilterActive, hubs, focusCode, facility]);

  const baseColor = useMemo(
    () => new THREE.Color(FACILITY_META[facility].color),
    [facility]
  );
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

    const tBase = clock.elapsedTime * 0.72;
    let idx = 0;

    for (let i = 0; i < activeCodes.length && idx + 1 < MAX_RIPPLE_INSTANCES; i++) {
      const code = activeCodes[i];
      const pos = centerMap.get(code);
      if (!pos) continue;

      const isFocus = code === focusCode;
      for (let wave = 0; wave < 2; wave++) {
        const phase = (tBase + i * 0.23 + wave * 0.5) % 1;
        const maxScale = isFocus ? 3.8 : 2.6;
        const s = 0.6 + phase * maxScale;

        _rippleDummy.position.set(pos[0], 0.055, pos[1]);
        _rippleDummy.rotation.set(-Math.PI / 2, 0, 0);
        _rippleDummy.scale.setScalar(s);
        _rippleDummy.updateMatrix();
        mesh.setMatrixAt(idx, _rippleDummy.matrix);

        const brightness = (1 - phase) * (isFocus ? 0.92 : 0.68);
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
      name={`ripple-${facility}`}
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

export function FacilityEffects({ centerMap }: FacilityEffectsProps) {
  return (
    <group name="facility-living-effects">
      <JobsFlowLayer centerMap={centerMap} />
      <SubwayPulseLayer centerMap={centerMap} />
      <RippleFacilityLayer facility="school" centerMap={centerMap} />
      <RippleFacilityLayer facility="commercial" centerMap={centerMap} />
      <RippleFacilityLayer facility="hospital" centerMap={centerMap} />
    </group>
  );
}
