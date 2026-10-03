"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function FloatingSculpture() {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const wireframeRef = React.useRef<THREE.LineSegments>(null);

  // Smooth rotation & interactive tilt on frame
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const { x, y } = state.pointer;

    if (meshRef.current) {
      // Gentle continuous rotation combined with subtle mouse tracking
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        Math.cos(t / 2) / 4 + y * 0.4,
        0.05
      );
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        Math.sin(t / 3) / 3 + x * 0.4,
        0.05
      );
      meshRef.current.position.y = Math.sin(t * 1.2) * 0.15;
    }

    if (wireframeRef.current && meshRef.current) {
      wireframeRef.current.rotation.x = meshRef.current.rotation.x;
      wireframeRef.current.rotation.y = meshRef.current.rotation.y;
      wireframeRef.current.position.y = meshRef.current.position.y;
    }
  });

  return (
    <group>
      {/* Primary Faceted Core */}
      <mesh ref={meshRef} scale={1.85}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#121214"
          roughness={0.15}
          metalness={0.9}
          envMapIntensity={1.2}
          wireframe={false}
        />
      </mesh>

      {/* Subtle Outer High-Contrast Wireframe Cage */}
      <lineSegments ref={wireframeRef} scale={1.88}>
        <edgesGeometry args={[new THREE.IcosahedronGeometry(1, 1)]} />
        <lineBasicMaterial color="#FAFAFA" transparent opacity={0.3} />
      </lineSegments>

      {/* Orbiting Ring Element */}
      <mesh rotation={[Math.PI / 3, 0, 0]} scale={2.7}>
        <torusGeometry args={[1, 0.012, 16, 64]} />
        <meshBasicMaterial color="#FAFAFA" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="relative w-full h-full min-h-[280px] sm:min-h-[380px] lg:min-h-[440px] flex items-center justify-center overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1.8} color="#FFFFFF" />
        <pointLight position={[-10, -10, -5]} intensity={0.8} color="#71717A" />

        <Float speed={2} rotationIntensity={0.6} floatIntensity={0.8}>
          <FloatingSculpture />
        </Float>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 1.7}
          minPolarAngle={Math.PI / 2.5}
        />
      </Canvas>
    </div>
  );
}
