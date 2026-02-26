import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  uniform float time;
  uniform float threatLevel;
  
  attribute float offset;
  attribute vec3 aRandom;
  
  varying vec3 vColor;
  varying float vAlpha;

  // Classic Simplex 3D Noise function for organic waves
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  
  float snoise(vec3 v){ 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    
    i = mod(i, 289.0 ); 
    vec4 p = permute( permute( permute( 
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
             
    float n_ = 1.0/7.0;
    vec3  ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    float initialRadius = length(position);
    vec3 dir = normalize(position);
    
    // EXTREME Physics Scaling based on Threat Level
    // Calm solar wind = 1x speed. X-Class Flare (100 threat) = 15x speed!
    float speedMultiplier = 1.0 + pow(threatLevel / 100.0, 2.0) * 15.0; 
    float particleTravelSpeed = 4.0 + aRandom.y * 4.0; 
    float travelDist = (time * speedMultiplier * particleTravelSpeed);
    
    float newRadius = 8.5 + mod(initialRadius - 8.5 + travelDist, 45.0 - 8.5);
    
    // Turbulence increases with threat level
    float turbulence = 0.5 + (threatLevel / 100.0) * 3.0;
    float noiseVal = snoise(dir * turbulence - time * 0.5) * 0.5 + 0.5;
    
    // Base position radially outward + Massive noise-driven CME waves
    // When threat is high, particles deviate massively from their straight path
    vec3 newPos = dir * newRadius + dir * (noiseVal * 20.0 * pow(threatLevel / 100.0, 1.5));
    
    // Create streak (grows much longer during flares)
    // Increased length slightly per user request
    float streakLength = 0.5 + pow(threatLevel / 100.0, 2.0) * 4.0 + aRandom.x * 0.8;
    vec3 finalPos = newPos - dir * (offset * streakLength);
    
    // --- EARTH MAGNETOSPHERE PHYSICS (Fluid Parting) ---
    // Earth is positioned at (35.0, 0.0, 0.0). We check the particle's distance to Earth.
    vec3 earthPos = vec3(35.0, 0.0, 0.0);
    vec3 toEarth = finalPos - earthPos;
    float distToEarth = length(toEarth);
    
    // The shield radius dictates how far out the "bow shock" begins
    // We make this significantly larger than the actual BowShock mesh radius (which is ~4.5 max)
    // so that the particles cleanly part AROUND the fiery barrier and the Earth behind it.
    float collisionRadius = 7.0 - (threatLevel / 100.0) * 1.5; 
    
    if (distToEarth < collisionRadius && distToEarth > 0.1) {
        // Normalize the vector pointing away from Earth
        vec3 pushDir = toEarth / distToEarth;
        
        // Calculate how deep the particle is inside the shield influence zone
        float penetrationInfo = 1.0 - (distToEarth / collisionRadius);
        
        // We want the particles to smoothly "slide" around the invisible sphere.
        // We calculate a tangent vector that pushes them sideways along the sphere's surface.
        // This creates a beautiful parting effect like water around a stone.
        float slideForce = smoothstep(0.0, 1.0, penetrationInfo) * 8.0; // Increased pushing force
        finalPos += pushDir * slideForce;
        
        // Add a drag/compression at the bow shock edge so they slow down slightly when hitting it
        finalPos -= dir * (penetrationInfo * 3.0);
    }
    // ---------------------------------------------------
    
    float currentRadius = length(finalPos);
    
    // Fade in at the sun, fade out near earth
    float distFade = smoothstep(45.0, 30.0, currentRadius) * smoothstep(8.5, 12.0, currentRadius);
    
    // PROCEDURAL DENSITY: Hide particles based on threat level 
    // If threat is 0, only 5% of particles show. If threat is 100, 100% of particles show.
    float particleVisibilityThreshold = 0.95 - (threatLevel / 100.0) * 0.95;
    float isVisible = step(particleVisibilityThreshold, aRandom.z);
    
    // Becomes slightly more opaque during major flares, and applies density logic
    vAlpha = distFade * (1.0 - offset * 0.8) * (0.1 + (threatLevel / 100.0) * 0.2) * isVisible; 
    // Aggressive Color changes
    vec3 calmColor = vec3(1.0, 1.0, 1.0); // Faint white lines
    vec3 activeColor = vec3(1.0, 0.8, 0.3); // Orange flare
    vec3 intenseColor = vec3(1.0, 0.1, 0.0); // Deep red violent flares
    
    // Threat 0-50 = White to Orange. Threat 50-100 = Orange to Blood Red
    vec3 baseColor = mix(calmColor, activeColor, smoothstep(20.0, 60.0, threatLevel));
    vColor = mix(baseColor, intenseColor, smoothstep(60.0, 95.0, threatLevel) * noiseVal);

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4(vColor, vAlpha);
  }
`;

export default function SolarWind({ threatLevel }) {
  const lineCount = 8000;
  const linesRef = useRef();

  const [positions, offsets, randoms] = useMemo(() => {
    // 2 vertices per line
    const pos = new Float32Array(lineCount * 2 * 3);
    const off = new Float32Array(lineCount * 2);
    const rnd = new Float32Array(lineCount * 2 * 3);

    for (let i = 0; i < lineCount; i++) {
      const radius = 8.5 + Math.random() * 37;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos((Math.random() * 2) - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      const r1 = Math.random();
      const r2 = Math.random();
      const r3 = Math.random();

      // Vertex 1 (Head)
      pos[i * 6] = x;
      pos[i * 6 + 1] = y;
      pos[i * 6 + 2] = z;
      off[i * 2] = 0;
      rnd[i * 6] = r1; rnd[i * 6 + 1] = r2; rnd[i * 6 + 2] = r3;

      // Vertex 2 (Tail)
      pos[i * 6 + 3] = x;
      pos[i * 6 + 4] = y;
      pos[i * 6 + 5] = z;
      off[i * 2 + 1] = 1;
      rnd[i * 6 + 3] = r1; rnd[i * 6 + 4] = r2; rnd[i * 6 + 5] = r3;
    }
    return [pos, off, rnd];
  }, [lineCount]);

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      threatLevel: { value: threatLevel }
    }),
    []
  );

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.material.uniforms.time.value = state.clock.elapsedTime;
      linesRef.current.material.uniforms.threatLevel.value = THREE.MathUtils.lerp(
        linesRef.current.material.uniforms.threatLevel.value,
        threatLevel,
        0.05
      );

      linesRef.current.rotation.y += 0.0005;
      linesRef.current.rotation.z += 0.0002;
    }
  });

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={lineCount * 2}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-offset"
          count={lineCount * 2}
          array={offsets}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={lineCount * 2}
          array={randoms}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        linewidth={1}
      />
    </lineSegments>
  );
}
