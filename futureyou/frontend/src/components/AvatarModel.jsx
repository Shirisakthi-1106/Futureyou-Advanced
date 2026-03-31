import { useRef, useEffect, useContext, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import * as THREE from 'three';
import { AppContext } from '../context/AppContext';

export default function AvatarModel({ isSpeaking, predictions }) {
    const { selectedAvatar } = useContext(AppContext);
    
    const modelUrl = selectedAvatar?.path || "/avatars/alucard.glb";

    return (
        <Suspense fallback={<group><mesh><boxGeometry args={[0.5, 1.5, 0.5]} /><meshStandardMaterial color="#00ffcc" wireframe /></mesh></group>}>
            <GLBAvatar url={modelUrl} isSpeaking={isSpeaking} predictions={predictions} />
        </Suspense>
    );
}

function GLBAvatar({ url, isSpeaking, predictions }) {
    const group = useRef();
    // Use useGLTF with the local public path
    const { scene, animations } = useGLTF(url);
    const { actions, names } = useAnimations(animations, group);

    useEffect(() => {
        if (names.length > 0) {
            // Priority: idle > wave > any
            const idleAction = actions['idle'] || actions['Wave'] || actions[names[0]];
            if (idleAction) {
                idleAction.reset().fadeIn(0.5).play();
            }
        }
        return () => {
             if (names.length > 0) {
                 actions[names[0]]?.fadeOut(0.5);
             }
        };
    }, [actions, names, url]);

    // Simple lip-sync / talking animation
    useFrame((state) => {
        if (group.current) {
            const time = state.clock.getElapsedTime();
            if (isSpeaking) {
                // Subtle oscillation while speaking, respecting the -1 base offset
                group.current.position.y = -1 + Math.sin(time * 25) * 0.002;
            } else {
                // Return to grounded state immediately
                group.current.position.y = -1;
            }
        }
    });

    // React to predictions (Mood/Stress)
    useFrame((state) => {
        if (group.current && predictions) {
            const stress = predictions.stress_pct || 50;
            const wellbeing = predictions.wellbeing_score || 5;
            
            // Adjust scale or rotation based on "mental state"
            const scaleBase = 1.0;
            const targetScale = wellbeing >= 7 ? 1.05 : wellbeing <= 3 ? 0.95 : 1.0;
            group.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
            
            // Shake slightly if stressed
            if (stress > 80) {
                group.current.position.x = (Math.random() - 0.5) * 0.01;
            } else {
                group.current.position.x = 0;
            }
        }
    });

    return (
        <group ref={group} dispose={null} position={[0, -1, 0]}>
            <primitive object={scene} />
        </group>
    );
}

// Preload models for smoother transitions
useGLTF.preload('/avatars/alucard.glb');
useGLTF.preload('/avatars/terizla.glb');
useGLTF.preload('/avatars/lesley.glb');
useGLTF.preload('/avatars/novaria.glb');
