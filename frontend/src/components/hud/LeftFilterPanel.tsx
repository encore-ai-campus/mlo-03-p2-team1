import {
  Briefcase,
  Building2,
  GitCompareArrows,
  GraduationCap,
  HeartPulse,
  Sparkles,
  TrainFront,
} from 'lucide-react';
import { FACILITY_META } from '../../data/regionsMeta';
import { useDashboardStore } from '../../store/useDashboardStore';
import type { FacilityKey } from '../../types/dashboard';

const FACILITY_ICONS: Record<FacilityKey, typeof Briefcase> = {
  jobs: Briefcase,
  subway: TrainFront,
  school: GraduationCap,
  commercial: Building2,
  hospital: HeartPulse,
};

const FACILITY_ORDER: FacilityKey[] = ['jobs', 'subway', 'school', 'commercial', 'hospital'];

export function LeftFilterPanel({ live = false }: { live?: boolean }) {
  const spotlightMode = useDashboardStore((s) => s.spotlightMode);
  const comparisonMode = useDashboardStore((s) => s.comparisonMode);
  const activeFacilities = useDashboardStore((s) => s.activeFacilities);
  const toggleSpotlightMode = useDashboardStore((s) => s.toggleSpotlightMode);
  const toggleComparisonMode = useDashboardStore((s) => s.toggleComparisonMode);
  const toggleFacility = useDashboardStore((s) => s.toggleFacility);

  return (
    <aside className="pointer-events-auto fixed left-4 top-[74px] z-20 flex w-[272px] max-h-[calc(100vh-158px)] flex-col gap-2.5 overflow-y-auto pr-1">
      {/* Regime Analysis Modes */}
      <div className="hud-glass rounded-2xl p-3 space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          국면 분석 필터
        </div>

        <button
          type="button"
          onClick={toggleSpotlightMode}
          disabled={live}
          title={live ? '국면 분석 데이터 준비 중' : undefined}
          className={`flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition ${
            spotlightMode
              ? 'border-rose-400/50 bg-rose-500/15 text-rose-100 shadow-[0_0_20px_-6px_rgba(244,63,94,0.45)]'
              : 'border-slate-700/70 bg-slate-900/50 text-slate-300 hover:border-slate-500'
          }`}
        >
          <Sparkles
            className={`mt-0.5 h-4 w-4 shrink-0 ${
              spotlightMode ? 'text-rose-400' : 'text-slate-400'
            }`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">초양극화 스포트라이트</span>
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                  spotlightMode ? 'bg-rose-500/30 text-rose-200' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {live ? '—' : spotlightMode ? 'ON' : 'OFF'}
              </span>
            </div>
            <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">
              상위 10% 핵심지만 네온 발광 유지, 하위 90% 와이어프레임 톤다운
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={toggleComparisonMode}
          disabled={live}
          title={live ? '비교 레이어 준비 중' : undefined}
          className={`flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition ${
            comparisonMode
              ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-100 shadow-[0_0_20px_-6px_rgba(34,211,238,0.4)]'
              : 'border-slate-700/70 bg-slate-900/50 text-slate-300 hover:border-slate-500'
          }`}
        >
          <GitCompareArrows
            className={`mt-0.5 h-4 w-4 shrink-0 ${
              comparisonMode ? 'text-cyan-300' : 'text-slate-400'
            }`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">2021 상승기 대비 비교</span>
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                  comparisonMode ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {live ? '—' : comparisonMode ? 'DELTA' : 'OFF'}
              </span>
            </div>
            <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">
              2021년 동반 상승기 대비 현재 상승률·가격 변화(Delta) 지형 매핑
            </p>
          </div>
        </button>
      </div>

      {/* Living 5 Facilities Toggle */}
      <div className="hud-glass rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            5대 입지 영향력 레이어
          </span>
          <span className="font-mono text-[10px] text-slate-500">
            {live ? '자료 준비 중' : `${Object.values(activeFacilities).filter(Boolean).length}/5 활성`}
          </span>
        </div>

        <div className="space-y-1.5">
          {FACILITY_ORDER.map((key) => {
            const meta = FACILITY_META[key];
            const Icon = FACILITY_ICONS[key];
            const active = !live && activeFacilities[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleFacility(key)}
                disabled={live}
                className={`flex w-full items-center justify-between rounded-xl border px-2.5 py-2 text-left transition ${
                  active
                    ? 'border-slate-600/80 bg-slate-800/70 text-slate-100'
                    : 'border-slate-800/60 bg-slate-950/40 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: active ? `${meta.color}22` : 'rgba(30,41,59,0.5)',
                      color: active ? meta.color : '#64748b',
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <div className="text-xs font-medium">{meta.label}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">
                      {key === 'jobs'
                        ? '업무지구 유입 입자'
                        : key === 'subway'
                        ? '철도축 빛 펄스'
                        : '우수 지역 파동 링'}
                    </div>
                  </div>
                </div>

                <div
                  className={`h-4 w-7 rounded-full p-0.5 transition-colors ${
                    active ? 'bg-slate-600' : 'bg-slate-800'
                  }`}
                  style={active ? { backgroundColor: `${meta.color}99` } : undefined}
                >
                  <div
                    className={`h-3 w-3 rounded-full bg-white transition-transform ${
                      active ? 'translate-x-3' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Compact 3D Legend */}
      <div className="hud-glass rounded-2xl p-3.5 space-y-2.5 text-[11px]">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          3D 시각화 범례
        </div>
        {live ? (
          <div className="flex items-center gap-2 text-[10px] text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            <span>실거래·인허가 또는 예측을 조회할 수 있는 자치구</span>
          </div>
        ) : <>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-300">
            <span>지형 온도 ({comparisonMode ? '2021 대비' : '실제 상승률'})</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#0c3b82] via-[#182235] to-[#ff7b1c]" />
          <div className="flex justify-between font-mono text-[9px] text-slate-400">
            <span>{comparisonMode ? '-25%p' : '-15%'}</span>
            <span>0%</span>
            <span>{comparisonMode ? '+10%p' : '+20%'}</span>
          </div>
        </div>

        <div className="space-y-1 border-t border-slate-800/80 pt-2 text-[10px] text-slate-300">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-orange-500 to-rose-500 shadow-[0_0_8px_#f43f5e]" />
            <span>+Y 상승 막대: 과소 예측 (실제 &gt; 예측)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            <span>시안 링: 예측 적중 (|오차| ≤ 2.0%p)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-b from-blue-500 to-purple-500 shadow-[0_0_8px_#8b5cf6]" />
            <span>-Y 하강 막대: 과대 예측 (지형 하부 투과)</span>
          </div>
        </div>
        </>}
      </div>
    </aside>
  );
}
