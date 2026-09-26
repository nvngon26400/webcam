import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';

interface ThreeCanvasProps {
  className?: string;
  intensity?: number;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  className = '',
  intensity = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 75;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Particle nodes setup
    const particleCount = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount * 3);

    const radius = 45;
    for (let i = 0; i < particleCount; i++) {
      // Fibonacci sphere or wave distribution
      const theta = Math.acos(1 - (2 * (i + 0.5)) / particleCount);
      const phi = Math.PI * (1 + Math.sqrt(5)) * i;

      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(theta);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      speeds[i * 3] = (Math.random() - 0.5) * 0.02;
      speeds[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      speeds[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle material
    const isDark = theme === 'dark';
    const particleColor = isDark ? 0x818cf8 : 0x4f46e5;
    const lineBaseColor = isDark ? 0x6366f1 : 0x3b82f6;

    const particleMaterial = new THREE.PointsMaterial({
      color: particleColor,
      size: 2.2,
      transparent: true,
      opacity: isDark ? 0.85 : 0.65,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    // Dynamic Connections Lines
    const maxConnections = 600;
    const linePositions = new Float32Array(maxConnections * 6);
    const lineColors = new Float32Array(maxConnections * 6);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.45 : 0.25,
      blending: THREE.AdditiveBlending,
    });

    const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineMesh);

    // Mouse movement interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      mouseX = (clientX / rect.width - 0.5) * 2;
      mouseY = -(clientY / rect.height - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera parallax
      targetX += (mouseX * 12 - targetX) * 0.05;
      targetY += (mouseY * 12 - targetY) * 0.05;
      camera.position.x = targetX;
      camera.position.y = targetY;
      camera.lookAt(scene.position);

      // Rotate whole mesh slowly
      particles.rotation.y = elapsedTime * 0.08 * intensity;
      particles.rotation.x = Math.sin(elapsedTime * 0.05) * 0.15;
      lineMesh.rotation.y = particles.rotation.y;
      lineMesh.rotation.x = particles.rotation.x;

      // Update positions with gentle breathing wave
      const pos = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const ox = originalPositions[i * 3];
        const oy = originalPositions[i * 3 + 1];
        const oz = originalPositions[i * 3 + 2];

        const wave = Math.sin(elapsedTime * 1.5 + i * 0.2) * 1.8;
        pos[i * 3] = ox + (ox / radius) * wave;
        pos[i * 3 + 1] = oy + (oy / radius) * wave;
        pos[i * 3 + 2] = oz + (oz / radius) * wave;
      }
      geometry.attributes.position.needsUpdate = true;

      // Calculate proximity lines
      let connectionCount = 0;
      const maxDistance = 16;
      const linePos = lineGeometry.attributes.position.array as Float32Array;
      const lineCol = lineGeometry.attributes.color.array as Float32Array;

      const baseC = new THREE.Color(lineBaseColor);

      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          if (connectionCount >= maxConnections) break;

          const dx = pos[i * 3] - pos[j * 3];
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < maxDistance) {
            const alpha = 1.0 - dist / maxDistance;

            const idx = connectionCount * 6;
            linePos[idx] = pos[i * 3];
            linePos[idx + 1] = pos[i * 3 + 1];
            linePos[idx + 2] = pos[i * 3 + 2];

            linePos[idx + 3] = pos[j * 3];
            linePos[idx + 4] = pos[j * 3 + 1];
            linePos[idx + 5] = pos[j * 3 + 2];

            // Color with gradient fade
            lineCol[idx] = baseC.r * alpha;
            lineCol[idx + 1] = baseC.g * alpha;
            lineCol[idx + 2] = baseC.b * alpha;

            lineCol[idx + 3] = baseC.r * alpha;
            lineCol[idx + 4] = baseC.g * alpha;
            lineCol[idx + 5] = baseC.b * alpha;

            connectionCount++;
          }
        }
      }

      lineGeometry.setDrawRange(0, connectionCount * 2);
      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.color.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Window Resize Handling
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      particleMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
    };
  }, [theme, intensity]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
};
