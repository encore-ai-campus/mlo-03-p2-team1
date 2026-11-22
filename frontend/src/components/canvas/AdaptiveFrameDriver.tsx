import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { FRAME_SCHEDULER_CONFIG } from '../../config/scene';
import { useDashboardStore } from '../../store/useDashboardStore';

/**
 * Adaptive demand-based frame scheduler:
 * - Background tab (document.hidden): 0 FPS
 * - Active interaction / state transition (1.2s window): capped at ~60 FPS
 * - Idle ambient animation (particles/pulses/rings): ~30 FPS (or ~18 FPS in Eco Mode)
 */
export function AdaptiveFrameDriver() {
  const { gl, invalidate } = useThree();
  const lastActiveRef = useRef(0);

  useEffect(() => {
    lastActiveRef.current = performance.now();

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
      const isBurst = now - lastActiveRef.current < FRAME_SCHEDULER_CONFIG.burstWindowMs;
      const interval = isBurst
        ? FRAME_SCHEDULER_CONFIG.burstIntervalMs
        : state.ecoMode
          ? FRAME_SCHEDULER_CONFIG.ecoIntervalMs
          : FRAME_SCHEDULER_CONFIG.idleIntervalMs;

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
