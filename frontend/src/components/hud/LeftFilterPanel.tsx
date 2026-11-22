import { useMemo } from 'react';
import {
  Coffee,
  Cpu,
  GitCompareArrows,
  Pill,
  Scissors,
  Sparkles,
  Stethoscope,
  Store,
  Target,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import { INDUSTRY_META, INDUSTRY_ORDER } from '../../config/industries';
import { MODEL_META, MODEL_ORDER, MODEL_VERSION } from '../../config/models';
import { getQuarterAccuracyBreakdown, getQuarterSummary } from '../../services/dashboardData';
import { useDashboardStore } from '../../store/useDashboardStore';
import {
  TIMELINE_QUARTERS,
  type ErrorToleranceBand,
  type IndustryKey,
} from '../../types/dashboard';

const TOLERANCE_BAND_META: {
  key: ErrorToleranceBand;
  label: string;
  tag: string;
  tagClass: string;
  desc: string;
  color: string;
  badgeClass: string;
}[] = [
  {
    key: '0_2',
    label: '0 ~ 2%p',
    tag: '성공',
    tagClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    desc: '초정밀 예측 성공 구간',
    color: '#10b981',
    badgeClass: 'text-emerald-300',
  },
  {
    key: '2_4',
    label: '2 ~ 4%p',
    tag: '허용',
    tagClass: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    desc: '소폭 오차 허용 구간',
    color: '#38bdf8',
    badgeClass: 'text-sky-300',
  },
  {
    key: '4_6',
    label: '4 ~ 6%p',
    tag: '주의',
    tagClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    desc: '주의 오차 이탈 구간',
    color: '#f59e0b',
    badgeClass: 'text-amber-300',
  },
  {
    key: '6_plus',
    label: '6%p 이상',
    tag: '이탈',
    tagClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    desc: '급등·급락 대형 이탈',
    color: '#f43f5e',
    badgeClass: 'text-rose-300',
  },
];

const INDUSTRY_ICONS: Record<IndustryKey, LucideIcon> = {
  GENERAL_FOOD: Utensils,
  REST_FOOD: Store,
  CAFE: Coffee,
  CLINIC: Stethoscope,
  PHARMACY: Pill,
  BEAUTY: Scissors,
};

const INDUSTRY_SHORT_DESC: Record<IndustryKey, string> = {
  GENERAL_FOOD: '일반 음식점 (비음식 제외)',
  REST_FOOD: '분식·패스트푸드 (카페 제외)',
  CAFE: '커피·카페 업태 및 키워드',
  CLINIC: '의원·치과의원·한의원 재고',
  PHARMACY: '법정동별 약국 영업 재고',
  BEAUTY: '일반·피부·네일 생활미용',
};

interface CompactToggleRowProps {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: LucideIcon;
  title: string;
  description: string;
  activeBadge: string;
  disabledBadge?: string;
  accent: 'rose' | 'cyan';
}

const ACCENT_STYLES = {
  rose: {
    container:
      'border-rose-400/50 bg-rose-500/15 text-rose-100 shadow-[0_0_14px_-6px_rgba(244,63,94,0.45)]',
    icon: 'text-rose-400',
    badge: 'bg-rose-500/30 text-rose-200',
  },
  cyan: {
    container:
      'border-cyan-400/50 bg-cyan-500/15 text-cyan-100 shadow-[0_0_14px_-6px_rgba(34,211,238,0.4)]',
    icon: 'text-cyan-300',
    badge: 'bg-cyan-500/30 text-cyan-200',
  },
} as const;

function CompactToggleRow({
  active,
  disabled = false,
  onClick,
  icon: Icon,
  title,
  description,
  activeBadge,
  disabledBadge,
  accent,
}: CompactToggleRowProps) {
  const styles = ACCENT_STYLES[accent];
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={disabled ? false : active}
      onClick={onClick}
      className={`flex w-full items-start gap-2 rounded-xl border px-2.5 py-2 text-left transition ${
        disabled
          ? 'cursor-not-allowed border-slate-800/70 bg-slate-950/40 text-slate-500 opacity-65'
          : active
            ? styles.container
            : 'border-slate-700/70 bg-slate-900/50 text-slate-200 hover:border-slate-500'
      }`}
    >
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${disabled ? 'text-slate-500' : active ? styles.icon : 'text-slate-400'}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-xs font-semibold">{title}</span>
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] ${
              disabled
                ? 'bg-slate-800/80 text-slate-400'
                : active
                  ? styles.badge
                  : 'bg-slate-800 text-slate-300'
            }`}
          >
            {disabled ? (disabledBadge ?? '비활성') : active ? activeBadge : 'OFF'}
          </span>
        </div>
        <p className="mt-0.5 break-keep text-[11px] leading-snug text-slate-300">{description}</p>
      </div>
    </button>
  );
}

export function LeftFilterPanel() {
  const selectedQuarter = useDashboardStore((s) => s.selectedQuarter);
  const selectedModel = useDashboardStore((s) => s.selectedModel);
  const viewMode = useDashboardStore((s) => s.viewMode);
  const dataVersion = useDashboardStore((s) => s.dataVersion);
  const spotlightMode = useDashboardStore((s) => s.spotlightMode);
  const comparisonMode = useDashboardStore((s) => s.comparisonMode);
  const activeIndustries = useDashboardStore((s) => s.activeIndustries);
  const activeToleranceBands = useDashboardStore((s) => s.activeToleranceBands);
  const setSelectedModel = useDashboardStore((s) => s.setSelectedModel);
  const toggleSpotlightMode = useDashboardStore((s) => s.toggleSpotlightMode);
  const toggleComparisonMode = useDashboardStore((s) => s.toggleComparisonMode);
  const toggleIndustry = useDashboardStore((s) => s.toggleIndustry);
  const toggleToleranceBand = useDashboardStore((s) => s.toggleToleranceBand);
  const resetToleranceBands = useDashboardStore((s) => s.resetToleranceBands);

  const activeIndustryCount = INDUSTRY_ORDER.filter((key) => activeIndustries[key]).length;
  const activeBandCount = TOLERANCE_BAND_META.filter((b) => activeToleranceBands[b.key]).length;
  const summary = getQuarterSummary(selectedQuarter);
  const isAiMode = viewMode === 'error';
  const isAiEval = isAiMode && summary.periodType === 'eval';

  const accuracy = useMemo(
    () => getQuarterAccuracyBreakdown(selectedQuarter, selectedModel),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedQuarter, selectedModel, dataVersion],
  );

  const prevAccuracy = useMemo(() => {
    const idx = TIMELINE_QUARTERS.indexOf(selectedQuarter);
    if (idx <= 0) return null;
    const prevQ = TIMELINE_QUARTERS[idx - 1];
    if (getQuarterSummary(prevQ).periodType !== 'eval') return null;
    return getQuarterAccuracyBreakdown(prevQ, selectedModel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuarter, selectedModel, dataVersion]);

  return (
    <aside
      aria-label="예측 모델, 국면 필터 및 인허가 상권 레이어"
      className="pointer-events-auto fixed bottom-3 left-3 top-[76px] z-20 flex w-[272px] flex-col gap-2"
    >
      {/* AI Model Selector */}
      <div className="hud-glass shrink-0 space-y-1.5 rounded-2xl p-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            예측 모델
          </span>
          <span
            title={`모델 버전: ${MODEL_VERSION}`}
            className="font-mono text-[11px] text-slate-400"
          >
            v.{MODEL_VERSION.slice(0, 2)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {MODEL_ORDER.map((modelKey) => {
            const meta = MODEL_META[modelKey];
            const active = selectedModel === modelKey;
            const compactLabel =
              modelKey === 'baseline' ? '기준' : modelKey === 'price' ? '집값' : '+상권';
            return (
              <button
                key={modelKey}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedModel(modelKey)}
                className={`flex flex-col items-center rounded-xl border px-1.5 py-1.5 text-center transition ${
                  active
                    ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100 shadow-[0_0_12px_-4px_rgba(34,211,238,0.5)]'
                    : 'border-slate-800/80 bg-slate-900/50 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                <span className="text-xs font-semibold">{compactLabel}</span>
                <span className="font-mono text-[11px] text-slate-300">
                  {meta.overallMapePct.toFixed(1)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Regime Analysis Modes */}
      <div className="hud-glass shrink-0 space-y-1.5 rounded-2xl p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
          국면 분석 필터
        </div>

        <CompactToggleRow
          active={spotlightMode}
          onClick={toggleSpotlightMode}
          icon={Sparkles}
          title="스포트라이트"
          description="상위 10% 핵심 법정동만 발광 유지"
          activeBadge="10%"
          accent="rose"
        />

        <CompactToggleRow
          active={comparisonMode}
          disabled={isAiMode}
          onClick={toggleComparisonMode}
          icon={GitCompareArrows}
          title="2021 동분기 비교"
          description={isAiMode ? '실제 시세 모드에서 사용 가능' : '2021년 동분기 대비 Delta 매핑'}
          activeBadge="Δ"
          disabledBadge="시세 전용"
          accent="cyan"
        />
      </div>

      {/* AI Mode: Prediction Error Tolerance Cards | Market Mode: Gold 6 Commercial License Industry Layers */}
      {isAiMode ? (
        <div className="hud-glass flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden rounded-2xl p-3">
          <div className="flex shrink-0 items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              예측 허용치 구간
            </span>
            {activeBandCount < TOLERANCE_BAND_META.length ? (
              <button
                type="button"
                onClick={resetToleranceBands}
                className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-cyan-300 hover:bg-slate-700"
              >
                전체 보기
              </button>
            ) : (
              <span className="font-mono text-[11px] text-slate-400">
                {isAiEval
                  ? `${accuracy.evaluatedCount}동`
                  : summary.periodType === 'forecast'
                    ? '실측 대기'
                    : '학습 구간'}
              </span>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-0.5">
            {TOLERANCE_BAND_META.map((band) => {
              const active = activeToleranceBands[band.key];
              const stat = accuracy.bands[band.key];
              const prevStat = prevAccuracy?.bands[band.key] ?? null;
              const deltaPct = isAiEval && prevStat ? stat.pct - prevStat.pct : null;
              return (
                <button
                  key={band.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleToleranceBand(band.key)}
                  style={{
                    borderLeftColor: active ? band.color : undefined,
                  }}
                  className={`flex min-h-[62px] max-h-[96px] w-full flex-1 shrink-0 flex-col justify-between gap-1.5 rounded-xl border border-l-[3px] px-3 py-2 text-left transition ${
                    active
                      ? 'border-slate-600/85 bg-slate-800/80 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                      : 'border-slate-800/70 bg-slate-950/45 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor: active ? band.color : '#475569',
                          boxShadow: active ? `0 0 8px ${band.color}` : undefined,
                        }}
                      />
                      <span className="font-mono text-[13px] font-bold leading-none">
                        {band.label}
                      </span>
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                          active
                            ? band.tagClass
                            : 'border-slate-700/70 bg-slate-900/70 text-slate-500'
                        }`}
                      >
                        {band.tag}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-[15px] font-extrabold leading-none ${
                        active ? band.badgeClass : 'text-slate-400'
                      }`}
                    >
                      {isAiEval ? `${stat.pct.toFixed(1)}%` : '—'}
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950/90">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: isAiEval ? `${stat.pct}%` : '0%',
                        backgroundColor: active ? band.color : '#475569',
                        boxShadow: active && isAiEval ? `0 0 8px ${band.color}88` : undefined,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-1 text-[11px] leading-none text-slate-400">
                    <span className="truncate">{band.desc}</span>
                    <div className="flex shrink-0 items-center gap-1.5 font-mono">
                      <span className="font-semibold text-slate-200">
                        {isAiEval ? `${stat.count}동` : '—'}
                      </span>
                      {deltaPct !== null && (
                        <span
                          className={`text-[10px] ${
                            Math.abs(deltaPct) < 0.05
                              ? 'text-slate-500'
                              : deltaPct > 0
                                ? 'text-cyan-300'
                                : 'text-slate-400'
                          }`}
                        >
                          {deltaPct > 0 ? `+${deltaPct.toFixed(1)}` : deltaPct.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="hud-glass flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden rounded-2xl p-3">
          <div className="flex shrink-0 items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              인허가 상권 (6업종)
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              {activeIndustryCount}/{INDUSTRY_ORDER.length} 활성
            </span>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-0.5">
            {INDUSTRY_ORDER.map((key) => {
              const meta = INDUSTRY_META[key];
              const Icon = INDUSTRY_ICONS[key];
              const active = activeIndustries[key];
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleIndustry(key)}
                  className={`flex min-h-[44px] w-full flex-1 shrink-0 items-center justify-between gap-2 rounded-xl border px-2.5 py-1 text-left transition ${
                    active
                      ? 'border-slate-600/80 bg-slate-800/80 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                      : 'border-slate-800/70 bg-slate-950/45 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: active ? `${meta.color}26` : 'rgba(30,41,59,0.55)',
                        color: active ? meta.color : '#94a3b8',
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold leading-tight">{meta.label}</div>
                      <div className="mt-0.5 truncate text-[11px] text-slate-400">
                        {INDUSTRY_SHORT_DESC[key]}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full transition ${active ? '' : 'bg-slate-600'}`}
                    style={
                      active
                        ? { backgroundColor: meta.color, boxShadow: `0 0 10px ${meta.color}` }
                        : undefined
                    }
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Rolling CV Model Benchmark Summary (AI Ready 2021-2026) */}
      <div className="hud-glass shrink-0 space-y-1.5 rounded-2xl p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            롤링 검증 성능 (21~26)
          </span>
          <span className="font-mono text-[11px] text-slate-400">4,058행</span>
        </div>

        <div className="space-y-1.5">
          {MODEL_ORDER.map((modelKey) => {
            const meta = MODEL_META[modelKey];
            const active = selectedModel === modelKey;
            const widthPct = Math.round((meta.overallMapePct / 5.5) * 100);
            return (
              <div key={modelKey} className="space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className={active ? 'font-semibold text-cyan-200' : 'text-slate-300'}>
                    {meta.shortLabel}
                  </span>
                  <span className="font-mono text-[11px] text-slate-200">
                    MAPE {meta.overallMapePct.toFixed(2)}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/90">
                  <div
                    className={`h-full rounded-full ${active ? 'bg-cyan-400' : 'bg-slate-600'}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="break-keep border-t border-slate-800/80 pt-1.5 text-[11px] leading-snug text-slate-300">
          기준선 대비 집값 모델 <span className="font-mono text-cyan-300">-0.36%p</span> 개선. 상권
          인허가는 설명 레이어로 제공됩니다.
        </p>
      </div>
    </aside>
  );
}
