import { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CAMERA_CONFIG } from '../../config/scene';
import { useDashboardStore } from '../../store/useDashboardStore';

const DEFAULT_CAM_POS = new THREE.Vector3(...CAMERA_CONFIG.defaultPosition);
const DEFAULT_TARGET = new THREE.Vector3(...CAMERA_CONFIG.defaultTarget);

interface CameraRigProps {
  centerMap: Map<string, [number, number]>;
}

export function CameraRig({ centerMap }: CameraRigProps) {
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
    if (!selectedRegionCode) return;
    const center = centerMap.get(selectedRegionCode);
    if (!center) return;

    desiredTarget.current.set(center[0], CAMERA_CONFIG.focusTargetY, center[1]);
    desiredPos.current.set(
      center[0],
      CAMERA_CONFIG.focusOffsetY,
      center[1] + CAMERA_CONFIG.focusOffsetZ,
    );
    isAnimating.current = true;
    needsDamping.current = true;
    invalidate();
  }, [selectedRegionCode, centerMap, invalidate]);

  useEffect(() => {
    if (cameraResetTick <= 0) return;
    desiredTarget.current.copy(DEFAULT_TARGET);
    desiredPos.current.copy(DEFAULT_CAM_POS);
    isAnimating.current = true;
    needsDamping.current = true;
    invalidate();
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
      const k = 1 - Math.exp(-Math.min(delta, 0.1) * CAMERA_CONFIG.lerpSpeed);
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
      panSpeed={CAMERA_CONFIG.panSpeed}
      screenSpacePanning={false}
      enableDamping
      dampingFactor={CAMERA_CONFIG.dampingFactor}
      minDistance={CAMERA_CONFIG.minDistance}
      maxDistance={CAMERA_CONFIG.maxDistance}
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
