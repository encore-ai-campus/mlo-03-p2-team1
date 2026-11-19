import { KoreaMapScene } from './components/canvas/KoreaMapScene';
import { LeftFilterPanel } from './components/hud/LeftFilterPanel';
import { RightDetailCard } from './components/hud/RightDetailCard';
import { TimelineSlider } from './components/hud/TimelineSlider';
import { TopStatusBar } from './components/hud/TopStatusBar';

export default function App() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#050811] text-slate-100">
      {/* Full-viewport 3D WebGL Map */}
      <KoreaMapScene />

      {/* 2D Glassmorphism HUD Overlays */}
      <TopStatusBar />
      <LeftFilterPanel />
      <RightDetailCard />
      <TimelineSlider />
    </main>
  );
}
