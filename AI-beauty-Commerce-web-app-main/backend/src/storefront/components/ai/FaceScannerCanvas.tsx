import React, { useEffect, useRef, useState } from 'react';

interface FaceScannerCanvasProps {
  isScanning: boolean;
  scanProgress: number; // 0 to 100
  onScanComplete?: () => void;
}

export const FaceScannerCanvas: React.FC<FaceScannerCanvasProps> = ({
  isScanning,
  scanProgress,
  onScanComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeZone, setActiveZone] = useState<string>('Initializing Neural Mesh...');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let frame = 0;

    // Landmark nodes relative coords (x: 0-1, y: 0-1)
    const baseLandmarks = [
      // Forehead
      { x: 0.35, y: 0.28, label: 'Frontal Pole' },
      { x: 0.50, y: 0.24, label: 'Glabella' },
      { x: 0.65, y: 0.28, label: 'Frontal Pole R' },
      // Eyebrows
      { x: 0.30, y: 0.36, label: 'Brow L' },
      { x: 0.42, y: 0.35, label: 'Nasion L' },
      { x: 0.58, y: 0.35, label: 'Nasion R' },
      { x: 0.70, y: 0.36, label: 'Brow R' },
      // Eyes
      { x: 0.34, y: 0.42, label: 'Left Pupil' },
      { x: 0.66, y: 0.42, label: 'Right Pupil' },
      // Nose bridge and tip
      { x: 0.50, y: 0.45, label: 'Rhinion' },
      { x: 0.50, y: 0.56, label: 'Pronasale (T-Zone)' },
      { x: 0.44, y: 0.57, label: 'Alar L' },
      { x: 0.56, y: 0.57, label: 'Alar R' },
      // Cheeks (Hydration & Tone)
      { x: 0.28, y: 0.54, label: 'Zygomatic L' },
      { x: 0.72, y: 0.54, label: 'Zygomatic R' },
      { x: 0.32, y: 0.63, label: 'Buccal Zone L' },
      { x: 0.68, y: 0.63, label: 'Buccal Zone R' },
      // Lips / Mouth
      { x: 0.40, y: 0.70, label: 'Cheilion L' },
      { x: 0.50, y: 0.68, label: 'Labiale Superius' },
      { x: 0.60, y: 0.70, label: 'Cheilion R' },
      { x: 0.50, y: 0.76, label: 'Labiale Inferius' },
      // Jawline / Chin
      { x: 0.24, y: 0.68, label: 'Gonion L' },
      { x: 0.35, y: 0.82, label: 'Mandible L' },
      { x: 0.50, y: 0.88, label: 'Gnathion (Chin)' },
      { x: 0.65, y: 0.82, label: 'Mandible R' },
      { x: 0.76, y: 0.68, label: 'Gonion R' }
    ];

    // Landmark mesh connections
    const meshEdges = [
      [0, 1], [1, 2], [3, 4], [4, 5], [5, 6],
      [4, 9], [5, 9], [9, 10], [10, 11], [10, 12],
      [7, 13], [8, 14], [13, 15], [14, 16],
      [11, 17], [12, 19], [17, 18], [18, 19], [19, 20], [20, 17],
      [15, 22], [16, 24], [21, 22], [22, 23], [23, 24], [24, 25]
    ];

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Current scanline position (0 to 1)
      const scanY = isScanning
        ? ((Math.sin(frame * 0.04) + 1) / 2) * h
        : (scanProgress / 100) * h;

      // Update active zone text according to scan progress
      if (scanProgress < 25) {
        setActiveZone('Mapping Stratum Corneum & T-Zone...');
      } else if (scanProgress < 50) {
        setActiveZone('Quantifying Cellular Hydration & Trans-Epidermal Loss...');
      } else if (scanProgress < 75) {
        setActiveZone('Assessing Sebum Secretion & Pore Elasticity...');
      } else {
        setActiveZone('Evaluating UV Melanin Dispersion & Barrier Health...');
      }

      // 1. Draw Mesh Lines with subtle pulsation (Imperial Gold Palette)
      ctx.lineWidth = 1;
      meshEdges.forEach(([from, to]) => {
        const p1 = baseLandmarks[from];
        const p2 = baseLandmarks[to];
        if (!p1 || !p2) return;

        const x1 = p1.x * w;
        const y1 = p1.y * h + Math.sin(frame * 0.05 + from) * 2;
        const x2 = p2.x * w;
        const y2 = p2.y * h + Math.sin(frame * 0.05 + to) * 2;

        const distToScan = Math.abs((y1 + y2) / 2 - scanY);
        const intensity = Math.max(0.2, 1 - distToScan / 80);

        ctx.strokeStyle = `rgba(212, 175, 55, ${intensity * 0.85})`;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      // 2. Draw Landmark Dots & Focus Rings
      baseLandmarks.forEach((pt, idx) => {
        const x = pt.x * w;
        const y = pt.y * h + Math.sin(frame * 0.05 + idx) * 2;
        const isNearScan = Math.abs(y - scanY) < 40;

        // Base node
        ctx.beginPath();
        ctx.arc(x, y, isNearScan ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isNearScan ? '#FFFFFF' : 'rgba(212, 175, 55, 0.95)';
        ctx.fill();

        // Pulsing ring around key zones
        if ([1, 10, 13, 14, 23].includes(idx)) {
          const pulse = (Math.sin(frame * 0.08 + idx) + 1) * 3;
          ctx.beginPath();
          ctx.arc(x, y, 7 + pulse, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.55)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      });

      // 3. Draw Animated Laser Scan Line with Imperial Gold gradient glow
      if (isScanning || scanProgress < 100) {
        const grad = ctx.createLinearGradient(0, scanY - 35, 0, scanY + 35);
        grad.addColorStop(0, 'rgba(212, 175, 55, 0)');
        grad.addColorStop(0.5, 'rgba(212, 175, 55, 0.5)');
        grad.addColorStop(1, 'rgba(212, 175, 55, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, scanY - 35, w, 70);

        // Bright laser core line
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(w, scanY);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#D4AF37';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isScanning, scanProgress]);

  return (
    <div className="relative w-full aspect-[3/4] max-w-md mx-auto rounded-3xl overflow-hidden bg-[#09090B] shadow-2xl border border-[#D4AF37]/35">
      {/* Background Face Model Visual */}
      <img
        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80"
        alt="Facial Diagnostics Simulation"
        className="w-full h-full object-cover opacity-60 filter contrast-105"
      />

      {/* Interactive Mesh Canvas Overlay */}
      <canvas
        ref={canvasRef}
        width={360}
        height={480}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Top Status Telemetry HUD */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between text-[11px] font-mono text-white/90 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold text-[#D4AF37]">NEURAL SCAN ACTIVE</span>
        </div>
        <span className="font-bold text-[#D4AF37]">{Math.round(scanProgress)}%</span>
      </div>

      {/* Target Telemetry Pins in Viewport */}
      <div className="absolute top-[28%] left-4 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#D4AF37]/60 text-[10px] text-white">
        <span className="text-[#D4AF37] font-bold">T-ZONE:</span> Sebum 74%
      </div>

      <div className="absolute top-[52%] right-4 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#D4AF37]/60 text-[10px] text-white">
        <span className="text-[#D4AF37] font-bold">CHEEK:</span> Hydration 62%
      </div>

      <div className="absolute bottom-14 left-4 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-emerald-400/60 text-[10px] text-white">
        <span className="text-emerald-300 font-bold">BARRIER:</span> Resilience 81%
      </div>

      {/* Bottom Live Diagnostic Tracker Label */}
      <div className="absolute bottom-3 left-3 right-3 bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-center">
        <p className="font-mono text-xs text-white tracking-wide truncate">
          {activeZone}
        </p>
        <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#D4AF37] to-[#997A2E] transition-all duration-300"
            style={{ width: `${scanProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
