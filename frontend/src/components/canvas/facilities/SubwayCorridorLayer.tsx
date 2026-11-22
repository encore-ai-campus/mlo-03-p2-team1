import { useEffect, useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getTransitCorridors } from '../../../services/dashboardData';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { projectLngLat } from '../../../utils/seoulGeo';

const PARTICLE_SPHERE = new THREE.SphereGeometry(0.052, 8, 8);
const DOKSAN_STATION_LNGLAT: [number, number] = [126.8895, 37.4666];
const _tempVec = new THREE.Vector3();
const _dummy = new THREE.Object3D();

interface SubwayCorridorLayerProps {
  centerMap: Map<string, [number, number]>;
}

export function SubwayCorridorLayer({ centerMap }: SubwayCorridorLayerProps) {
  const active = useDashboardStore((s) => s.viewMode === 'market');
  const instancedRef = useRef<THREE.InstancedMesh>(null);

  const { tracks, mergedTracksGeo } = useMemo(() => {
    const corridors = getTransitCorridors();
    const built = corridors
      .map((corridor) => {
        const pts: THREE.Vector3[] = [];
        if (corridor.startLngLat) {
          const [sx, sz] = projectLngLat(corridor.startLngLat);
          pts.push(new THREE.Vector3(sx, 0.09, sz));
        }
        for (const code of corridor.regionCodes) {
          const p = centerMap.get(code);
          if (p) pts.push(new THREE.Vector3(p[0], 0.09, p[1]));
        }
        if (corridor.endLngLat) {
          const [ex, ez] = projectLngLat(corridor.endLngLat);
          pts.push(new THREE.Vector3(ex, 0.09, ez));
        }

        if (pts.length < 2) return null;
        const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);
        const points = curve.getPoints(48);
        return { id: corridor.id, color: corridor.color, curve, points };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

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

  const pulsesPerTrack = 3;
  const totalPulses = tracks.length * pulsesPerTrack;

  useFrame(({ clock }) => {
    if (!active || !instancedRef.current || totalPulses === 0) return;
    const elapsed = clock.elapsedTime;
    let idx = 0;

    for (let tIdx = 0; tIdx < tracks.length; tIdx++) {
      const { curve } = tracks[tIdx];
      for (let p = 0; p < pulsesPerTrack; p++) {
        const raw = (elapsed * 0.055 + tIdx * 0.19 + (p * 2) / pulsesPerTrack) % 2;
        const u = raw <= 1 ? raw : 2 - raw;
        curve.getPointAt(THREE.MathUtils.clamp(u, 0.001, 0.999), _tempVec);
        const pulseScale = 0.9 + 0.14 * Math.sin(elapsed * 1.6 + p);
        _dummy.position.copy(_tempVec);
        _dummy.scale.setScalar(pulseScale);
        _dummy.updateMatrix();
        instancedRef.current.setMatrixAt(idx++, _dummy.matrix);
      }
    }
    instancedRef.current.instanceMatrix.needsUpdate = true;
  });

  const doksanPos = useMemo(() => projectLngLat(DOKSAN_STATION_LNGLAT), []);

  return (
    <group name="seoul-subway-corridor-layer" visible={active}>
      <lineSegments geometry={mergedTracksGeo}>
        <lineBasicMaterial vertexColors transparent opacity={0.62} toneMapped={false} />
      </lineSegments>
      <instancedMesh
        ref={instancedRef}
        args={[PARTICLE_SPHERE, undefined, Math.max(1, totalPulses)]}
        frustumCulled={false}
      >
        <meshBasicMaterial color="#7dd3fc" toneMapped={false} />
      </instancedMesh>

      {/* Encore Playdata Campus Landmark Pin at Doksan Station (Line 1) */}
      {active && (
        <group position={[doksanPos[0], 0.09, doksanPos[1]]}>
          {/* Teal beacon ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.14, 0.21, 28]} />
            <meshBasicMaterial color="#6fc59d" transparent opacity={0.9} toneMapped={false} />
          </mesh>
          {/* Vertical stem */}
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.9, 8]} />
            <meshBasicMaterial color="#007379" toneMapped={false} />
          </mesh>
          {/* Floating Encore Playdata Brand Badge */}
          <Html
            position={[0, 1.02, 0]}
            center
            zIndexRange={[10, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#6fc59d]/70 bg-[#071a1c]/90 px-2.5 py-1 shadow-[0_0_16px_rgba(0,115,121,0.65)] backdrop-blur-md">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <defs>
                  <linearGradient id="encorePlayGrad" x1="0" y1="0" x2="24" y2="24">
                    <stop offset="0%" stopColor="#007379" />
                    <stop offset="100%" stopColor="#6fc59d" />
                  </linearGradient>
                </defs>
                <rect width="24" height="24" rx="6" fill="url(#encorePlayGrad)" />
                <path d="M9.5 7.5L17.5 12L9.5 16.5V7.5Z" fill="#ffffff" />
              </svg>
              <span className="font-mono text-[11px] font-extrabold tracking-tight text-white">
                PLAYDATA
              </span>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}
