import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function Earth({ position = [30, 0, 0] }) {
    const earthRef = useRef();
    const cloudsRef = useRef();

    // Load High-Res Textures
    const [colorMap, normalMap, specularMap, cloudsMap] = useTexture([
        '/textures/earth/albedo.jpg',
        '/textures/earth/normal.jpg',
        '/textures/earth/specular.jpg',
        '/textures/earth/clouds.png'
    ]);

    useFrame(() => {
        if (earthRef.current) {
            earthRef.current.rotation.y += 0.001; // Earth rotation
        }
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y += 0.0012; // Clouds rotate slightly faster
        }
    });

    return (
        <group position={position}>
            {/* The Solid Earth */}
            <mesh ref={earthRef}>
                <sphereGeometry args={[1.5, 64, 64]} />
                <meshStandardMaterial
                    map={colorMap}
                    normalMap={normalMap}
                    roughnessMap={specularMap}
                    roughness={0.7}
                    metalness={0.1}
                />
            </mesh>

            {/* The Cloud Layer (Slightly larger radius) */}
            <mesh ref={cloudsRef} scale={[1.01, 1.01, 1.01]}>
                <sphereGeometry args={[1.5, 64, 64]} />
                <meshStandardMaterial
                    map={cloudsMap}
                    transparent={true}
                    opacity={0.8}
                    blending={THREE.NormalBlending}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Atmosphere Glow (Fresnel effect imitation) */}
            <mesh scale={[1.04, 1.04, 1.04]}>
                <sphereGeometry args={[1.5, 32, 32]} />
                <meshBasicMaterial
                    color="#4b99ff"
                    transparent
                    opacity={0.15}
                    blending={THREE.AdditiveBlending}
                    side={THREE.BackSide}
                />
            </mesh>
        </group>
    );
}
