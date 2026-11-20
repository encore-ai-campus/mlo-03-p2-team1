import { LiveRegionDetail, type LiveRegionDetailProps } from './LiveRegionDetail';
import { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, Crosshair, MapPin, X } from 'lucide-react';
import {
  getRegionComparisonDelta,
  REGIME_DATA_BY_YEAR,
  REGIME_MAP_BY_YEAR,
  YEAR_SUMMARIES,
} from '../../data/mockRegimes';
import { FACILITY_META } from '../../data/regionsMeta';
import { useDashboardStore } from '../../store/useDashboardStore';
import type { FacilityKey, FacilityScores } from '../../types/dashboard';

const RADAR_ORDER: FacilityKey[] = ['jobs', 'subway', 'school', 'commercial', 'hospital'];

function FacilityRadarChart({ scores }: { scores: FacilityScores }) {
  const size = 196;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 62;

  const pointAt = (idx: number, val: number) => {
    const angle = (idx / RADAR_ORDER.length) * Math.PI * 2 - Math.PI / 2;
    const r = (val / 100) * maxR;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  };

  const dataPolygon = RADAR_ORDER.map((key, i) => pointAt(i, scores[key]))
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Concentric pentagon rings */}
        {[25, 50, 75, 100].map((level) => {
          const pts = RADAR_ORDER.map((_, i) => pointAt(i, level))
            .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
            .join(' ');
          return (
            <polygon
              key={level}
              points={pts}
              fill="none"
              stroke="rgba(148,163,184,0.16)"
              strokeWidth={1}
              strokeDasharray={level < 100 ? '2 2' : undefined}
            />
          );
        })}

        {/* Axis lines & labels */}
        {RADAR_ORDER.map((key, i) => {
          const [ax, ay] = pointAt(i, 100);
          const [lx, ly] = pointAt(i, 127);
          const meta = FACILITY_META[key];
          return (
            <g key={key}>
              <line
                x1={cx}
                y1={cy}
                x2={ax}
                y2={ay}
                stroke="rgba(148,163,184,0.2)"
                strokeWidth={1}
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#cbd5e1"
                fontSize={10}
                fontWeight={600}
              >
                {meta.shortLabel}
              </text>
              <text
                x={lx}
                y={ly + 11}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={meta.color}
                fontSize={9}
                fontFamily="monospace"
              >
                {scores[key]}
              </text>
            </g>
          );
        })}

        {/* Filled score polygon */}
        <polygon
          points={dataPolygon}
          fill="rgba(56, 189, 248, 0.24)"
          stroke="#38bdf8"
          strokeWidth={1.8}
        />

        {/* Vertex dots */}
        {RADAR_ORDER.map((key, i) => {
          const [vx, vy] = pointAt(i, scores[key]);
          return (
            <circle
              key={key}
              cx={vx}
              cy={vy}
              r={3}
              fill={FACILITY_META[key].color}
              stroke="#0f172a"
              strokeWidth={1}
            />
          );
        })}
      </svg>
    </div>
  );
}

function GrowthBarRow({
  label,
  value,
  maxAbs = 26,
  barColor,
}: {
  label: string;
  value: number;
  maxAbs?: number;
  barColor: string;
}) {
  const widthPct = Math.min(100, (Math.abs(value) / maxAbs) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-300">{label}</span>
        <span className="font-mono font-semibold text-slate-100">
          {value >= 0 ? '+' : ''}
          {value.toFixed(2)}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/90">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${widthPct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

export function RightDetailCard({ live }: { live?: LiveRegionDetailProps }) {
  return live ? <LiveRegionDetail {...live} /> : <DemoRegionDetail />;
}

function DemoRegionDetail() {
  const selectedYear = useDashboardStore((s) => s.selectedYear);
  const selectedRegionCode = useDashboardStore((s) => s.selectedRegionCode);
  const hoveredRegionCode = useDashboardStore((s) => s.hoveredRegionCode);
  const comparisonMode = useDashboardStore((s) => s.comparisonMode);
  const setSelectedRegionCode = useDashboardStore((s) => s.setSelectedRegionCode);

  const activeCode = selectedRegionCode ?? hoveredRegionCode;
  const record = activeCode ? REGIME_MAP_BY_YEAR[selectedYear][activeCode] : null;
  const summary = YEAR_SUMMARIES[selectedYear];

  const sortedSpotlight = useMemo(() => {
    const regime = YEAR_SUMMARIES[selectedYear].regime;
    return [...REGIME_DATA_BY_YEAR[selectedYear]]
      .sort((a, b) =>
        regime === 'SLUMP' ? a.error - b.error : b.actualGrowth - a.actualGrowth
      )
      .slice(0, 5);
  }, [selectedYear]);

  if (!record) {
    // National highlight briefing card when no region is focused

    return (
      <aside className="pointer-events-auto fixed right-5 top-[82px] z-20 w-[308px] space-y-3">
        <div className="hud-glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              {selectedYear}년 시장 국면 브리핑
            </span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
              {summary.regime}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300">
            {summary.regimeDescription}
          </p>

          <div className="border-t border-slate-800/80 pt-2.5">
            <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <span>
                {summary.regime === 'SLUMP'
                  ? '최대 음의 오차(-Y) 지역 TOP 5'
                  : '최고 상승·오차 핵심 지역 TOP 5'}
              </span>
              <span className="text-cyan-400">클릭 포커스</span>
            </div>
            <div className="space-y-1.5">
              {sortedSpotlight.map((r) => (
                <button
                  key={r.regionCode}
                  type="button"
                  onClick={() => setSelectedRegionCode(r.regionCode)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/50 px-2.5 py-1.5 text-left transition hover:border-cyan-400/50 hover:bg-slate-800/70"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-100">
                      {r.regionName}
                    </div>
                    <div className="text-[10px] text-slate-400">{r.sido}</div>
                  </div>
                  <div className="text-right font-mono">
                    <div
                      className={`text-xs font-bold ${
                        r.actualGrowth >= 0 ? 'text-amber-300' : 'text-blue-300'
                      }`}
                    >
                      {r.actualGrowth >= 0 ? '+' : ''}
                      {r.actualGrowth.toFixed(1)}%
                    </div>
                    <div
                      className={`text-[10px] ${
                        Math.abs(r.error) <= 2
                          ? 'text-cyan-400'
                          : r.error > 0
                          ? 'text-rose-400'
                          : 'text-violet-400'
                      }`}
                    >
                      오차 {r.error >= 0 ? '+' : ''}
                      {r.error.toFixed(1)}%p
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-cyan-500/10 px-2.5 py-2 text-[10px] text-cyan-200 border border-cyan-500/20">
            <Crosshair className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
            <span>지도 위 시·군·구나 오차 막대를 클릭하면 카메라가 포커스됩니다.</span>
          </div>
        </div>
      </aside>
    );
  }

  const isPinned = selectedRegionCode === record.regionCode;
  const isHit = Math.abs(record.error) <= 2.0;
  const compDelta = comparisonMode
    ? getRegionComparisonDelta(record.regionCode, selectedYear)
    : null;

  const errorBadgeClass = isHit
    ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300'
    : record.error > 2.0
    ? 'border-rose-400/40 bg-rose-500/15 text-rose-300'
    : 'border-violet-400/40 bg-violet-500/15 text-violet-300';

  const errorLabel = isHit
    ? '예측 적중 (링)'
    : record.error > 2.0
    ? '과소 예측 (+Y 상승)'
    : '과대 예측 (-Y 하강)';

  return (
    <aside className="pointer-events-auto fixed right-5 top-[82px] z-20 w-[316px] max-h-[calc(100vh-180px)] overflow-y-auto">
      <div className="hud-glass rounded-2xl p-4 space-y-3.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <MapPin className="h-3 w-3 text-cyan-400" />
              <span>{record.sido}</span>
              <span className="font-mono text-[10px] text-slate-500">
                #{record.regionCode}
              </span>
            </div>
            <h2 className="mt-0.5 text-lg font-bold tracking-tight text-white">
              {record.regionName}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                isPinned
                  ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200'
                  : 'border-slate-700 bg-slate-800/80 text-slate-400'
              }`}
            >
              {isPinned ? '고정됨' : '미리보기'}
            </span>
            {isPinned && (
              <button
                type="button"
                onClick={() => setSelectedRegionCode(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                title="선택 해제"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Price per Sqm */}
        <div className="flex items-end justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-2.5">
          <div>
            <div className="text-[10px] text-slate-400">
              {selectedYear}년 m²당 평균 매매가
            </div>
            <div className="mt-0.5 font-mono text-xl font-bold text-white">
              {record.pricePerSqm.toLocaleString()}
              <span className="ml-1 text-xs font-normal text-slate-400">만원/m²</span>
            </div>
          </div>
          {compDelta && (
            <div className="text-right">
              <div className="text-[10px] text-slate-400">2021 대비 가격</div>
              <div
                className={`inline-flex items-center font-mono text-xs font-semibold ${
                  compDelta.priceDeltaPct >= 0 ? 'text-amber-300' : 'text-blue-300'
                }`}
              >
                {compDelta.priceDeltaPct >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {compDelta.priceDeltaPct >= 0 ? '+' : ''}
                {compDelta.priceDeltaPct.toFixed(1)}%
              </div>
            </div>
          )}
        </div>

        {/* Actual vs Predicted Comparison */}
        <div className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-900/45 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300">
              실제 vs AI 예측 비교
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${errorBadgeClass}`}
            >
              {errorLabel}
            </span>
          </div>

          <GrowthBarRow
            label="실제 연간 상승률"
            value={record.actualGrowth}
            barColor={record.actualGrowth >= 0 ? '#f97316' : '#3b82f6'}
          />
          <GrowthBarRow
            label="AI 모델 예측 상승률"
            value={record.predictedGrowth}
            barColor="#94a3b8"
          />

          <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs">
            <span className="text-slate-400">예측 오차 (실제 - 예측)</span>
            <span
              className={`font-mono font-bold ${
                isHit
                  ? 'text-cyan-300'
                  : record.error > 0
                  ? 'text-rose-400'
                  : 'text-violet-400'
              }`}
            >
              {record.error >= 0 ? '+' : ''}
              {record.error.toFixed(2)}%p
            </span>
          </div>
        </div>

        {/* 5 Facility Impact Radar */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/45 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300">
              5대 입지 시설 영향력 점수
            </span>
            <span className="font-mono text-[10px] text-slate-500">0–100</span>
          </div>

          <FacilityRadarChart scores={record.facilityScores} />

          <div className="mt-2 border-t border-slate-800/80 pt-2.5 space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              핵심 상승·오차 기여 요인 TOP 2
            </div>
            <div className="flex flex-wrap gap-1.5">
              {record.topDrivers.map((driver, idx) => {
                const meta = FACILITY_META[driver];
                return (
                  <span
                    key={driver}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium"
                    style={{
                      borderColor: `${meta.color}55`,
                      backgroundColor: `${meta.color}18`,
                      color: '#f1f5f9',
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    #{idx + 1} {meta.label} ({record.facilityScores[driver]}점)
                  </span>
                );
              })}
            </div>
            <p className="text-[10px] leading-relaxed text-slate-400">
              {record.error > 2.0
                ? `${FACILITY_META[record.topDrivers[0]].shortLabel}·${FACILITY_META[record.topDrivers[1]].shortLabel} 집중도가 시장 쏠림과 맞물려 모델 예측치를 상회했습니다.`
                : record.error < -2.0
                ? `거시 금리 충격 및 ${FACILITY_META[record.topDrivers[0]].shortLabel} 방어력 한계로 예측보다 낙폭이 확대되었습니다.`
                : `5대 입지 변수가 모델 예상 궤적(±2%p 이내)과 정밀하게 부합했습니다.`}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
