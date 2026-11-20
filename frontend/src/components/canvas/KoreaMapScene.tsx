import { useEffect, useMemo, useRef, useState } from 'react';
import { Html, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { LiveRegion } from '../hud/useLiveMarket';
import { useDashboardStore } from '../../store/useDashboardStore';
import type { ProjectedRegionGeometry } from '../../types/dashboard';
import { loadKoreaGeometries } from '../../utils/koreaGeo';
import { ErrorBarsLayer } from './ErrorBar';
import { FacilityEffects } from './FacilityEffects';
import { RegionPolygonsLayer } from './RegionPolygon';

const DEFAULT_CAM_POS = new THREE.Vector3(0, 26, 25);
const DEFAULT_TARGET = new THREE.Vector3(0, -0.5, 0.5);

/**
 * Adaptive demand-based frame scheduler:
 * - Background tab (document.hidden): 0 FPS
 * - Active interaction / state transition (1.2s window): capped at ~60 FPS
 * - Idle ambient animation (particles/pulses/rings): ~30 FPS (or ~18 FPS in Eco Mode)
 */
function AdaptiveFrameDriver() {
  const { gl, invalidate } = useThree();
  const lastActiveRef = useRef(performance.now());

  useEffect(() => {
    const bump = () => {
      lastActiveRef.current = performance.now();
      invalidate();
    };

    const unsub = useDashboardStore.subscribe(bump);
    const dom = gl.domElement;
    dom.addEventListener('pointerdown', bump, { passive: true });
    dom.addEventListener('pointermove', bump, { passive: true });
    dom.addEventListener('wheel', bump, { passive: true });
    dom.addEventListener('touchstart', bump, { passive: true });
    dom.addEventListener('touchmove', bump, { passive: true });

    let rafId = 0;
    let lastDraw = 0;

    const tick = (now: number) => {
      rafId = window.requestAnimationFrame(tick);
      if (document.hidden) return;

      const state = useDashboardStore.getState();
      const isBurst = now - lastActiveRef.current < 1200;
      const interval = isBurst ? 16 : state.ecoMode ? 55 : 33;

      if (now - lastDraw >= interval) {
        lastDraw = now;
        invalidate();
      }
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      unsub();
      dom.removeEventListener('pointerdown', bump);
      dom.removeEventListener('pointermove', bump);
      dom.removeEventListener('wheel', bump);
      dom.removeEventListener('touchstart', bump);
      dom.removeEventListener('touchmove', bump);
    };
  }, [gl, invalidate]);

  return null;
}

function CameraRig({
  centerMap,
}: {
  centerMap: Map<string, [number, number]>;
}) {
  const { camera, invalidate } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const selectedRegionCode = useDashboardStore((s) => s.selectedRegionCode);
  const cameraResetTick = useDashboardStore((s) => s.cameraResetTick);

  const desiredPos = useRef(DEFAULT_CAM_POS.clone());
  const desiredTarget = useRef(DEFAULT_TARGET.clone());
  const isAnimating = useRef(false);
  const isInteracting = useRef(false);
  const needsDamping = useRef(false);
  const isUpdatingControls = useRef(false);
  const prevCamPos = useRef(DEFAULT_CAM_POS.clone());
  const prevTarget = useRef(DEFAULT_TARGET.clone());

  useEffect(() => {
    if (selectedRegionCode) {
      const center = centerMap.get(selectedRegionCode);
      if (center) {
        desiredTarget.current.set(center[0], 0.3, center[1]);
        desiredPos.current.set(center[0], 9.2, center[1] + 8.6);
        isAnimating.current = true;
        needsDamping.current = true;
        invalidate();
      }
    }
  }, [selectedRegionCode, centerMap, invalidate]);

  useEffect(() => {
    if (cameraResetTick > 0) {
      desiredTarget.current.copy(DEFAULT_TARGET);
      desiredPos.current.copy(DEFAULT_CAM_POS);
      isAnimating.current = true;
      needsDamping.current = true;
      invalidate();
    }
  }, [cameraResetTick, invalidate]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onStart = () => {
      isAnimating.current = false;
      isInteracting.current = true;
      needsDamping.current = true;
      invalidate();
    };
    const onEnd = () => {
      isInteracting.current = false;
      needsDamping.current = true;
      invalidate();
    };
    const onChange = () => {
      if (!isUpdatingControls.current) {
        needsDamping.current = true;
        invalidate();
      }
    };
    controls.addEventListener('start', onStart);
    controls.addEventListener('end', onEnd);
    controls.addEventListener('change', onChange);
    return () => {
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
      controls.removeEventListener('change', onChange);
    };
  }, [invalidate]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (!isAnimating.current && !isInteracting.current && !needsDamping.current) {
      return;
    }

    if (isAnimating.current) {
      const k = 1 - Math.exp(-Math.min(delta, 0.1) * 4.5);
      camera.position.lerp(desiredPos.current, k);
      controls.target.lerp(desiredTarget.current, k);
      if (
        camera.position.distanceTo(desiredPos.current) < 0.08 &&
        controls.target.distanceTo(desiredTarget.current) < 0.08
      ) {
        isAnimating.current = false;
      }
    }

    prevCamPos.current.copy(camera.position);
    prevTarget.current.copy(controls.target);

    isUpdatingControls.current = true;
    controls.update();
    isUpdatingControls.current = false;

    if (!isAnimating.current && !isInteracting.current) {
      const moved =
        prevCamPos.current.distanceToSquared(camera.position) +
        prevTarget.current.distanceToSquared(controls.target);
      if (moved < 1e-8) {
        needsDamping.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableRotate={false}
      enablePan
      panSpeed={1.15}
      screenSpacePanning={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={6}
      maxDistance={52}
      mouseButtons={{
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      touches={{
        ONE: THREE.TOUCH.PAN,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
    />
  );
}

export function KoreaMapScene({
  liveDistricts, onDistrictsReady,
}: {
  liveDistricts?: Map<string, LiveRegion[]>;
  onDistrictsReady: (districts: Map<string, string>) => void;
}) {
  const [geometries, setGeometries] = useState<ProjectedRegionGeometry[]>([]);
  const forceFallbackGeo = useDashboardStore((s) => s.forceFallbackGeo);
  const ecoMode = useDashboardStore((s) => s.ecoMode);
  const setGeoStatus = useDashboardStore((s) => s.setGeoStatus);

  useEffect(() => {
    let cancelled = false;
    setGeoStatus('loading');
    loadKoreaGeometries(forceFallbackGeo).then((result) => {
      if (cancelled) return;
      setGeometries(result.geometries);
      setGeoStatus(result.status);
    });
    return () => {
      cancelled = true;
    };
  }, [forceFallbackGeo, setGeoStatus]);

  const live = liveDistricts !== undefined;
  const centerMap = useMemo(() => {
    const map = new Map<string, [number, number]>();
    for (const g of geometries) {
      map.set(g.regionCode, live && g.districtCenter3D ? g.districtCenter3D : g.center3D);
    }
    return map;
  }, [geometries, live]);

  useEffect(() => {
    const districts = new Map<string, string>();
    for (const geometry of geometries) {
      if (geometry.districtName) districts.set(geometry.regionCode, geometry.districtName);
    }
    onDistrictsReady(districts);
  }, [geometries, onDistrictsReady]);

  return (
    <div aria-label="3D 지도" className="fixed inset-0 w-screen h-screen bg-[#050811]">
      <Canvas
        frameloop="demand"
        camera={{ position: [0, 26, 25], fov: 42, near: 0.1, far: 180 }}
        dpr={ecoMode ? 1 : [1, 1.35]}
        gl={{ antialias: ecoMode, powerPreference: 'default', stencil: false }}
        onPointerMissed={() => useDashboardStore.getState().setSelectedRegionCode(null)}
      >
        <color attach="background" args={['#050811']} />
        <fog attach="fog" args={['#050811', 42, 95]} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[18, 32, 16]} intensity={1.1} color="#f8fafc" />
        <directionalLight position={[-18, 12, -20]} intensity={0.42} color="#38bdf8" />

        {/* Lightweight static datum grid (1 LineSegments draw call, zero fragment shader overdraw) */}
        <gridHelper args={[56, 36, '#1e293b', '#0f172a']} position={[0, -0.37, 0]} />

        {geometries.length > 0 && (
          <group>
            <RegionPolygonsLayer geometries={geometries} live={liveDistricts !== undefined} />
            {liveDistricts ? (
              geometries.map(({ districtName, regionCode, districtCenter3D }) => {
                if (!districtName || !districtCenter3D) return null;
                const regions = liveDistricts.get(districtName) ?? [];
                const visible = regions.some((region) =>
                  region.pricePerSqmWon !== null || region.predictedRise !== null ||
                  region.licenseMetrics.some((item) => item.activeCount > 0 || item.openCount > 0 || item.closeCount > 0)
                );
                if (!visible) return null;
                return (
                  <group key={regionCode} position={[districtCenter3D[0], 0.4, districtCenter3D[1]]}>
                    <mesh>
                      <cylinderGeometry args={[0.085, 0.095, 0.8, 10]} />
                      <meshBasicMaterial color="#22d3ee" />
                    </mesh>
                    <Html center position={[0, 0.55, 0]} zIndexRange={[9, 1]}>
                      <button
                        type="button"
                        aria-label={`${districtName} 지도에서 선택`}
                        className="whitespace-nowrap rounded border border-cyan-400/60 bg-slate-950/90 px-1.5 py-0.5 text-xs text-cyan-100 focus-visible:outline focus-visible:outline-cyan-300"
                        onClick={(event) => {
                          event.stopPropagation();
                          useDashboardStore.getState().setSelectedRegionCode(regionCode);
                        }}
                      >
                        {districtName}
                      </button>
                    </Html>
                  </group>
                );
              })
            ) : (
              <>
                <ErrorBarsLayer geometries={geometries} />
                <FacilityEffects centerMap={centerMap} />
              </>
            )}
          </group>
        )}

        <CameraRig centerMap={centerMap} />
        <AdaptiveFrameDriver />

        {!ecoMode && (
          <EffectComposer multisampling={0}>
            <Bloom
              levels={5}
              intensity={0.72}
              luminanceThreshold={0.52}
              luminanceSmoothing={0.35}
              mipmapBlur
            />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
