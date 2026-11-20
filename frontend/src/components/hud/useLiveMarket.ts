import { useEffect, useMemo, useState } from 'react';

interface Quarter {
  year: number;
  quarter: number;
  hasMarketPrices: boolean;
  hasPredictions: boolean;
}

interface LicenseMetric {
  industryCode: string;
  referenceOnly: boolean;
  activeCount: number;
  openCount: number;
  closeCount: number;
}

export interface LiveRegion {
  regionCode: string;
  regionName: string;
  districtName: string | null;
  tradeCount: number | null;
  pricePerSqmWon: number | null;
  actualGrowthPct: number | null;
  predictedRise: boolean | null;
  riseProbability: number | null;
  predictionKind: string | null;
  licenseMetrics: LicenseMetric[];
}

export const quarterKey = ({ year, quarter }: Quarter) => `${year}-${quarter}`;
async function readApi<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`/api/dashboard/${path}`, { signal });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json() as Promise<T>;
}

export function useLiveMarket(active: boolean) {
  const [periods, setPeriods] = useState<Quarter[]>([]);
  const [period, setPeriod] = useState('');
  const [result, setResult] = useState<{ period: string; regions: LiveRegion[] } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!active) return;
    const request = new AbortController();
    readApi<Quarter[]>('quarters', request.signal)
      .then((data) => {
        if (request.signal.aborted) return;
        const available = [...data].sort((a, b) => a.year - b.year || a.quarter - b.quarter);
        const latest = [...available].reverse().find((item) => item.hasMarketPrices) ?? available[available.length - 1];
        setPeriods(available);
        if (latest) setPeriod(quarterKey(latest));
        else setLoading(false);
      })
      .catch(() => {
        if (!request.signal.aborted) {
          setError('FastAPI에 연결할 수 없습니다. 서버를 확인하고 새로고침하세요.');
          setLoading(false);
        }
      });
    return () => request.abort();
  }, [active]);

  useEffect(() => {
    if (!active || !period) return;
    const request = new AbortController();
    const [year, quarter] = period.split('-');
    readApi<{ regions: LiveRegion[] }>(`regions?year=${year}&quarter=${quarter}`, request.signal)
      .then(({ regions }) => {
        if (!request.signal.aborted) setResult({ period, regions });
      })
      .catch(() => {
        if (!request.signal.aborted) setError('선택한 기간의 데이터를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!request.signal.aborted) setLoading(false);
      });
    return () => request.abort();
  }, [active, period]);

  const byDistrict = useMemo(() => {
    const districts = new Map<string, LiveRegion[]>();
    if (result?.period !== period) return districts;
    for (const region of result.regions) {
      const district = region.districtName?.trim().split(/\s+/).pop();
      if (district) districts.set(district, [...(districts.get(district) ?? []), region]);
    }
    return districts;
  }, [result, period]);

  return {
    periods, period, byDistrict, error, loading,
    selectPeriod: (value: string) => {
      if (period === value) return;
      setError('');
      setLoading(true);
      setPeriod(value);
    },
  };
}

export type LiveMarket = ReturnType<typeof useLiveMarket>;
