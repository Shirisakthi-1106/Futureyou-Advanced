import { Suspense, useContext, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  Environment,
  ContactShadows,
  OrbitControls,
} from '@react-three/drei';
import { AppContext } from '../context/AppContext';
import AvatarModel from './AvatarModel';

/**
 * A loading fallback rendered inside the Canvas while the .glb is streaming.
 */
function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial
        color="#00ffcc"
        wireframe
        transparent
        opacity={0.35}
      />
    </mesh>
  );
}

/**
 * AvatarCanvas — drop-in component that renders a fully-lit 3D avatar.
 *
 * Props (all optional — falls back to AppContext values):
 *  - avatarUrl   : string  — direct URL to a .glb model
 *  - predictions : object  — ML prediction data
 *  - isSpeaking  : bool    — whether avatar should lip-sync
 *  - isAlerted   : bool    — whether the avatar is reacting to a notification
 *  - className   : string  — extra Tailwind / CSS classes for the wrapper
 *  - style       : object  — inline style overrides for the wrapper
 *  - enableOrbit : bool    — allow the user to rotate / zoom the avatar (default false)
 */
export default function AvatarCanvas({
  avatarUrl: avatarUrlProp,
  predictions: predictionsProp,
  isSpeaking = false,
  isAlerted = false,
  className = '',
  style = {},
  enableOrbit = false,
}) {
  const ctx = useContext(AppContext);
  const avatarUrl = avatarUrlProp ?? ctx.avatarUrl;
  const predictions = predictionsProp ?? ctx.predictions;

  // Emotional aura colour derived from wellbeing score
  const glowColor = useMemo(() => {
    if (!predictions) return '#00FFCC';
    const w = predictions.wellbeing_score ?? 5;
    if (w >= 7) return '#00FFCC';
    if (w >= 5) return '#7700FF';
    return '#FF0055';
  }, [predictions]);

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center ${className}`}
      style={style}
    >
      {/* Ambient aura glow behind the avatar */}
      <div
        className={`
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-48 h-48 rounded-full blur-[60px] pointer-events-none
          transition-all duration-700
          ${isSpeaking ? 'opacity-80 scale-125' : 'opacity-40 scale-100'}
        `}
        style={{ backgroundColor: glowColor }}
      />

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 3.5], fov: 35 }}
        className="z-10"
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* ---- Lighting Rig ---- */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[-5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Primary emotional accent light */}
        <pointLight
          position={[0, 2, 2]}
          intensity={isSpeaking ? 2 : 1}
          color={glowColor}
        />

        {/* Rim / back light for depth separation */}
        <spotLight
          position={[5, 5, -5]}
          intensity={0.8}
          color="#ffffff"
          angle={0.15}
          penumbra={1}
        />

        {/* HDR Environment for realistic reflections */}
        <Environment preset="city" />

        {/* The 3D Avatar */}
        <Suspense fallback={<LoadingFallback />}>
          <AvatarModel
            avatarUrl={avatarUrl}
            isSpeaking={isSpeaking}
            predictions={predictions}
            isAlerted={isAlerted}
          />
        </Suspense>

        {/* Ground contact shadow */}
        <ContactShadows
          resolution={1024}
          scale={5}
          blur={2.5}
          opacity={0.5}
          far={10}
          color="#000000"
          position={[0, -1, 0]}
        />

        {/* Orbit Controls - Enabled by default for assistant view */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minDistance={2}
          maxDistance={5}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Hint when no custom avatar is set */}
      {!avatarUrl && (
        <div className="absolute top-2 w-full text-center z-20 pointer-events-none">
          <span className="bg-black/50 text-white/50 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">
            Go to your Dashboard to paste your own avatar URL!
          </span>
        </div>
      )}
    </div>
  );
}
