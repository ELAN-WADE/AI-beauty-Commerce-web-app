import React, { useEffect, useRef } from 'react';

interface ThreeDFaceAnimationProps {
  className?: string;
}

export const ThreeDFaceAnimation: React.FC<ThreeDFaceAnimationProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angleY = 0;
    let angleX = 0.05;
    let time = 0;

    // 3D coordinates (x, y, z) of facial landmarks normalized around center (0,0,0)
    // x: [-1, 1], y: [-1.2, 1.2] (top to bottom), z: [-0.6, 0.6] (back to front)
    const vertices: { x: number; y: number; z: number; isKeyPoint?: boolean }[] = [
      // Forehead & Hairline
      { x: 0, y: -1.1, z: 0.15 },
      { x: -0.35, y: -1.0, z: 0.0 },
      { x: 0.35, y: -1.0, z: 0.0 },
      { x: -0.65, y: -0.85, z: -0.25 },
      { x: 0.65, y: -0.85, z: -0.25 },

      // Mid Forehead
      { x: 0, y: -0.8, z: 0.35, isKeyPoint: true },
      { x: -0.35, y: -0.75, z: 0.2 },
      { x: 0.35, y: -0.75, z: 0.2 },

      // Eyebrows
      { x: -0.18, y: -0.55, z: 0.38 },
      { x: -0.42, y: -0.58, z: 0.25 },
      { x: -0.65, y: -0.52, z: 0.0 },
      { x: 0.18, y: -0.55, z: 0.38 },
      { x: 0.42, y: -0.58, z: 0.25 },
      { x: 0.65, y: -0.52, z: 0.0 },

      // Eyes (Pupils & Corners)
      { x: -0.38, y: -0.38, z: 0.22, isKeyPoint: true },
      { x: -0.2, y: -0.38, z: 0.28 },
      { x: -0.55, y: -0.38, z: 0.1 },
      { x: 0.38, y: -0.38, z: 0.22, isKeyPoint: true },
      { x: 0.2, y: -0.38, z: 0.28 },
      { x: 0.55, y: -0.38, z: 0.1 },

      // Nose Bridge & Tip
      { x: 0, y: -0.45, z: 0.4 },
      { x: 0, y: -0.15, z: 0.52 },
      { x: 0, y: 0.05, z: 0.68, isKeyPoint: true }, // Nose tip
      { x: -0.16, y: 0.08, z: 0.45 },
      { x: 0.16, y: 0.08, z: 0.45 },

      // Cheekbones & Cheeks (Volume)
      { x: -0.62, y: -0.1, z: 0.18, isKeyPoint: true },
      { x: -0.38, y: 0.0, z: 0.32 },
      { x: 0.62, y: -0.1, z: 0.18, isKeyPoint: true },
      { x: 0.38, y: 0.0, z: 0.32 },

      // Sub-cheek / Mid Face
      { x: -0.45, y: 0.25, z: 0.2 },
      { x: 0.45, y: 0.25, z: 0.2 },

      // Lips
      { x: 0, y: 0.32, z: 0.5 }, // Upper lip center
      { x: -0.22, y: 0.36, z: 0.38 }, // Left lip corner
      { x: 0.22, y: 0.36, z: 0.38 }, // Right lip corner
      { x: 0, y: 0.46, z: 0.46 }, // Lower lip bottom

      // Chin & Jawline
      { x: 0, y: 0.72, z: 0.42, isKeyPoint: true }, // Chin apex
      { x: -0.25, y: 0.78, z: 0.22 },
      { x: 0.25, y: 0.78, z: 0.22 },
      { x: -0.55, y: 0.65, z: -0.05 },
      { x: 0.55, y: 0.65, z: -0.05 },
      { x: -0.72, y: 0.35, z: -0.3 }, // Jaw angle L
      { x: 0.72, y: 0.35, z: -0.3 }  // Jaw angle R
    ];

    // Connectivity matrix (Edges connecting landmarks)
    const edges: [number, number][] = [
      // Forehead
      [3, 1], [1, 0], [0, 2], [2, 4],
      [1, 6], [0, 5], [2, 7],
      [6, 5], [5, 7],

      // Eyebrow bridges
      [6, 9], [5, 20], [7, 12],
      [10, 9], [9, 8], [8, 20], [20, 11], [11, 12], [12, 13],

      // Eye surrounds
      [8, 15], [15, 14], [14, 16], [16, 9],
      [11, 18], [18, 17], [17, 19], [19, 12],

      // Nose structure
      [20, 21], [21, 22],
      [21, 23], [21, 24],
      [22, 23], [22, 24],
      [23, 26], [24, 28],

      // Cheeks & Temple
      [16, 25], [25, 26], [26, 23],
      [19, 27], [27, 28], [28, 24],
      [25, 29], [29, 32],
      [27, 30], [30, 33],

      // Mouth
      [22, 31],
      [31, 32], [31, 33],
      [32, 34], [33, 34],
      [26, 32], [28, 33],

      // Chin and Lower Contour
      [34, 35],
      [32, 36], [33, 37],
      [36, 35], [37, 35],
      [29, 38], [30, 39],
      [38, 36], [39, 37],
      [38, 40], [39, 41],
      [25, 40], [27, 41]
    ];

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      angleY = nx * 0.45;
      angleX = ny * 0.25;
    };

    canvas.addEventListener('pointermove', handlePointerMove);

    const render = () => {
      time += 0.02;
      // Gentle ambient auto-rotation oscillation
      const currentYaw = angleY + Math.sin(time * 0.6) * 0.25;
      const currentPitch = angleX + Math.cos(time * 0.4) * 0.08;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2 + 10;
      const scale = Math.min(w, h) * 0.38;
      const focalLength = 3.2;

      ctx.clearRect(0, 0, w, h);

      // Trigonometry for 3D rotation
      const cosY = Math.cos(currentYaw);
      const sinY = Math.sin(currentYaw);
      const cosX = Math.cos(currentPitch);
      const sinX = Math.sin(currentPitch);

      // Project vertices to 2D screen coordinates
      const projected = vertices.map((v) => {
        // Rotate around Y (yaw)
        const x1 = v.x * cosY + v.z * sinY;
        const z1 = -v.x * sinY + v.z * cosY;

        // Rotate around X (pitch)
        const y2 = v.y * cosX - z1 * sinX;
        const z2 = v.y * sinX + z1 * cosX;

        // Perspective projection
        const depth = focalLength / (focalLength + z2);
        const px = cx + x1 * scale * depth;
        const py = cy + y2 * scale * depth;

        return { px, py, z: z2, depth, isKeyPoint: v.isKeyPoint };
      });

      // 1. Draw glowing cosmetic facial connections
      edges.forEach(([i, j]) => {
        const p1 = projected[i];
        const p2 = projected[j];
        if (!p1 || !p2) return;

        const avgDepth = (p1.depth + p2.depth) / 2;
        const alpha = Math.max(0.12, (avgDepth - 0.6) * 0.9);

        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.strokeStyle = `rgba(184, 63, 112, ${alpha * 0.75})`;
        ctx.lineWidth = Math.max(0.7, avgDepth * 1.4);
        ctx.stroke();
      });

      // 2. Draw 3D diagnostic landmark nodes
      projected.forEach((p, idx) => {
        const radius = (p.isKeyPoint ? 3.2 : 1.8) * p.depth;
        const alpha = Math.max(0.2, (p.depth - 0.5) * 1.2);

        // Core glowing landmark
        ctx.beginPath();
        ctx.arc(p.px, p.py, Math.max(1, radius), 0, Math.PI * 2);
        ctx.fillStyle = p.isKeyPoint
          ? `rgba(255, 255, 255, ${Math.min(1, alpha * 1.2)})`
          : `rgba(214, 51, 140, ${alpha * 0.9})`;
        ctx.fill();

        // Pulsing diagnostic rings around signature points (nose, cheeks, chin)
        if (p.isKeyPoint && [5, 14, 17, 22, 25, 27, 35].includes(idx)) {
          const pulse = (Math.sin(time * 2 + idx) + 1) * 2;
          ctx.beginPath();
          ctx.arc(p.px, p.py, radius + 3 + pulse, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(184, 63, 112, ${Math.max(0.1, 0.45 - pulse * 0.08)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // 3. Subtle animated scanning line
      const scanY = cy + Math.sin(time * 1.2) * (scale * 0.95);
      const scanGrad = ctx.createLinearGradient(cx - scale, scanY, cx + scale, scanY);
      scanGrad.addColorStop(0, 'rgba(184, 63, 112, 0)');
      scanGrad.addColorStop(0.5, 'rgba(255, 128, 171, 0.45)');
      scanGrad.addColorStop(1, 'rgba(184, 63, 112, 0)');

      ctx.beginPath();
      ctx.moveTo(cx - scale * 0.9, scanY);
      ctx.lineTo(cx + scale * 0.9, scanY);
      ctx.strokeStyle = scanGrad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        width={260}
        height={260}
        className="w-full h-full object-contain pointer-events-auto cursor-grab active:cursor-grabbing select-none"
        title="Interactive 3D Skin Scan Diagnostics"
      />
    </div>
  );
};
