import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ShoppingBag, Star, ArrowRight, ShieldCheck, Minus, Plus } from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { ApothecaryPuritySeal } from './HandDrawnAccents';
import { ProductImage } from './ProductImage';

interface ProductQuickModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductQuickModal: React.FC<ProductQuickModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { addToCart, viewProductDetails } = useApp();
  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes?.[0] || 'Standard');
  const [quantity, setQuantity] = useState<number>(1);
  const [justAdded, setJustAdded] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Sync state on product change
  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes?.[0] || 'Standard');
      setQuantity(1);
      setJustAdded(false);
      setIsSubmitting(false);
    }
  }, [product]);

  // Lock body scroll, trap focus, handle Escape key, and return focus on close.
  useEffect(() => {
    if (!isOpen) return;
    const previousFocusedElement = document.activeElement as HTMLElement | null;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusables = modalRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
    if (focusables && focusables.length > 0) {
      focusables[0].focus();
    } else {
      modalRef.current?.focus({ preventScroll: true });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const currentFocusables = modalRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
        if (!currentFocusables || currentFocusables.length === 0) return;
        const first = currentFocusables[0];
        const last = currentFocusables[currentFocusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusedElement?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  const handleAddToCart = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      addToCart(product, selectedSize, quantity);
      setJustAdded(true);
      setTimeout(() => {
        setJustAdded(false);
        setIsSubmitting(false);
        onClose();
      }, 1100);
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  const handleViewFullDetails = () => {
    onClose();
    viewProductDetails(product);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg sm:max-w-2xl lg:max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden max-h-[88vh] sm:max-h-[85vh] flex flex-col font-body transition-transform animate-in slide-in-from-bottom duration-250"
      >
        {/* Accessible Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/5 hover:bg-black/10 text-[#0F0F10] active:scale-95 transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} strokeWidth={2} />
        </button>

        {/* Dual Grid Layout: Product packshot left, details right */}
        <div className="grid grid-cols-1 sm:grid-cols-2 overflow-y-auto">
          {/* Left Column: Bounded Product Packshot */}
          <div className="relative bg-[#FAF9F6] p-8 flex flex-col items-center justify-center min-h-[260px] sm:min-h-[400px] overflow-hidden">
            {/* Packshot Container matching aesthetic */}
            <div className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-2xl overflow-hidden bg-[#F6F5F2] shadow-sm flex items-center justify-center z-10 border border-[#E5E7EB]/60">
              <ProductImage
                src={product.image}
                alt={product.name}
                sizes="(max-width: 640px) 70vw, 300px"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[#0F0F10] text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs border border-[#E5E7EB]">
                {product.subCategory || product.category}
              </span>
              {product.isBestseller && (
                <span className="px-2.5 py-1 rounded-full bg-[#0F0F10] text-[#D4AF37] text-[9.5px] font-bold uppercase tracking-tight">
                  #1 Best Seller
                </span>
              )}
            </div>

            {/* Authenticity Guarantee */}
            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-[#737373]">
              <ShieldCheck size={14} className="text-[#997A2E]" />
              <span>NAFDAC Authentic Formulation</span>
            </div>
          </div>

          {/* Right Column: Formulation Details & Controls */}
          <div className="p-7 sm:p-8 flex flex-col justify-between space-y-5 min-w-0">
            <div className="space-y-2.5">
              <h2
                id="quick-add-title"
                className="font-heading font-extrabold text-xl sm:text-2xl text-[#0F0F10] tracking-tight leading-snug break-words"
              >
                {product.name}
              </h2>

              {/* Rating */}
              <div className="flex items-center gap-2 text-xs text-[#737373]">
                <div className="flex items-center text-[#D4AF37]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <span className="font-bold text-[#0F0F10] text-xs">{product.rating}</span>
                <span>•</span>
                <span className="text-[11px] text-[#737373]">
                  {product.reviewsCount ? `${product.reviewsCount} verified reviews` : 'Clinically validated'}
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2.5 pt-1">
                <span className="font-price font-extrabold text-2xl text-[#0F0F10]">
                  {formatNaira(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xs font-mono text-[#A3A3A3] line-through">
                    {formatNaira(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-[13px] text-[#525252] leading-relaxed line-clamp-3 pt-1">
                {product.description}
              </p>
            </div>

            {/* Size / Variant Options */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-[#0F0F10] flex justify-between">
                  <span>Size / Volume</span>
                  <span className="text-[#997A2E] font-mono text-[11px]">{selectedSize}</span>
                </label>

                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                          isSelected
                            ? 'bg-[#0F0F10] text-white shadow-xs font-bold'
                            : 'bg-[#F5F5F5] text-[#525252] hover:bg-[#EBEBEB]'
                        }`}
                      >
                        <span>{size}</span>
                        {isSelected && <Check size={12} strokeWidth={2.6} className="text-[#D4AF37]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Add to Bag */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center gap-3">
                {/* Stepper */}
                <div className="flex items-center rounded-full bg-[#F5F5F5] px-2.5 py-1 shrink-0 min-h-[44px]">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-[#0F0F10] hover:bg-white active:scale-90 transition-all cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-xs text-[#0F0F10]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-[#0F0F10] hover:bg-white active:scale-90 transition-all cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Primary Add CTA */}
                <button
                  onClick={handleAddToCart}
                  disabled={isSubmitting}
                  className="flex-1 min-h-[46px] py-3 px-5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white font-heading font-semibold text-xs sm:text-[13px] tracking-wide shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-75"
                >
                  {justAdded ? (
                    <>
                      <Check size={16} strokeWidth={3} className="text-emerald-400" />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={15} strokeWidth={2.2} className="text-[#D4AF37]" />
                      <span>Add • {formatNaira(product.price * quantity)}</span>
                    </>
                  )}
                </button>
              </div>

              {/* View Full Product Details Link */}
              <div className="text-center pt-1">
                <button
                  onClick={handleViewFullDetails}
                  className="text-xs font-semibold text-[#737373] hover:text-[#0F0F10] underline underline-offset-4 cursor-pointer transition-colors"
                >
                  View full formulation dossier &amp; reviews →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
