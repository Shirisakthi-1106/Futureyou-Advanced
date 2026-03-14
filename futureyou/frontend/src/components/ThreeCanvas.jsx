import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useContext, useMemo } from 'react'
import * as THREE from 'three'
import { AppContext } from '../context/AppContext'

function DataParticles({ predictions }) {
    const groupRef = useRef()
    const particlesRef = useRef([])
    
    const calculateColor = () => {
        if (!predictions) return 0x00FFCC
        const wellbeing = predictions.wellbeing_score || 5
        if (wellbeing >= 7) return 0x00FFCC
        if (wellbeing >= 5) return 0x7700FF
        return 0xFF0055
    }
    
    // Create particles that represent data points
    const particles = useMemo(() => {
        const temp = []
        for (let i = 0; i < 150; i++) {
            temp.push({
                x: (Math.random() - 0.5) * 20,
                y: (Math.random() - 0.5) * 20,
                z: (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 0.08,
                vy: (Math.random() - 0.5) * 0.08,
                vz: (Math.random() - 0.5) * 0.08,
                type: i % 4
            })
        }
        return temp
    }, [])
    
    useFrame(() => {
        particles.forEach((p, i) => {
            p.x += p.vx * 1.5
            p.y += p.vy * 1.5
            p.z += p.vz * 1.5
            
            // Bounce off boundaries
            if (Math.abs(p.x) > 10) p.vx *= -1
            if (Math.abs(p.y) > 10) p.vy *= -1
            if (Math.abs(p.z) > 10) p.vz *= -1
            
            if (particlesRef.current[i]) {
                particlesRef.current[i].position.set(p.x, p.y, p.z)
            }
        })
    })
    
    const color = calculateColor()
    
    return (
        <group ref={groupRef}>
            {particles.map((p, i) => (
                <mesh
                    key={i}
                    ref={el => particlesRef.current[i] = el}
                    position={[p.x, p.y, p.z]}
                >
                    <sphereGeometry args={[0.08, 8, 8]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={0.5}
                        opacity={0.6}
                        transparent
                    />
                </mesh>
            ))}
        </group>
    )
}

function TrajectoryPaths({ predictions }) {
    const groupRef = useRef()
    
    useFrame(({ clock }) => {
        if (!groupRef.current) return
        const t = clock.getElapsedTime()
        groupRef.current.rotation.z += 0.003
        groupRef.current.position.y = Math.sin(t * 0.8) * 2
    })
    
    // Three paths representing: Current, Optimized, Declining
    const createPath = (index, color) => {
        const points = []
        for (let i = 0; i < 100; i++) {
            const t = i / 100
            const x = (t - 0.5) * 15
            const y = Math.sin(t * Math.PI * 3 + index) * 4
            const z = Math.cos(t * Math.PI * 3 + index * 0.5) * 3
            points.push(new THREE.Vector3(x, y, z))
        }
        return { points, color }
    }
    
    const paths = [
        createPath(0, 0x00FFCC),
        createPath(1, 0x00FF88),
        createPath(2, 0xFF3366)
    ]
    
    return (
        <group ref={groupRef}>
            {paths.map((path, idx) => (
                <lineSegments key={idx}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={path.points.length}
                            array={new Float32Array(path.points.flatMap(p => [p.x, p.y, p.z]))}
                            itemSize={3}
                        />
                    </bufferGeometry>
                    <lineBasicMaterial
                        color={path.color}
                        linewidth={2}
                        opacity={0.4 + idx * 0.15}
                        transparent
                    />
                </lineSegments>
            ))}
        </group>
    )
}

function AcademicGrids({ predictions }) {
    const groupRef = useRef()
    
    useFrame(({ clock }) => {
        if (!groupRef.current) return
        const t = clock.getElapsedTime()
        groupRef.current.position.y = Math.sin(t * 0.6) * 1.5
        groupRef.current.rotation.x = Math.sin(t * 0.4) * 0.4
        groupRef.current.rotation.z = Math.cos(t * 0.3) * 0.3
    })
    
    return (
        <group ref={groupRef}>
            <GridPlane position={[-5, 0, 0]} color={0x00FFCC} zIndex={0} />
            <GridPlane position={[0, 0, -5]} color={0x7700FF} zIndex={1} />
            <GridPlane position={[5, 0, 0]} color={0xFF8899} zIndex={2} />
        </group>
    )
}

function GridPlane({ position, color, zIndex }) {
    const meshRef = useRef()
    
    useFrame(({ clock }) => {
        if (meshRef.current) {
            const t = clock.getElapsedTime()
            meshRef.current.material.opacity = 0.15 + Math.sin(t * 1.5 + zIndex) * 0.12
            meshRef.current.rotation.x += 0.002
            meshRef.current.rotation.y += 0.001
        }
    })
    
    return (
        <mesh ref={meshRef} position={position} rotation={[Math.PI / 4, 0, 0]}>
            <planeGeometry args={[8, 8, 20, 20]} />
            <meshStandardMaterial
                color={color}
                wireframe
                transparent
                opacity={0.15}
                emissive={color}
                emissiveIntensity={0.1}
            />
        </mesh>
    )
}

function PredictionNodes({ predictions }) {
    const groupRef = useRef()
    
    useFrame(({ clock }) => {
        if (!groupRef.current) return
        const t = clock.getElapsedTime()
        
        groupRef.current.children.forEach((child, i) => {
            const angle = (i / 4) * Math.PI * 2 + t * 0.8
            const radius = 6 + Math.sin(t * 1.2 + i * 0.5) * 1.5
            
            child.position.x = Math.cos(angle) * radius
            child.position.y = Math.sin(angle) * radius
            child.position.z = Math.sin(t * 0.6 + i) * 3
            
            child.scale.setScalar(0.6 + Math.sin(t * 2.5 + i * 0.7) * 0.4)
            child.rotation.z += 0.04
            child.rotation.x += 0.02
        })
    })
    
    const nodeColors = [0x00FFCC, 0x7700FF, 0xFF8899, 0x00FF88]
    
    return (
        <group ref={groupRef}>
            {nodeColors.map((color, i) => (
                <mesh key={i} position={[0, 0, 0]}>
                    <octahedronGeometry args={[0.4, 0]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={0.4}
                        wireframe={false}
                        transparent
                        opacity={0.8}
                    />
                </mesh>
            ))}
        </group>
    )
}

function ConnectingLines({ predictions }) {
    const groupRef = useRef()
    
    useFrame(({ clock }) => {
        if (!groupRef.current) return
        const t = clock.getElapsedTime()
        groupRef.current.rotation.z += 0.005
        groupRef.current.rotation.x = Math.sin(t * 0.4) * 0.3
        groupRef.current.rotation.y = Math.cos(t * 0.3) * 0.3
    })
    
    return (
        <group ref={groupRef}>
            <lineSegments>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={8}
                        array={new Float32Array([
                            6, 0, 0,    0, 6, 0,
                            0, 6, 0,    -6, 0, 0,
                            -6, 0, 0,   0, -6, 0,
                            0, -6, 0,   6, 0, 0
                        ])}
                        itemSize={3}
                    />
                </bufferGeometry>
                <lineBasicMaterial
                    color={0x7700FF}
                    opacity={0.5}
                    transparent
                    linewidth={2}
                />
            </lineSegments>
        </group>
    )
}

export default function ThreeCanvas() {
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
            camera={{ position: [0, 0, 12], fov: 55 }}
        >
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={0.8} color={0x00FFCC} />
            <pointLight position={[-10, -10, -10]} intensity={0.6} color={0x7700FF} />
            <pointLight position={[0, 0, 15]} intensity={0.5} color={0xFF8899} />
            
            <DataParticles predictions={predictions} />
            <TrajectoryPaths predictions={predictions} />
            <AcademicGrids predictions={predictions} />
            <PredictionNodes predictions={predictions} />
            <ConnectingLines predictions={predictions} />
        </Canvas>
    )
}

