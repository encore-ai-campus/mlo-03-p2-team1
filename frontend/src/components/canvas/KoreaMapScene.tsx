import { Canvas } from '@react-three/fiber';
import { CAMERA_CONFIG, SCENE_COLORS } from '../../config/scene';
import { useMapGeometries } from '../../hooks/useMapGeometries';
import { useDashboardStore } from '../../store/useDashboardStore';
import { AdaptiveFrameDriver } from './AdaptiveFrameDriver';
import { CameraRig } from './CameraRig';
import { ErrorBarsLayer } from './ErrorBar';
import { FacilityEffects } from './FacilityEffects';
import { RegionPolygonsLayer } from './RegionPolygon';
import { SceneEnvironment } from './SceneEnvironment';

export function KoreaMapScene() {
  const { geometries, centerMap } = useMapGeometries();
  const ecoMode = useDashboardStore((s) => s.ecoMode);

  return (
    <div
      className="fixed inset-0 h-screen w-screen"
      style={{ backgroundColor: SCENE_COLORS.background }}
    >
      <Canvas
        frameloop="demand"
        camera={{
          position: CAMERA_CONFIG.defaultPosition,
          fov: CAMERA_CONFIG.fov,
          near: CAMERA_CONFIG.near,
          far: CAMERA_CONFIG.far,
        }}
        dpr={ecoMode ? 1 : [1, 1.35]}
        gl={{ antialias: ecoMode, powerPreference: 'default', stencil: false }}
        onPointerMissed={() => useDashboardStore.getState().setSelectedRegionCode(null)}
      >
        <SceneEnvironment ecoMode={ecoMode} />

        {geometries.length > 0 && (
          <group>
            <RegionPolygonsLayer geometries={geometries} />
            <ErrorBarsLayer geometries={geometries} />
            <FacilityEffects centerMap={centerMap} />
          </group>
        )}

        <CameraRig centerMap={centerMap} />
        <AdaptiveFrameDriver />
      </Canvas>
    </div>
  );
}
