import { getRegionQuarterRecord } from '../../services/dashboardData';
import { useDashboardStore } from '../../store/useDashboardStore';
import { NationalBriefingCard } from './detail/NationalBriefingCard';
import { RegionDetailCard } from './detail/RegionDetailCard';

export function RightDetailCard() {
  const selectedQuarter = useDashboardStore((s) => s.selectedQuarter);
  const selectedModel = useDashboardStore((s) => s.selectedModel);
  const selectedRegionCode = useDashboardStore((s) => s.selectedRegionCode);
  const hoveredRegionCode = useDashboardStore((s) => s.hoveredRegionCode);
  const comparisonMode = useDashboardStore((s) => s.comparisonMode);
  const setSelectedRegionCode = useDashboardStore((s) => s.setSelectedRegionCode);

  const activeCode = selectedRegionCode ?? hoveredRegionCode;
  const record = activeCode ? getRegionQuarterRecord(selectedQuarter, activeCode) : null;

  if (!record) {
    return (
      <NationalBriefingCard
        selectedQuarter={selectedQuarter}
        selectedModel={selectedModel}
        comparisonMode={comparisonMode}
        onSelectRegion={setSelectedRegionCode}
      />
    );
  }

  return (
    <RegionDetailCard
      record={record}
      selectedQuarter={selectedQuarter}
      selectedModel={selectedModel}
      isPinned={selectedRegionCode === record.regionCode}
      comparisonMode={comparisonMode}
      onClearSelection={() => setSelectedRegionCode(null)}
    />
  );
}
