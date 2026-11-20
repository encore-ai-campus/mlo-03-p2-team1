import { useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';
import type { LiveMarket } from './useLiveMarket';

const count = (value: number | null) => value?.toLocaleString('ko-KR') ?? '—';
const percent = (value: number | null) => value === null ? '—' : `${value.toFixed(1)}%`;
const selectStyle = 'w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 focus-visible:outline focus-visible:outline-cyan-400';

export interface LiveRegionDetailProps {
  market: LiveMarket;
  districts: Map<string, string>;
}

export function LiveRegionDetail({ market, districts }: LiveRegionDetailProps) {
  const [regionCode, setRegionCode] = useState('');
  const selectedCode = useDashboardStore((state) => state.selectedRegionCode);
  const selectDistrict = useDashboardStore((state) => state.setSelectedRegionCode);
  const geoStatus = useDashboardStore((state) => state.geoStatus);
  const district = selectedCode ? districts.get(selectedCode) : undefined;
  const regions = district ? market.byDistrict.get(district) : undefined;
  const region = regions?.find((item) => item.regionCode === regionCode) ?? regions?.[0];
  const status = market.error || (market.loading
    ? '데이터를 불러오는 중입니다.'
    : !market.periods.length ? '조회할 수 있는 데이터가 없습니다.'
    : geoStatus === 'fallback' ? '서울 자치구 경계를 불러올 수 없습니다.'
    : !district ? '지도에서 서울 자치구를 선택하세요.'
    : !region ? '선택한 기간에 조회할 법정동이 없습니다.' : '');

  return (
    <aside aria-label="지역 상세" className="pointer-events-auto fixed right-5 top-[82px] z-20 w-[316px] max-h-[calc(100vh-180px)] overflow-y-auto">
      <div className="hud-glass rounded-2xl p-4 space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <MapPin className="h-3 w-3 text-cyan-400" />
              {market.period.replace('-', ' Q') || '서울'}
            </div>
            <h2 className="mt-0.5 text-lg font-bold tracking-tight text-white">
              {district ?? '시장 국면 브리핑'}
            </h2>
          </div>
          {selectedCode && (
            <button type="button" onClick={() => selectDistrict(null)} title="선택 해제" className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {status && <p role={market.error ? 'alert' : 'status'} className="mt-2 text-sm text-slate-300">{status}</p>}
        {region && (
          <>
            <label className="mt-3 block text-xs text-slate-400">
              법정동
              <select value={region.regionCode} onChange={(event) => setRegionCode(event.target.value)} className={`mt-1 ${selectStyle}`}>
                {regions?.map((item) => <option key={item.regionCode} value={item.regionCode}>{item.regionName}</option>)}
              </select>
            </label>
            <dl className="mt-3 divide-y divide-slate-800 text-sm">
              {[
                ['㎡당 매매가', region.pricePerSqmWon === null ? '—' : `${count(region.pricePerSqmWon)}원`],
                ['거래 건수', count(region.tradeCount)],
                ['전년 동분기 대비', percent(region.actualGrowthPct)],
                ['가격 상승 예측', region.predictedRise === null ? '—' : region.predictedRise ? '상승' : '상승 아님'],
                ['상승 확률', percent(region.riseProbability === null ? null : region.riseProbability * 100)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-2 py-2">
                  <dt className="text-slate-400">{label}</dt>
                  <dd className="font-medium tabular-nums text-slate-100">{value}</dd>
                </div>
              ))}
            </dl>
            {region.licenseMetrics.length > 0 && (
              <details className="mt-3 border-t border-slate-800 pt-2 text-sm">
                <summary className="cursor-pointer text-cyan-200">업종별 인허가</summary>
                <ul className="mt-2 space-y-2">
                  {region.licenseMetrics.map((item) => (
                    <li key={item.industryCode}>
                      <span>{item.industryCode}{item.referenceOnly ? ' (참고)' : ''}</span>
                      <p className="text-xs text-slate-400">기말 영업 {item.activeCount} / 개업 {item.openCount} / 폐업 {item.closeCount}</p>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
        {!selectedCode && !market.loading && (
          <div className="space-y-1.5 border-t border-slate-800/80 pt-2.5">
            {[...districts].filter(([, name]) => market.byDistrict.has(name)).map(([code, name]) => (
              <button key={code} type="button" onClick={() => selectDistrict(code)} className="flex w-full items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/50 px-2.5 py-1.5 text-left text-xs font-semibold text-slate-100 hover:border-cyan-400/50 hover:bg-slate-800/70">
                {name}
                <span className="font-mono text-cyan-300">{market.byDistrict.get(name)?.length}개 법정동</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
