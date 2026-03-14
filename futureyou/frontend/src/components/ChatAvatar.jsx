import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useContext } from 'react'
import { AppContext } from '../context/AppContext'

function RealisticHumanHead({ predictions }) {
    const groupRef = useRef()
    const headRef = useRef()
    
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
    
    const getSkinColor = () => 0xE8B8A3
    
    useFrame(() => {
        if (!groupRef.current) return
        
        const time = Date.now() * 0.001
        groupRef.current.position.y = Math.sin(time * 0.3) * 0.15
        groupRef.current.rotation.y = Math.sin(time * 0.2) * 0.08
        groupRef.current.rotation.x = Math.sin(time * 0.15) * 0.05
    })
    
    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* Main Head */}
            <mesh ref={headRef} position={[0, 0.1, 0]}>
                <sphereGeometry args={[0.8, 64, 64]} />
                <meshStandardMaterial
                    color={getSkinColor()}
                    metalness={0.1}
                    roughness={0.6}
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
                <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.18, 32, 32]} />
                    <meshStandardMaterial color={0xFFFFFF} metalness={0.2} roughness={0.4} />
                </mesh>
                <mesh position={[0, 0, 0.15]}>
                    <sphereGeometry args={[0.11, 32, 32]} />
                    <meshStandardMaterial color={0x4A90E2} metalness={0.4} roughness={0.3} />
                </mesh>
                <mesh position={[0, 0, 0.18]}>
                    <sphereGeometry args={[0.06, 32, 32]} />
                    <meshStandardMaterial color={0x000000} metalness={0.8} roughness={0.1} />
                </mesh>
                <mesh position={[-0.04, 0.04, 0.2]}>
                    <sphereGeometry args={[0.03, 16, 16]} />
                    <meshStandardMaterial color={0xFFFFFF} metalness={1} roughness={0} />
                </mesh>
            </group>
            
            {/* Right Eye */}
            <group position={[0.3, 0.35, 0.7]}>
                <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[0.18, 32, 32]} />
                    <meshStandardMaterial color={0xFFFFFF} metalness={0.2} roughness={0.4} />
                </mesh>
                <mesh position={[0, 0, 0.15]}>
                    <sphereGeometry args={[0.11, 32, 32]} />
                    <meshStandardMaterial color={0x4A90E2} metalness={0.4} roughness={0.3} />
                </mesh>
                <mesh position={[0, 0, 0.18]}>
                    <sphereGeometry args={[0.06, 32, 32]} />
                    <meshStandardMaterial color={0x000000} metalness={0.8} roughness={0.1} />
                </mesh>
                <mesh position={[-0.04, 0.04, 0.2]}>
                    <sphereGeometry args={[0.03, 16, 16]} />
                    <meshStandardMaterial color={0xFFFFFF} metalness={1} roughness={0} />
                </mesh>
            </group>
            
            {/* Mouth */}
            <mesh position={[0, -0.15, 0.65]}>
                <sphereGeometry args={[0.25, 32, 32]} />
                <meshStandardMaterial
                    color={emotion.happiness > 7 ? 0xFF8FA3 : emotion.happiness > 5 ? 0xFF7E99 : 0xFF5588}
                    metalness={0.3}
                    roughness={0.4}
                />
            </mesh>
            
            {/* Blush */}
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

export default function ChatAvatar() {
    const { predictions } = useContext(AppContext)
    
    return (
        <Canvas
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100vh',
                zIndex: 0,
                pointerEvents: 'none'
            }}
            camera={{ position: [0, 0, 3], fov: 45 }}
        >
            <ambientLight intensity={0.8} />
            <pointLight position={[10, 10, 10]} intensity={1.2} />
            <pointLight position={[-8, -5, 5]} intensity={0.6} color={0x7799FF} />
            <pointLight position={[0, 5, -10]} intensity={0.4} color={0xFF9999} />
            
            <RealisticHumanHead predictions={predictions} />
        </Canvas>
    )
}
