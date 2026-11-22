import { INDUSTRY_ORDER } from '../../config/industries';
import { IndustryRippleLayer } from './facilities/IndustryRippleLayer';

interface FacilityEffectsProps {
  centerMap: Map<string, [number, number]>;
}

export function FacilityEffects({ centerMap }: FacilityEffectsProps) {
  return (
    <group name="industry-living-effects">
      {INDUSTRY_ORDER.map((industry) => (
        <IndustryRippleLayer key={industry} industry={industry} centerMap={centerMap} />
      ))}
    </group>
  );
}
