import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

function QuantumWave() {
    const count = 80;
    const separation = 0.6;
    const positions = useMemo(() => {
        const pos = [];
        for (let ix = 0; ix < count; ix++) {
            for (let iy = 0; iy < count; iy++) {
                pos.push(
                    ix * separation - (count * separation) / 2,
                    0,
                    iy * separation - (count * separation) / 2
                );
            }
        }
        return new Float32Array(pos);
    }, [count, separation]);

    const meshRef = useRef();

    useFrame((state) => {
        const time = state.clock.elapsedTime;
        const posArray = meshRef.current.geometry.attributes.position.array;
        let i = 0;
        for (let ix = 0; ix < count; ix++) {
            for (let iy = 0; iy < count; iy++) {
                const x = ix * separation - (count * separation) / 2;
                const z = iy * separation - (count * separation) / 2;
                const dist = Math.sqrt(x * x + z * z);

                // Complex wave pattern
                posArray[i + 1] = Math.sin((ix + time * 2) * 0.3) * 1.5 +
                    Math.cos((iy + time * 1.5) * 0.4) * 1.5 +
                    Math.sin(dist * 0.5 - time) * 2;

                i += 3;
            }
        }
        meshRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={meshRef} position={[0, -8, 0]} rotation={[0.2, 0, 0]}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial size={0.08} color="#00ffcc" transparent opacity={0.6} sizeAttenuation={true} />
        </points>
    );
}

function DataNodes() {
    const count = 100;
    const mesh = useRef();

    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            temp.push({
                x: (Math.random() - 0.5) * 40,
                y: (Math.random() - 0.5) * 30,
                z: (Math.random() - 0.5) * 40,
                speedY: 0.01 + Math.random() * 0.03,
                rotSpeed: (Math.random() - 0.5) * 0.1,
                scale: 0.5 + Math.random() * 1.5
            });
        }
        return temp;
    }, [count]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame(() => {
        particles.forEach((particle, i) => {
            particle.y += particle.speedY;
            if (particle.y > 15) particle.y = -15;

            dummy.position.set(particle.x, particle.y, particle.z);
            dummy.rotation.x += particle.rotSpeed;
            dummy.rotation.y += particle.rotSpeed;
            dummy.scale.set(particle.scale, particle.scale, particle.scale);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            <boxGeometry args={[0.15, 0.15, 0.15]} />
            <meshStandardMaterial color="#b026ff" wireframe opacity={0.4} transparent />
        </instancedMesh>
    );
}

function ConnectionLines() {
    const group = useRef();
    useFrame((state) => {
        group.current.rotation.y = state.pointer.x * 0.2;
        group.current.rotation.x = -state.pointer.y * 0.2;
    })

    return (
        <group ref={group}>
            <QuantumWave />
            <DataNodes />
        </group>
    )
}

export default function ThreeCanvas() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none mix-blend-screen opacity-70">
            <Canvas camera={{ position: [0, 2, 20], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ffcc" />
                <pointLight position={[-10, -10, -10]} intensity={1.5} color="#b026ff" />
                <ConnectionLines />
                <ContactShadows position={[0, -10, 0]} opacity={0.4} scale={50} blur={3} far={15} />
            </Canvas>
        </div>
    )
}
