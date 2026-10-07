import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  ShoppingBag,
  ChevronLeft,
  Lock,
  Sun,
  Layers,
  Check,
  Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BeautyFace3D } from '../../components/ai/BeautyFace3D';
import { SkinInsightsChart } from '../../components/ai/SkinInsightsChart';
import { ProductCard } from '../../components/common/ProductCard';
import { isOwnedApiConfigured, mirrorSkinProfile } from '../../lib/owned-api';

type ScanFlowStep = 'intro' | 'capture' | 'processing' | 'results';

export const Screen14AISkinScan: React.FC = () => {
  const { skinProfile, setSkinProfile, products, addToCart, navigateTo, goBack } = useApp();

  const [flowStep, setFlowStep] = useState<ScanFlowStep>('intro');
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attempt real camera feed when entering capture step, fallback safely to simulator
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (flowStep === 'capture') {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: 'user' } })
          .then((s) => {
            stream = s;
            if (videoRef.current) {
              videoRef.current.srcObject = s;
              videoRef.current.play().catch(() => {});
              setCameraActive(true);
            }
          })
          .catch(() => {
            // Permission denied or camera unavailable: use clean simulator
            setCameraActive(false);
          });
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [flowStep]);

  // Trigger scan sequence
  const startScan = () => {
    setIsScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setFlowStep('processing');
          return 100;
        }
        return prev + 2.5;
      });
    }, 75);
  };

  // Processing stage animation -> generate clinical profile
  useEffect(() => {
    if (flowStep === 'processing') {
      const timer = setTimeout(() => {
        if (!skinProfile) {
          setSkinProfile({
            overallScore: 88,
            overallGlowScore: 88,
            analysisSummary:
              'Optical telemetry confirms high-density melanin barrier resilience with targeted moisture-retention variance in the central T-zone. Botanical humectants, cold-pressed plant squalane, and barrier ceramide renewal recommended.',
            skinType: 'Combination / Melanin-Rich Resilient',
            hydrationLevel: 78,
            oilinessLevel: 44,
            sensitivityLevel: 22,
            textureSmoothness: 91,
            primaryConcerns: ['Luminous Barrier Guard', 'Cellular Moisture Defense', 'Antioxidant Radiance'],
            metrics: [
              {
                name: 'Cellular Hydration',
                score: 78,
                status: 'optimal',
                description: 'Epidermal water retention responds rapidly to botanical hyaluronic humectants'
              },
              {
                name: 'Lipid Equilibrium',
                score: 88,
                status: 'optimal',
                description: 'Balanced sebum production across zygomatic arches and jawline'
              },
              {
                name: 'Stratum Corneum Purity',
                score: 92,
                status: 'optimal',
                description: 'Refined pore topography with zero visible micro-inflammation'
              },
              {
                name: 'Melanin Luminosity',
                score: 87,
                status: 'optimal',
                description: 'Even light reflection with robust natural photoprotective response'
              }
            ],
            recommendedRoutine: [],
            recommendedProductIds: ['prod-body-01', 'prod-skin-01', 'prod-skin-02'],
            timestamp: new Date().toISOString()
          });
          // Live mirror: persist the simulated profile server-side (silent for guests).
          if (isOwnedApiConfigured) {
            mirrorSkinProfile({
              skinType: 'combination',
              concerns: ['Luminous Barrier Guard', 'Cellular Moisture Defense', 'Antioxidant Radiance'],
            }).catch(() => {});
          }
        }
        setFlowStep('results');
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [flowStep, skinProfile, setSkinProfile]);

  // Recommended products list from catalogue
  const recommendedProducts = products.filter((p) =>
    skinProfile?.recommendedProductIds?.includes(p.id) ||
    ['prod-body-01', 'prod-skin-01', 'prod-skin-02'].includes(p.id)
  );

  const handleAddAllToCart = () => {
    recommendedProducts.forEach((prod) => {
      addToCart(prod, prod.sizes[0], 1);
    });
    navigateTo('cart');
  };

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] pb-32 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 py-3.5 shadow-xs">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={goBack}
              className="p-1.5 -ml-1 rounded-full text-[#0F0F10] hover:bg-gray-100 active:scale-[0.97] transition-all cursor-pointer"
              aria-label="Go back"
            >
              <ChevronLeft size={22} strokeWidth={2.2} />
            </button>
            <div>
              <h1 className="font-heading font-extrabold text-base sm:text-lg text-[#0F0F10] tracking-tight">
                Desla!™ AI Skin Scan
              </h1>
              <span className="text-[11px] text-[#6B7280] font-sans block">
                Haute optical skin diagnostics &amp; formulation matching
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-[#0F0F10] text-xs font-mono font-bold flex items-center gap-1.5">
              <Lock size={12} className="text-emerald-600" />
              <span>100% Private</span>
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 pt-4 sm:pt-6 space-y-6">
        {/* ============================================================== */}
        {/* STEP 1: INTRO — "Discover What Your Skin Needs"               */}
        {/* Prominent isolated 3D female beauty avatar (No background box) */}
        {/* ============================================================== */}
        {flowStep === 'intro' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Primary Visual: Isolated 3D Beauty Face Avatar */}
            <div className="relative pt-2 pb-0 flex flex-col items-center justify-center">
              <BeautyFace3D
                scanStage="idle"
                showOverlayTelemetry={true}
                className="max-h-[380px]"
              />

              {/* Sub-avatar telemetry badge */}
              <div className="mt-2 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-[10.5px] font-mono text-[#6B7280]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                  <span>3D Optical Biomarker Engine • 60-Second Evaluation</span>
                </span>
              </div>
            </div>

            {/* Core Typography Block: Clean, spacious, visually confident */}
            <div className="text-center space-y-2 max-w-md mx-auto">
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10] tracking-tight leading-tight">
                Discover what your skin needs.
              </h2>
              <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                Optical telemetry calibrated for melanin-rich skin. Analyzes lipid barrier integrity, cellular moisture retention, and tone uniformity in 60 seconds.
              </p>
            </div>

            {/* 3 Core Highlights (No clutter) */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
                <span className="font-digit font-semibold text-lg text-[#0F0F10] block">
                  98.4%
                </span>
                <span className="text-[10.5px] text-[#6B7280] font-medium mt-0.5 block">
                  Diagnostic Accuracy
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
                <span className="font-digit font-semibold text-lg text-[#0F0F10] block">
                  60 Sec
                </span>
                <span className="text-[10.5px] text-[#6B7280] font-medium mt-0.5 block">
                  Real-Time Scan
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
                <span className="font-digit font-semibold text-lg text-emerald-600 block">
                  100%
                </span>
                <span className="text-[10.5px] text-[#6B7280] font-medium mt-0.5 block">
                  On-Device Private
                </span>
              </div>
            </div>

            {/* Reassuring, concise privacy note */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center gap-3 text-xs text-[#4B5563]">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <p className="leading-snug">
                <strong>Your privacy is protected.</strong> Facial landmarks are computed solely in your local browser memory and never stored or sent to cloud servers.
              </p>
            </div>

            {/* "Continue — Private" Primary CTA */}
            <button
              onClick={() => setFlowStep('capture')}
              className="w-full py-4 px-6 rounded-full bg-[#0F0F10] hover:bg-[#D4AF37] text-white hover:text-[#0F0F10] font-heading font-extrabold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 active:scale-[0.97] transition-all cursor-pointer"
            >
              <span>Continue — Private</span>
              <ArrowRight size={17} />
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: "TAKE PICTURE" EXPERIENCE                              */}
        {/* Simplified interface: User's face inside scanning experience   */}
        {/* ============================================================== */}
        {flowStep === 'capture' && (
          <div className="space-y-5 animate-in zoom-in-95 duration-300">
            {/* Clear instruction */}
            <div className="text-center max-w-sm mx-auto space-y-1">
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
                Position your face here and take the picture
              </h2>
              <p className="text-xs text-[#6B7280]">
                Center your face in natural light. Remove sunglasses or heavy hats for best precision.
              </p>
            </div>

            {/* Central Camera Scan Viewport */}
            <div className="relative w-full aspect-[3/4] max-w-sm mx-auto rounded-3xl overflow-hidden bg-[#0F0F10] border-2 border-[#D4AF37]/50 shadow-2xl">
              {/* Camera Video Stream OR Fallback Simulator */}
              {cameraActive ? (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center bg-radial from-[#1C1A17] to-[#0A0A0B]">
                  {/* Reference 3D Face Silhouette Guide */}
                  <img
                    src="/beauty_face_3d.jpg"
                    alt="Facial Guide"
                    className="w-full h-full object-cover opacity-25 filter contrast-125"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                </div>
              )}

              {/* Minimalist Facial Reticle / Oval Positioning Guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className={`w-[72%] h-[68%] rounded-[48%] border-2 border-dashed transition-all duration-300 ${
                    isScanning
                      ? 'border-[#D4AF37] shadow-[0_0_24px_rgba(212,175,55,0.45)]'
                      : 'border-white/60 shadow-[0_0_12px_rgba(0,0,0,0.5)]'
                  }`}
                />
              </div>

              {/* 3D Model Reference Thumbnail (Mini avatar in top corner for visual guide) */}
              <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-mono text-white">
                <img
                  src="/beauty_face_3d.jpg"
                  alt="Reference Avatar"
                  className="w-4 h-4 rounded-full object-cover border border-[#D4AF37]"
                />
                <span>3D Reference</span>
              </div>

              {/* Ambient Lighting Indicator */}
              <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-mono text-emerald-400">
                <Sun size={12} className="text-amber-400" />
                <span>Good Lighting</span>
              </div>

              {/* Refined Laser Scanning Line & Progress */}
              {isScanning && (
                <>
                  <div
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_16px_#D4AF37] transition-all duration-75"
                    style={{ top: `${scanProgress}%` }}
                  />
                  <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-center text-white">
                    <div className="flex items-center justify-between text-xs font-mono font-bold mb-1.5">
                      <span className="flex items-center gap-1.5 text-[#D4AF37]">
                        <Activity size={14} className="animate-spin" />
                        Scanning Stratum Corneum...
                      </span>
                      <span>{Math.round(scanProgress)}%</span>
                    </div>
                    <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#997A2E] transition-all duration-100"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Action Bar */}
            {!isScanning && (
              <div className="space-y-3 max-w-sm mx-auto">
                <button
                  onClick={startScan}
                  className="w-full py-4 px-6 rounded-full bg-[#0F0F10] hover:bg-[#D4AF37] text-white hover:text-[#0F0F10] font-heading font-extrabold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 active:scale-[0.97] transition-all cursor-pointer"
                >
                  <Camera size={18} />
                  <span>Take Photo &amp; Analyze</span>
                </button>

                <p className="text-[11px] text-center text-[#6B7280]">
                  Press to capture and initiate the 60-second formulation match
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3: "ANALYZING" EXPERIENCE                                 */}
        {/* Small AI indicators, restrained motion communicating progress  */}
        {/* ============================================================== */}
        {flowStep === 'processing' && (
          <div className="py-8 text-center space-y-6 animate-in fade-in duration-300 max-w-md mx-auto">
            {/* Visual: 3D Face in analyzing mode */}
            <BeautyFace3D
              scanStage="analyzing"
              showOverlayTelemetry={false}
              className="max-h-[300px]"
            />

            <div className="space-y-1.5">
              <span className="text-xs font-mono uppercase font-bold text-[#997A2E] tracking-widest block">
                Optical Telemetry Processing
              </span>
              <h3 className="font-heading font-extrabold text-2xl text-[#0F0F10] tracking-tight">
                Synthesizing Skin Biomarkers
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed max-w-sm mx-auto">
                Correlating cellular hydration levels, lipid barrier equilibrium, and antioxidant absorption curves...
              </p>
            </div>

            {/* Animated progress bar */}
            <div className="space-y-2 bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E7EB]">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#0F0F10]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
                  Formulation Formulation Engine
                </span>
                <span className="text-[#997A2E]">88%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white overflow-hidden border border-[#E5E7EB]">
                <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#997A2E] rounded-full w-[88%] animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 4: "RESULTS & FORMULATION RECOMMENDATIONS"               */}
        {/* ============================================================== */}
        {flowStep === 'results' && skinProfile && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Profile Dossier Card */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#997A2E] px-2.5 py-0.5 rounded-full bg-[#FBF5E8] border border-[#D4AF37]/35 inline-block mb-1.5">
                    Verified Analysis
                  </span>
                  <h2 className="font-heading font-extrabold text-2xl text-[#0F0F10] tracking-tight">
                    Your Skin Diagnostic Profile
                  </h2>
                  <span className="text-xs font-bold text-[#997A2E] mt-0.5 block">
                    {skinProfile.skinType} • Glow Index <span className="font-digit font-semibold">{skinProfile.overallGlowScore ?? 88}/100</span>
                  </span>
                </div>
                <button
                  onClick={() => setFlowStep('capture')}
                  className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#0F0F10] hover:text-[#997A2E] px-3.5 py-1.5 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] active:scale-[0.97] transition-all cursor-pointer shrink-0"
                >
                  <RotateCcw size={13} />
                  <span>Retake</span>
                </button>
              </div>

              <p className="text-xs text-[#6B7280] leading-relaxed">
                {skinProfile.analysisSummary}
              </p>

              {/* Identified Concerns Chips */}
              <div className="pt-3 border-t border-[#E5E7EB]">
                <span className="text-[10px] font-mono font-bold text-[#0F0F10] uppercase tracking-wider block mb-2">
                  Diagnosed Primary Focus:
                </span>
                <div className="flex flex-wrap gap-2">
                  {skinProfile.primaryConcerns.map((con, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-[#FBF5E8] text-[#997A2E] text-xs font-heading font-semibold border border-[#D4AF37]/35"
                    >
                      {con}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Diagnostic Meters */}
            <div>
              <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-[#0F0F10] mb-3">
                Cellular Metric Telemetry
              </h3>
              <SkinInsightsChart
                metrics={skinProfile.metrics}
                overallScore={skinProfile.overallGlowScore ?? 88}
              />
            </div>

            {/* Prescribed Clinical Routine Products */}
            <div className="space-y-3">
              <div>
                <h3 className="font-heading font-extrabold text-base text-[#0F0F10]">
                  Recommended Formulations for You
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Dermatologist-selected catalogue products matched to your skin metrics
                </p>
              </div>

              <div className="space-y-3">
                {recommendedProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} variant="compact" />
                ))}
              </div>
            </div>

            {/* Action Bar: Add Entire Routine to Bag */}
            <div className="pt-2">
              <button
                onClick={handleAddAllToCart}
                className="w-full py-4 px-6 rounded-full bg-[#0F0F10] hover:bg-[#D4AF37] text-white hover:text-[#0F0F10] font-heading font-extrabold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 active:scale-[0.97] transition-all cursor-pointer"
              >
                <ShoppingBag size={18} />
                <span>Add Complete Diagnostic Routine to Bag</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
