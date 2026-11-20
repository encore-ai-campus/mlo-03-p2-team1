import { useState } from 'react';
import { KoreaMapScene } from './components/canvas/KoreaMapScene';
import { LeftFilterPanel } from './components/hud/LeftFilterPanel';
import { useLiveMarket } from './components/hud/useLiveMarket';
import { RightDetailCard } from './components/hud/RightDetailCard';
import { TimelineSlider } from './components/hud/TimelineSlider';
import { TopStatusBar } from './components/hud/TopStatusBar';

export default function App() {
  const demo = new URLSearchParams(window.location.search).get('demo') === '1';
  const market = useLiveMarket(!demo);
  const [districts, setDistricts] = useState(new Map<string, string>());

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#050811] text-slate-100">
      <KoreaMapScene liveDistricts={demo ? undefined : market.byDistrict} onDistrictsReady={setDistricts} />
      <TopStatusBar market={demo ? undefined : market} />
      <LeftFilterPanel live={!demo} />
      <RightDetailCard live={demo ? undefined : { market, districts }} />
      <TimelineSlider market={demo ? undefined : market} />
    </main>
  );
}
