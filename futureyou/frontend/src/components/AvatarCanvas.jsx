import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useContext } from 'react'
import * as THREE from 'three'
import { AppContext } from '../context/AppContext'

function RealisticHumanHead({ predictions }) {
    const groupRef = useRef()
    const headRef = useRef()
    const eyeLeftRef = useRef()
    const eyeRightRef = useRef()
    
    // Calculate emotion from predictions
    const calculateEmotion = () => {
        if (!predictions) return { happiness: 5, stress: 50 }
        
        const wellbeing = predictions.wellbeing_score || 5
        const stress = predictions.stress_pct || 50
        const exam = predictions.exam_score || 50
        
        const happiness = (wellbeing / 10 * 40 + (100 - stress) / 100 * 40 + exam / 100 * 20) / 100 * 10
        
        return { happiness: Math.min(10, Math.max(0, happiness)), stress }
    }
    
    const emotion = calculateEmotion()
    
    // Skin tone color
    const getSkinColor = () => {
        // Base skin tone
        return 0xE8B8A3
    }
    
    useFrame(() => {
        if (!groupRef.current) return
        
        const time = Date.now() * 0.001
        
        // Subtle head movement
        groupRef.current.position.y = Math.sin(time * 0.3) * 0.15
        groupRef.current.rotation.y = Math.sin(time * 0.2) * 0.08
        groupRef.current.rotation.x = Math.sin(time * 0.15) * 0.05
    })
    
    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* Main Head - More realistic proportions */}
            <mesh ref={headRef} position={[0, 0.1, 0]}>
                <sphereGeometry args={[0.8, 64, 64]} />
                <meshStandardMaterial
                    color={getSkinColor()}
                    metalness={0.1}
                    roughness={0.6}
                    map={null}
                />
            </mesh>
            
            {/* Chin definition */}
            <mesh position={[0, -0.4, 0.3]}>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshStandardMaterial
                    color={0xDCA084}
                    metalness={0.1}
                    roughness={0.6}
                />
            </mesh>
            
            {/* Left Eye */}
            <group position={[-0.3, 0.35, 0.7]}>
                {/* Eye white */}
                <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.18, 32, 32]} />
                    <meshStandardMaterial color={0xFFFFFF} metalness={0.2} roughness={0.4} />
                </mesh>
                
                {/* Eye iris */}
                <mesh ref={eyeLeftRef} position={[0, 0, 0.15]}>
                    <sphereGeometry args={[0.11, 32, 32]} />
                    <meshStandardMaterial color={0x4A90E2} metalness={0.4} roughness={0.3} />
                </mesh>
                
                {/* Pupil */}
                <mesh position={[0, 0, 0.18]}>
                    <sphereGeometry args={[0.06, 32, 32]} />
                    <meshStandardMaterial color={0x000000} metalness={0.8} roughness={0.1} />
                </mesh>
                
                {/* Eye shine */}
                <mesh position={[-0.04, 0.04, 0.2]}>
                    <sphereGeometry args={[0.03, 16, 16]} />
                    <meshStandardMaterial color={0xFFFFFF} metalness={1} roughness={0} />
                </mesh>
            </group>
            
            {/* Right Eye */}
            <group position={[0.3, 0.35, 0.7]}>
                {/* Eye white */}
                <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.18, 32, 32]} />
                    <meshStandardMaterial color={0xFFFFFF} metalness={0.2} roughness={0.4} />
                </mesh>
                
                {/* Eye iris */}
                <mesh ref={eyeRightRef} position={[0, 0, 0.15]}>
                    <sphereGeometry args={[0.11, 32, 32]} />
                    <meshStandardMaterial color={0x4A90E2} metalness={0.4} roughness={0.3} />
                </mesh>
                
                {/* Pupil */}
                <mesh position={[0, 0, 0.18]}>
                    <sphereGeometry args={[0.06, 32, 32]} />
                    <meshStandardMaterial color={0x000000} metalness={0.8} roughness={0.1} />
                </mesh>
                
                {/* Eye shine */}
                <mesh position={[-0.04, 0.04, 0.2]}>
                    <sphereGeometry args={[0.03, 16, 16]} />
                    <meshStandardMaterial color={0xFFFFFF} metalness={1} roughness={0} />
                </mesh>
            </group>
            
            {/* Mouth - Dynamic based on emotion */}
            <mesh position={[0, -0.15, 0.65]}>
                <sphereGeometry args={[0.25, 32, 32]} />
                <meshStandardMaterial
                    color={emotion.happiness > 7 ? 0xFF8FA3 : emotion.happiness > 5 ? 0xFF7E99 : 0xFF5588}
                    metalness={0.3}
                    roughness={0.4}
                />
            </mesh>
            
            {/* Blush - increases with stress */}
            <mesh position={[-0.45, 0.15, 0.4]} transparent opacity={emotion.stress / 150}>
                <sphereGeometry args={[0.22, 32, 32]} />
                <meshStandardMaterial
                    color={0xFFAA99}
                    metalness={0}
                    roughness={0.8}
                    transparent
                />
            </mesh>
            
            <mesh position={[0.45, 0.15, 0.4]} transparent opacity={emotion.stress / 150}>
                <sphereGeometry args={[0.22, 32, 32]} />
                <meshStandardMaterial
                    color={0xFFAA99}
                    metalness={0}
                    roughness={0.8}
                    transparent
                />
            </mesh>
            
            {/* Eyebrows */}
            <mesh position={[-0.28, 0.6, 0.7]}>
                <boxGeometry args={[0.25, 0.08, 0.1]} />
                <meshStandardMaterial color={0x8B7355} />
            </mesh>
            
            <mesh position={[0.28, 0.6, 0.7]}>
                <boxGeometry args={[0.25, 0.08, 0.1]} />
                <meshStandardMaterial color={0x8B7355} />
            </mesh>
            
            {/* Nose */}
            <mesh position={[0, 0.2, 0.75]}>
                <coneGeometry args={[0.12, 0.25, 16]} />
                <meshStandardMaterial color={0xD9A882} metalness={0.1} roughness={0.6} />
            </mesh>
        </group>
    )
}

function EmotionText({ predictions }) {
    const emotion = predictions
        ? (predictions.wellbeing_score / 10 * 40 + (100 - predictions.stress_pct) / 100 * 40 + predictions.exam_score / 100 * 20) / 100 * 10
        : 5
    
    let emotionLabel = ''
    if (emotion > 7) emotionLabel = '😊 Happy'
    else if (emotion > 5) emotionLabel = '😐 Neutral'
    else emotionLabel = '😢 Struggling'
    
    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(0,0,0,0.5)',
            zIndex: 10
        }}>
            {emotionLabel}
        </div>
    )
}

export default function AvatarCanvas() {
    const { predictions } = useContext(AppContext)
    
    return (
        <>
            <Canvas
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100vh',
                    zIndex: -1
                }}
                camera={{ position: [0, 0, 3.5], fov: 45 }}
            >
                <ambientLight intensity={0.6} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <pointLight position={[-10, -10, 10]} intensity={0.5} color={0x0099FF} />
                
                <HumanAvatarHead predictions={predictions} />
            </Canvas>
            
            <EmotionText predictions={predictions} />
        </>
    )
}
