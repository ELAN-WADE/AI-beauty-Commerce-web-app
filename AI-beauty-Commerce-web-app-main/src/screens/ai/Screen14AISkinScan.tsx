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
import { useFaceScan } from '../../lib/use-face-scan';

type ScanFlowStep = 'intro' | 'capture' | 'processing' | 'results';

export const Screen14AISkinScan: React.FC = () => {
  const { products, addToCartBatch, navigateTo, goBack } = useApp();
  const { flowStep, setFlowStep, videoRef, cameraActive, capturedImage, consent, setConsent, available, error, uploadPhoto, startScan, retake, assessment } = useFaceScan();
  const isScanning = false;
  const scanProgress = 0;
  const skinProfile = assessment ? { skinType: assessment.result.skinType, overallGlowScore: null, analysisSummary: assessment.result.summary + ' ' + assessment.result.limitations, primaryConcerns: assessment.result.observations, metrics: [] } : null;
  const recommendedProducts = products.filter(product => assessment?.recommendations.some(item => item.slug === product.id && item.available > 0));
  const handleAddAllToCart = () => { if (addToCartBatch(recommendedProducts.map(product => ({ product, size: product.sizes[0], quantity: 1 })))) navigateTo('cart'); };

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] pb-32 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      <main className="max-w-xl mx-auto px-4 pt-4 sm:pt-6 space-y-6">
        {/* Subtle Back Navigation */}
        <div className="hidden lg:flex items-center justify-between">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#0F0F10] transition-colors cursor-pointer active-press py-1"
            aria-label="Back"
          >
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>
        </div>
        {available === false && <p role="status" className="hidden lg:block rounded-2xl border border-[#E5E7EB] bg-[#FAF9F6] p-4 text-xs text-[#6B7280]">Skin analysis is temporarily unavailable while the service is being connected. You can still explore the scan interface and catalogue.</p>}
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
        {/* ============================================================== */}
        {/* STEP 1: INTRO — "Discover What Your Skin Needs"               */}
        {/* Prominent isolated 3D female beauty avatar (No background box) */}
        {/* ============================================================== */}
        {flowStep === 'intro' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Primary Visual: Isolated 3D Beauty Face Avatar */}
            <div className="relative pt-0 pb-0 flex flex-col items-center justify-center">
              <BeautyFace3D
                scanStage="idle"
                showOverlayTelemetry={false}
                className="max-h-[380px]"
              />
            </div>

            {/* Core Typography Block: Clean, spacious, visually confident */}
            <div className="text-center space-y-2 max-w-md mx-auto">
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10] tracking-tight leading-tight">
                Discover what your skin needs.
              </h2>
              <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                Explore visible cosmetic observations from your photo, with product suggestions from our catalogue.
              </p>
            </div>

            {/* 3 Core Highlights (No clutter) */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
                <span className="font-digit font-semibold text-lg text-[#0F0F10] block">
                  Photo
                </span>
                <span className="text-[10.5px] text-[#6B7280] font-medium mt-0.5 block">
                  Cosmetic Observations
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
                <span className="font-digit font-semibold text-lg text-[#0F0F10] block">
                  AI
                </span>
                <span className="text-[10.5px] text-[#6B7280] font-medium mt-0.5 block">
                  Photo Assessment
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
                <span className="font-digit font-semibold text-lg text-emerald-600 block">
                  Consent
                </span>
                <span className="text-[10.5px] text-[#6B7280] font-medium mt-0.5 block">
                  Shared with consent
                </span>
              </div>
            </div>

            {/* Reassuring, concise privacy note */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center gap-3 text-xs text-[#4B5563]">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <p className="leading-snug">
                <strong>Your privacy is protected.</strong> Your photo is shared with Google Gemini only after consent. Desla does not store this photo. Cosmetic observations are not a medical diagnosis.
              </p>
            </div>

            {/* "Continue — Private" Primary CTA */}
            <button
              onClick={retake}
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
              {capturedImage && !cameraActive ? <img src={capturedImage} alt="Your selected face photo" className="w-full h-full object-cover" /> : cameraActive ? (
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
                    src="/beauty_face_3d.png"
                    alt="Facial Guide"
                    className="w-full h-full object-contain opacity-35 filter contrast-125"
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
                  src="/beauty_face_3d.png"
                  alt="Reference Avatar"
                  className="w-4 h-4 rounded-full object-cover border border-[#D4AF37]"
                />
                <span>3D Reference</span>
              </div>

              {/* Ambient Lighting Indicator */}
              <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-mono text-emerald-400">
                <Sun size={12} className="text-amber-400" />
                <span>Use Even Lighting</span>
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

            <div className="space-y-3 max-w-sm mx-auto">
              <label className="block text-xs text-[#6B7280]">Or upload your photo<input aria-label="Upload face photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => void uploadPhoto(event.target.files?.[0])} className="mt-2 block w-full text-xs" /></label>
              <label className="flex items-start gap-2 text-xs text-[#6B7280]"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-0.5" /><span>I consent to sending my photo to Google Gemini for a cosmetic assessment. Desla does not save this photo.</span></label>
            </div>
            {/* Action Bar */}
            {!isScanning && (
              <div className="space-y-3 max-w-sm mx-auto">
                <button
                  onClick={() => void startScan()}
                  disabled={available !== true || !consent}
                  className="w-full py-4 px-6 rounded-full bg-[#0F0F10] hover:bg-[#D4AF37] text-white hover:text-[#0F0F10] font-heading font-extrabold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 active:scale-[0.97] transition-all cursor-pointer"
                >
                  <Camera size={18} />
                  <span>{available === false ? 'Analysis unavailable' : 'Take Photo & Analyze'}</span>
                </button>

                <p className="text-[11px] text-center text-[#6B7280]">
                  Press to capture and initiate the photo assessment
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
                Assessing Your Photo
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed max-w-sm mx-auto">
                Assessing your photo and matching published catalogue products...
              </p>
            </div>

            {/* Animated progress bar */}
            <div className="space-y-2 bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E7EB]">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#0F0F10]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
                  Photo assessment
                </span>
                <span className="text-[#997A2E]">Processing…</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white overflow-hidden border border-[#E5E7EB]">
                <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#997A2E] rounded-full w-full animate-pulse" />
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
                    Cosmetic assessment
                  </span>
                  <h2 className="font-heading font-extrabold text-2xl text-[#0F0F10] tracking-tight">
                    Your Skin Profile
                  </h2>
                  <span className="text-xs font-bold text-[#997A2E] mt-0.5 block">
                    {skinProfile.skinType} • Glow Index <span className="font-digit font-semibold">{skinProfile.overallGlowScore ?? '—'}</span>
                  </span>
                </div>
                <button
                  onClick={retake}
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
                  Visible cosmetic observations:
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
                Photo Assessment Details
              </h3>
              <SkinInsightsChart
                metrics={skinProfile.metrics}
                overallScore={skinProfile.overallGlowScore}
              />
            </div>

            {/* Prescribed Clinical Routine Products */}
            <div className="space-y-3">
              <div>
                <h3 className="font-heading font-extrabold text-base text-[#0F0F10]">
                  Recommended Formulations for You
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Published in-stock formulations matched to your assessment
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
