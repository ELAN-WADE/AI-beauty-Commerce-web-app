import React, { useState } from 'react';
import { X, Check, ShoppingBag, Star, ArrowRight, ShieldCheck } from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';

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
  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes?.[0] || '100ml');
  const [quantity, setQuantity] = useState<number>(1);
  const [justAdded, setJustAdded] = useState<boolean>(false);

  // Sync selected size when product changes
  React.useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes?.[0] || 'Standard');
      setQuantity(1);
      setJustAdded(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  const handleAddToCart = () => {
    addToCart(product, selectedSize, quantity);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      onClose();
    }, 1100);
  };

  const handleViewFullDetails = () => {
    onClose();
    viewProductDetails(product);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-body transition-transform animate-in slide-in-from-bottom duration-250"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-white/90 hover:bg-[#F3F4F6] text-[#0F0F10] border border-[#E5E7EB] shadow-xs active:scale-90 transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X size={18} strokeWidth={2.2} />
        </button>

        {/* Dual Grid Layout: Product on one side, details on other */}
        <div className="grid grid-cols-1 sm:grid-cols-2 overflow-y-auto">
          {/* Left Column: Product Photo & Badges */}
          <div className="relative bg-[#FBF9F5] p-6 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-[#E5E7EB] min-h-[220px] sm:min-h-[340px]">
            <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-2xl overflow-hidden bg-white p-2 shadow-xs border border-[#E5E7EB]/80 flex items-center justify-center">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>

            {/* Quick Badge */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FAF9F6] border border-[#D4AF37]/50 text-[#997A2E] text-[10px] font-mono font-bold uppercase tracking-wider">
                {product.category}
              </span>
              {product.isBestseller && (
                <span className="px-2 py-0.5 rounded-full bg-[#0F0F10] text-[#D4AF37] text-[9.5px] font-bold uppercase tracking-tight">
                  #1 Best Seller
                </span>
              )}
            </div>

            {/* Clinical Trust Signal */}
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-[#4B5563]">
              <ShieldCheck size={14} className="text-[#D4AF37]" />
              <span>100% NAFDAC Authentic Formulation</span>
            </div>
          </div>

          {/* Right Column: Formulation Details & Quick Add */}
          <div className="p-5 sm:p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h2 className="font-heading font-extrabold text-lg sm:text-xl text-[#0F0F10] tracking-tight leading-snug">
                {product.name}
              </h2>

              {/* Rating Strip */}
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <div className="flex items-center text-[#D4AF37]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <span className="font-bold text-[#0F0F10] text-xs">{product.rating}</span>
                <span>•</span>
                <span className="text-[11px] text-[#6B7280]">
                  {product.reviewsCount + 120} verified reviews
                </span>
              </div>

              {/* Price Block */}
              <div className="flex items-baseline gap-2.5 pt-1">
                <span className="font-price font-extrabold text-2xl text-[#0F0F10]">
                  {formatNaira(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xs font-mono text-[#9CA3AF] line-through">
                    {formatNaira(product.originalPrice)}
                  </span>
                )}
                {product.discountPercentage && product.discountPercentage > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold">
                    Save {product.discountPercentage}%
                  </span>
                )}
              </div>

              {/* Brief Description */}
              <p className="text-xs text-[#4B5563] leading-relaxed line-clamp-3 pt-1">
                {product.description}
              </p>
            </div>

            {/* Dosage / Size Swatches */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-[#0F0F10] flex justify-between">
                <span>Clinical Dosage / Size</span>
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                        isSelected
                          ? 'border-[#0F0F10] bg-[#0F0F10] text-white shadow-xs font-bold'
                          : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-gray-400'
                      }`}
                    >
                      <span>{size}</span>
                      {isSelected && <Check size={12} strokeWidth={2.6} className="text-[#D4AF37]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Stepper & Add to Bag */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5">
                {/* Stepper */}
                <div className="flex items-center rounded-xl border border-[#E5E7EB] bg-[#FAF9F6] px-2.5 py-1.5">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1 rounded-lg text-[#0F0F10] hover:bg-white active:scale-90 transition-all cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-mono font-bold text-xs text-[#0F0F10]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-1 rounded-lg text-[#0F0F10] hover:bg-white active:scale-90 transition-all cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {/* Primary Add CTA */}
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#0F0F10] hover:bg-[#D4AF37] text-white hover:text-[#0F0F10] font-heading font-bold text-xs sm:text-sm tracking-wide shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
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

              {/* View Full Clinical Dossier */}
              <button
                onClick={handleViewFullDetails}
                className="w-full text-center text-xs font-bold text-[#997A2E] hover:underline flex items-center justify-center gap-1 pt-1 cursor-pointer"
              >
                <span>View Full Formulation Dossier &amp; Reviews</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
