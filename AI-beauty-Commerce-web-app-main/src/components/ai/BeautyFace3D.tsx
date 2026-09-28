import React, { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Sparkles } from 'lucide-react';

export type ScanStage = 'idle' | 'preparing' | 'scanning' | 'analyzing' | 'results';

export interface LandmarkData {
  id: string;
  label: string;
  metric: string;
  score: string;
  position: [number, number, number]; // [x, y, z] in Three.js coordinates
  screenPos: { top: string; left: string }; // for 2D UI overlay & fallback
}

export const LANDMARKS: LandmarkData[] = [
  {
    id: 'forehead',
    label: 'Frontal Plane',
    metric: 'Cellular Hydration',
    score: '84%',
    position: [0, 0.72, 0.22],
    screenPos: { top: '26%', left: '50%' }
  },
  {
    id: 'left-cheek',
    label: 'Zygomatic Arch L',
    metric: 'Lipid Barrier',
    score: '91%',
    position: [-0.44, 0.05, 0.28],
    screenPos: { top: '50%', left: '28%' }
  },
  {
    id: 'right-cheek',
    label: 'Zygomatic Arch R',
    metric: 'Melanin Radiance',
    score: '88%',
    position: [0.44, 0.05, 0.28],
    screenPos: { top: '50%', left: '72%' }
  },
  {
    id: 'under-eye',
    label: 'Infraorbital Rim',
    metric: 'Micro-Circulation',
    score: '86%',
    position: [0.22, 0.25, 0.32],
    screenPos: { top: '42%', left: '60%' }
  },
  {
    id: 't-zone',
    label: 'Pronasale / T-Zone',
    metric: 'Sebum Equilibrium',
    score: '78%',
    position: [0, 0.12, 0.38],
    screenPos: { top: '46%', left: '50%' }
  },
  {
    id: 'chin',
    label: 'Gnathion / Chin',
    metric: 'Texture Smoothness',
    score: '92%',
    position: [0, -0.42, 0.24],
    screenPos: { top: '70%', left: '50%' }
  }
];

interface BeautyFace3DProps {
  scanStage?: ScanStage;
  scanProgress?: number;
  className?: string;
  onLandmarkClick?: (landmark: LandmarkData) => void;
  showOverlayTelemetry?: boolean;
}

export const BeautyFace3D: React.FC<BeautyFace3DProps> = ({
  scanStage = 'idle',
  scanProgress = 0,
  className = '',
  onLandmarkClick,
  showOverlayTelemetry = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeLandmarkId, setActiveLandmarkId] = useState<string | null>(null);
  const [hasWebGLError, setHasWebGLError] = useState(false);
  const texturePath = '/beauty_face_3d.jpg';

  // Three.js refs for animation loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const scanLineRef = useRef<THREE.Mesh | null>(null);
  const pointLightRef = useRef<THREE.PointLight | null>(null);
  const pointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const activeLandmark = useMemo(() => {
    return LANDMARKS.find((lm) => lm.id === activeLandmarkId) || null;
  }, [activeLandmarkId]);

  const handleSelectLandmark = (id: string | null) => {
    setActiveLandmarkId(id);
    if (id && onLandmarkClick) {
      const lm = LANDMARKS.find((l) => l.id === id);
      if (lm) onLandmarkClick(lm);
    }
  };

  // Pointer tracking for smooth 3D parallax
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    pointerPos.current = { x, y };
  };

  // Initialize pure Three.js scene (React 18 compatible, 0 reconciler overhead)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationId: number;
    let renderer: THREE.WebGLRenderer | null = null;

    try {
      // 1. Scene & Camera setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const width = canvas.clientWidth || 360;
      const height = canvas.clientHeight || 450;
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 0, 3.1);

      // 2. WebGL Renderer with alpha transparency
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // 3. Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xfffdf7, 1.1);
      dirLight.position.set(0, 2, 3);
      scene.add(dirLight);

      const dynamicPointLight = new THREE.PointLight(0xf6e7c1, 1.8, 8);
      dynamicPointLight.position.set(0, 1.2, 2.0);
      scene.add(dynamicPointLight);
      pointLightRef.current = dynamicPointLight;

      const goldRimLight = new THREE.PointLight(0xd4af37, 1.2, 6);
      goldRimLight.position.set(-1.8, -0.6, 1.2);
      scene.add(goldRimLight);

      // 4. Main 3D Model Group
      const mainGroup = new THREE.Group();
      scene.add(mainGroup);
      groupRef.current = mainGroup;

      // 5. Curved Plane Geometry (sculpted cylinder curvature for face bust)
      const geometry = new THREE.PlaneGeometry(2.3, 2.7, 32, 32);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        const py = pos.getY(i);
        const pz = -Math.pow(px, 2) * 0.18 - Math.pow(py - 0.1, 2) * 0.05 + 0.06;
        pos.setZ(i, pz);
      }
      geometry.computeVertexNormals();

      // 6. Texture Loader
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        texturePath,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;

          const material = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.35,
            metalness: 0.15,
            transparent: true,
            side: THREE.DoubleSide
          });

          const faceMesh = new THREE.Mesh(geometry, material);
          mainGroup.add(faceMesh);
        },
        undefined,
        () => {
          // If texture fails, gracefully fall back
          setHasWebGLError(true);
        }
      );

      // 7. 3D Laser Scan Line Ribbon
      const scanGeo = new THREE.PlaneGeometry(2.5, 0.04);
      const scanMat = new THREE.MeshBasicMaterial({
        color: 0xd4af37,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide
      });
      const scanLine = new THREE.Mesh(scanGeo, scanMat);
      scanLine.position.set(0, 0, 0.35);
      scanLine.visible = false;
      mainGroup.add(scanLine);
      scanLineRef.current = scanLine;

      // 8. 3D Landmark Nodes
      const landmarkGroup = new THREE.Group();
      mainGroup.add(landmarkGroup);

      LANDMARKS.forEach((lm) => {
        const nodeGeo = new THREE.SphereGeometry(0.03, 16, 16);
        const nodeMat = new THREE.MeshStandardMaterial({
          color: 0xd4af37,
          emissive: 0xd4af37,
          emissiveIntensity: 0.8,
          roughness: 0.2
        });
        const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
        nodeMesh.position.set(...lm.position);
        landmarkGroup.add(nodeMesh);

        // Ring
        const ringGeo = new THREE.RingGeometry(0.045, 0.06, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xd4af37,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(...lm.position);
        landmarkGroup.add(ringMesh);
      });

      // 9. Resize observer
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect.width;
          const h = entry.contentRect.height;
          if (w > 0 && h > 0 && renderer) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
          }
        }
      });
      resizeObserver.observe(canvas);

      // 10. Animation Loop
      let clock = new THREE.Clock();

      const animate = () => {
        animationId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        if (mainGroup) {
          // Floating oscillation
          mainGroup.position.y = Math.sin(t * 1.1) * 0.035;

          // Orientation + Parallax
          const targetRotY = Math.sin(t * 0.6) * 0.045 + pointerPos.current.x * 0.08;
          const targetRotX = Math.cos(t * 0.8) * 0.03 - pointerPos.current.y * 0.05;
          mainGroup.rotation.y = THREE.MathUtils.lerp(mainGroup.rotation.y, targetRotY, 0.08);
          mainGroup.rotation.x = THREE.MathUtils.lerp(mainGroup.rotation.x, targetRotX, 0.08);

          // Gentle breathing scale
          const breatheScale = 1 + Math.sin(t * 1.4) * 0.008;
          mainGroup.scale.set(breatheScale, breatheScale, breatheScale);
        }

        // Lighting orbit
        if (pointLightRef.current) {
          pointLightRef.current.position.x = Math.sin(t * 0.9) * 2.5;
          pointLightRef.current.position.y = 1.2 + Math.cos(t * 0.7) * 0.6;
          pointLightRef.current.position.z = 2.0 + Math.sin(t * 0.5) * 0.5;
        }

        // Laser scan line position update
        if (scanLineRef.current) {
          if (scanStage === 'scanning') {
            scanLineRef.current.visible = true;
            const normalizedProg = (scanProgress % 100) / 100;
            scanLineRef.current.position.y = 1.0 - normalizedProg * 2.0;
          } else if (scanStage === 'preparing') {
            scanLineRef.current.visible = true;
            scanLineRef.current.position.y = 1.0;
          } else {
            scanLineRef.current.visible = false;
          }
        }

        renderer?.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationId);
        resizeObserver.disconnect();
        renderer?.dispose();
      };
    } catch {
      setHasWebGLError(true);
    }
  }, [scanStage, scanProgress, texturePath]);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className={`relative w-full max-w-md mx-auto aspect-[4/5] flex items-center justify-center select-none overflow-hidden ${className}`}
      style={{
        background: 'transparent'
      }}
    >
      {/* 1. Pure Three.js Canvas Scene */}
      {!hasWebGLError ? (
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-grab active:cursor-grabbing"
          style={{ background: 'transparent' }}
        />
      ) : (
        /* 2. Graceful Fallback: Framer Motion Animation */
        <motion.div
          animate={{
            y: [0, -8, 0],
            rotate: [0, 0.4, 0, -0.4, 0],
            scale: [1, 1.006, 1]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="relative w-full h-full flex items-center justify-center"
        >
          <img
            src={texturePath}
            alt="Desla 3D Beauty Face"
            className="w-full h-full object-contain filter drop-shadow-xl"
            style={{
              mixBlendMode: 'multiply'
            }}
          />

          {/* Fallback 2D Animated Scanline */}
          {scanStage === 'scanning' && (
            <motion.div
              animate={{
                top: ['15%', '85%', '15%']
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_12px_#D4AF37]"
            />
          )}

          {/* Fallback 2D Landmark Dots */}
          {(scanStage === 'scanning' || scanStage === 'analyzing' || scanStage === 'results') &&
            LANDMARKS.map((lm) => (
              <button
                key={lm.id}
                onClick={() => handleSelectLandmark(lm.id)}
                className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4AF37] border-2 border-white shadow-md active:scale-95 transition-transform"
                style={{ top: lm.screenPos.top, left: lm.screenPos.left }}
                title={`${lm.label}: ${lm.metric}`}
              >
                <span className="sr-only">{lm.label}</span>
                <span className="absolute -inset-1 rounded-full border border-[#D4AF37]/60 animate-ping" />
              </button>
            ))}
        </motion.div>
      )}

      {/* 3. Subtle Status Hologram / Scanning State Overlay */}
      {showOverlayTelemetry && (
        <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-[#E5E7EB] shadow-xs text-[11px] font-mono">
            {scanStage === 'idle' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[#0F0F10] font-bold">OPTICAL SYSTEM READY</span>
              </>
            )}
            {scanStage === 'preparing' && (
              <>
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
                <span className="text-[#997A2E] font-bold">CALIBRATING MELANIN SENSOR</span>
              </>
            )}
            {scanStage === 'scanning' && (
              <>
                <Sparkles size={12} className="text-[#D4AF37] animate-spin" />
                <span className="text-[#997A2E] font-bold">ANALYZING FACIAL ZONES</span>
              </>
            )}
            {scanStage === 'analyzing' && (
              <>
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[#0F0F10] font-bold">PROCESSING STRATUM CORNEUM</span>
              </>
            )}
            {scanStage === 'results' && (
              <>
                <ShieldCheck size={13} className="text-emerald-600" />
                <span className="text-emerald-700 font-bold">DIAGNOSTIC COMPLETE</span>
              </>
            )}
          </div>

          {scanStage === 'scanning' && (
            <div className="px-2.5 py-1 rounded-full bg-[#0F0F10] text-white font-mono font-bold text-xs shadow-xs">
              {Math.round(scanProgress)}%
            </div>
          )}
        </div>
      )}

      {/* 4. Active Landmark Floating Tooltip Card */}
      <AnimatePresence>
        {activeLandmark && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-4 left-6 right-6 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#D4AF37]/50 shadow-xl z-20 flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                <h4 className="font-heading font-extrabold text-xs text-[#0F0F10]">
                  {activeLandmark.label}
                </h4>
              </div>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                {activeLandmark.metric}
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono font-black text-sm text-[#997A2E]">
                {activeLandmark.score}
              </span>
              <span className="text-[9.5px] uppercase font-bold text-emerald-600 block">
                Optimal
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
