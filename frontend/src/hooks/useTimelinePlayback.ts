import { useEffect } from 'react';
import { TIMELINE_CONFIG } from '../config/scene';
import { useDashboardStore } from '../store/useDashboardStore';

export function useTimelinePlayback() {
  const isPlaying = useDashboardStore((s) => s.isPlaying);
  const stepQuarter = useDashboardStore((s) => s.stepQuarter);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      stepQuarter();
    }, TIMELINE_CONFIG.autoplayIntervalMs);
    return () => window.clearInterval(timer);
  }, [isPlaying, stepQuarter]);
}
