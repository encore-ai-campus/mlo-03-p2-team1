import { useEffect, useMemo, useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import type { ProjectedRegionGeometry } from '../types/dashboard';
import { loadSeoulGeometries } from '../utils/seoulGeo';

export function useMapGeometries() {
  const [geometries, setGeometries] = useState<ProjectedRegionGeometry[]>([]);
  const forceFallbackGeo = useDashboardStore((s) => s.forceFallbackGeo);
  const setGeoStatus = useDashboardStore((s) => s.setGeoStatus);

  useEffect(() => {
    let cancelled = false;
    setGeoStatus('loading');
    loadSeoulGeometries(forceFallbackGeo).then((result) => {
      if (cancelled) return;
      setGeometries(result.geometries);
      setGeoStatus(result.status);
    });
    return () => {
      cancelled = true;
    };
  }, [forceFallbackGeo, setGeoStatus]);

  const centerMap = useMemo(() => {
    const map = new Map<string, [number, number]>();
    for (const g of geometries) {
      map.set(g.regionCode, g.center3D);
    }
    return map;
  }, [geometries]);

  return { geometries, centerMap };
}
