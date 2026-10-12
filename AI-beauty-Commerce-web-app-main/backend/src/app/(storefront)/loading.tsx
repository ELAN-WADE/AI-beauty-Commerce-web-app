/**
 * Phase 2 — instant streaming shell for ISR storefront routes.
 * Shown only while the RSC payload streams (slow networks); the loaded
 * screens are pixel-identical to before. Brand-matched gold shimmer.
 */
export default function StorefrontLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading Desla"
      className="min-h-[70vh] w-full bg-[#FFFFFF] flex flex-col items-center justify-center gap-6 px-8"
    >
      <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-[#D4AF37] animate-pulse" />
      </div>
      <div className="w-full max-w-sm flex flex-col gap-3">
        <div className="animate-gold-shimmer h-48 rounded-card bg-[#F6F5F2]" />
        <div className="animate-gold-shimmer h-4 rounded-full bg-[#F3F4F6] w-3/4" />
        <div className="animate-gold-shimmer h-4 rounded-full bg-[#F3F4F6] w-1/2" />
        <div className="animate-gold-shimmer h-11 rounded-btn bg-[#FBF5E8]" />
      </div>
    </div>
  );
}
