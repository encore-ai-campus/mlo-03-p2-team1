import { useEffect } from 'react';
import { KoreaMapScene } from './components/canvas/KoreaMapScene';
import { LeftFilterPanel } from './components/hud/LeftFilterPanel';
import { RightDetailCard } from './components/hud/RightDetailCard';
import { TimelineSlider } from './components/hud/TimelineSlider';
import { TopStatusBar } from './components/hud/TopStatusBar';
import { TrainingPeriodBanner } from './components/hud/TrainingPeriodBanner';
import { hydrateDashboardFromApi } from './services/dashboardData';
import { useDashboardStore } from './store/useDashboardStore';

export default function App() {
  useEffect(() => {
    let active = true;
    void hydrateDashboardFromApi().then((loaded) => {
      if (active && loaded) {
        useDashboardStore.getState().markPostgresDataLoaded();
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#050811] text-slate-100">
      {/* Full-viewport 3D WebGL Map */}
      <KoreaMapScene />

      {/* 2D Glassmorphism HUD Overlays */}
      <TopStatusBar />
      <LeftFilterPanel />
      <RightDetailCard />
      <TrainingPeriodBanner />
      <TimelineSlider />
    </main>
  );
}
