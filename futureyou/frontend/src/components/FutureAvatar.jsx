import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows } from '@react-three/drei';
import { useRef, useMemo, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import * as THREE from 'three';

// Default Ready Player Me avatar URL (You can replace this URL with your custom avatar ID!)
const DEFAULT_AVATAR_URL = 'https://models.readyplayer.me/64f1d43eb759089f6ec36081.glb';

function HumanoidMesh({ isSpeaking, predictions, avatarUrl }) {
    const finalUrl = avatarUrl && avatarUrl.trim() !== '' ? avatarUrl : DEFAULT_AVATAR_URL;
    // Load the 3D model
    const { scene } = useGLTF(finalUrl);
    const headRef = useRef();

    // Clone the scene so it doesn't mutate the cached one if remounted
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    // Find the head node for jaw animation (Ready Player Me uses morph targets for visemes)
    useEffect(() => {
        clonedScene.traverse((node) => {
            if (node.isMesh && node.morphTargetDictionary) {
                // If it has morph targets (like visemes for lip sync)
                headRef.current = node;
            }
        });
    }, [clonedScene]);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        
        // Gentle idle floating and breathing animation
        clonedScene.position.y = Math.sin(t * 1.5) * 0.02 - 1.5;
        clonedScene.rotation.y = Math.sin(t * 0.5) * 0.05;

        // Fake Lip-Sync using jaw/viseme morph targets
        if (headRef.current && headRef.current.morphTargetInfluences) {
            const dict = headRef.current.morphTargetDictionary;
            // Ready Player Me has 'mouthOpen' or 'viseme_O'
            const mouthOpenIdx = dict['mouthOpen'] !== undefined ? dict['mouthOpen'] : 
                                 dict['viseme_O'] !== undefined ? dict['viseme_O'] : -1;

            if (mouthOpenIdx !== -1) {
                if (isSpeaking) {
                    // Random amplitude based on time to simulate speaking syllables
                    const rawMouth = Math.sin(t * 15) * 0.5 + 0.5; // pulses rapidly
                    const erratic = Math.random() * 0.5;
                    headRef.current.morphTargetInfluences[mouthOpenIdx] = THREE.MathUtils.lerp(
                        headRef.current.morphTargetInfluences[mouthOpenIdx], 
                        (rawMouth + erratic) * 0.8, 
                        0.5
                    );
                } else {
                    // Close mouth smoothly when not speaking
                    headRef.current.morphTargetInfluences[mouthOpenIdx] = THREE.MathUtils.lerp(
                        headRef.current.morphTargetInfluences[mouthOpenIdx], 
                        0, 
                        0.2
                    );
                }
            }
        }
    });

    return <primitive object={clonedScene} scale={1.8} />;
}

export default function FutureAvatar({ isSpeaking, predictions }) {
    const { avatarUrl } = useContext(AppContext);

    // Background aura color based on ML prediction
    const glowColor = useMemo(() => {
        if (!predictions) return '#00FFCC';
        const w = predictions.wellbeing_score || 5;
        if (w >= 7) return '#00FFCC';
        if (w >= 5) return '#7700FF';
        return '#FF0055';
    }, [predictions]);

    return (
        <div className="w-full h-full relative flex flex-col items-center justify-center">
            {/* Ambient Aura */}
            <div 
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[60px] transition-all duration-700 pointer-events-none ${isSpeaking ? 'opacity-80 scale-125' : 'opacity-40 scale-100'}`} 
                style={{ backgroundColor: glowColor }}
            />
            
            <Canvas camera={{ position: [0, 0.5, 3], fov: 40 }} className="z-10">
                {/* Lighting to make the avatar look realistic */}
                <ambientLight intensity={0.6} />
                <directionalLight position={[-5, 5, 5]} intensity={1} />
                <pointLight position={[0, 2, 2]} intensity={0.5} color={glowColor} />
                <Environment preset="city" />
                
                <HumanoidMesh isSpeaking={isSpeaking} predictions={predictions} avatarUrl={avatarUrl} />
                
                <ContactShadows resolution={512} scale={10} blur={2} opacity={0.5} far={10} color="#000000" position={[0, -1.5, 0]} />
            </Canvas>
            
            <div className="absolute top-2 w-full text-center z-20 pointer-events-none">
                {!avatarUrl && (
                    <span className="bg-black/50 text-white/50 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-white/10">
                        Go to your Dashboard to paste your own avatar URL!
                    </span>
                )}
            </div>
        </div>
    );
}

// Preload the model so it renders instantly
useGLTF.preload(DEFAULT_AVATAR_URL);
