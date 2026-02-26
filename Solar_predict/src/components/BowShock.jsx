import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  uniform float threatLevel;
  uniform float time;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    
    // Start with sphere position
    vec3 pos = position;
    
    // Stretch the sphere into a teardrop/parabola shape to mimic the magnetosphere tail
    // The sun is in the -X direction (since Earth is at +35 X)
    // If x > 0 (facing away from sun), stretch it out into a tail
    if (pos.x > 0.0) {
      pos.x += pow(pos.x, 2.0) * 1.5;
    }
    
    // Flatten the front part slightly to make the bow shock more blunt
    if (pos.x < 0.0) {
      pos.x *= 0.6;
    }

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  uniform float threatLevel;
  uniform float time;

  void main() {
    // Normal in world space
    vec3 worldNormal = normalize(vNormal);
    
    // Direction to sun (sun is at 0,0,0)
    vec3 dirToSun = normalize(-vWorldPosition);
    vec3 dirToCamera = normalize(cameraPosition - vWorldPosition);
    
    // Calculate how much the surface points to the sun
    float sunFacing = dot(worldNormal, dirToSun);
    
    // Discard the back half of the magnetic field entirely so we only see the front barrier
    if (sunFacing < 0.05) {
      discard; 
    }
    
    // Fresnel effect to make the edges glow sharply like a crescent
    float fresnel = dot(worldNormal, dirToCamera);
    fresnel = clamp(1.0 - abs(fresnel), 0.0, 1.0);
    fresnel = pow(fresnel, 2.0); // sharper curve
    
    // Base intensity from facing the sun and fresnel
    float intensity = sunFacing * fresnel * 2.5;
    
    // Add aggressive angle check: Only render when viewing the front face
    // If the camera is behind the Earth looking at the shield's back, hide it.
    float viewAngleToSun = dot(dirToCamera, dirToSun);
    if (viewAngleToSun < 0.2) {
      intensity = 0.0;
    }
    
    // Add procedural noise/pulsing to mimic energy resistance
    float pulse = sin(time * 3.0 + vWorldPosition.y * 2.0) * 0.1 + 0.9;
    intensity *= pulse;
    
    vec3 color = vec3(0.0);
    if (intensity > 0.0) {
       // Fire colors: Yellow/White core, Orange/Red edges
       vec3 fireHot = vec3(1.0, 0.9, 0.6); // White/Yellow Base
       vec3 fireMid = vec3(1.0, 0.4, 0.0); // Orange
       vec3 fireCool = vec3(0.8, 0.1, 0.0); // Deep red
       
       // Ramp the color from red -> orange -> yellow based on intensity
       color = mix(fireCool, fireMid, smoothstep(0.0, 0.4, intensity));
       color = mix(color, fireHot, smoothstep(0.4, 1.0, intensity));
       
       // Intensify the red and overall brightness as threat level rises
       float threatFactor = threatLevel / 100.0;
       color += vec3(threatFactor * 0.6, threatFactor * 0.1, 0.0);
    }
    
    // Alpha falloff
    // The barrier gets more opaque and visible during high threats. Lowered base alpha as requested.
    float baseAlpha = 0.15 + (threatLevel / 100.0) * 0.4;
    float alpha = smoothstep(0.05, 0.3, sunFacing) * intensity * baseAlpha;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export default function BowShock({ threatLevel, position = [35, 0, 0] }) {
  const meshRef = useRef();

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    threatLevel: { value: threatLevel }
  }), []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.time.value = state.clock.elapsedTime;
      // Smoothly interpolate threat level
      meshRef.current.material.uniforms.threatLevel.value = THREE.MathUtils.lerp(
        meshRef.current.material.uniforms.threatLevel.value,
        threatLevel,
        0.05
      );

      // Determine dynamic shield size based on threatLevel (matches SolarWind logic)
      // Reduced shield scale significantly as requested
      const targetRadius = 4.5 - (threatLevel / 100.0) * 1.5;

      // Lerp scale for smooth transition
      meshRef.current.scale.lerp(new THREE.Vector3(targetRadius, targetRadius, targetRadius), 0.05);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
