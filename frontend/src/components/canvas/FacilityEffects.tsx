import { INDUSTRY_ORDER } from '../../config/industries';
import { IndustryRippleLayer } from './facilities/IndustryRippleLayer';
import { SubwayCorridorLayer } from './facilities/SubwayCorridorLayer';

interface FacilityEffectsProps {
  centerMap: Map<string, [number, number]>;
}

export function FacilityEffects({ centerMap }: FacilityEffectsProps) {
  return (
    <group name="industry-living-effects">
      <SubwayCorridorLayer centerMap={centerMap} />
      {INDUSTRY_ORDER.map((industry) => (
        <IndustryRippleLayer key={industry} industry={industry} centerMap={centerMap} />
      ))}
    </group>
  );
}
