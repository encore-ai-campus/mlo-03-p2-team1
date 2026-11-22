import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { SCENE_COLORS } from '../../config/scene';

interface SceneEnvironmentProps {
  ecoMode: boolean;
}

export function SceneEnvironment({ ecoMode }: SceneEnvironmentProps) {
  return (
    <>
      <color attach="background" args={[SCENE_COLORS.background]} />
      <fog attach="fog" args={[SCENE_COLORS.fog, 42, 95]} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[18, 32, 16]} intensity={1.1} color={SCENE_COLORS.keyLight} />
      <directionalLight position={[-18, 12, -20]} intensity={0.42} color={SCENE_COLORS.rimLight} />

      {/* Lightweight static datum grid (1 LineSegments draw call, zero fragment shader overdraw) */}
      <gridHelper
        args={[56, 36, SCENE_COLORS.gridCenter, SCENE_COLORS.gridLines]}
        position={[0, -0.37, 0]}
      />

      {!ecoMode && (
        <EffectComposer multisampling={0}>
          <Bloom
            levels={5}
            intensity={0.72}
            luminanceThreshold={0.52}
            luminanceSmoothing={0.35}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </>
  );
}
