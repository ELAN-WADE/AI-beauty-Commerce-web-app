import React, { useState } from 'react';
import { Heart, Plus, Star, Check, MapPin, Eye } from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';

interface ProductCardProps {
  product: Product;
  variant?: 'grid' | 'rail' | 'compact';
  onQuickAdd?: () => void;
  onOpenModal?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = 'grid',
  onQuickAdd,
  onOpenModal
}) => {
  const { viewProductDetails, addToCart, isWishlisted, toggleWishlist, selectedCity } = useApp();
  const wishlisted = isWishlisted(product.id);
  const [justAdded, setJustAdded] = useState(false);

  const formatNaira = (amount: number) => '₦' + amount.toLocaleString('en-NG');

  const handleCardClick = () => {
    if (onOpenModal) {
      onOpenModal(product);
    } else {
      viewProductDetails(product);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenModal) {
      onOpenModal(product);
      return;
    }
    addToCart(product, product.selectedSize || product.sizes[0], 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
    if (onQuickAdd) onQuickAdd();
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  // Check local city availability
  const localStock = product.distributorStock?.find(
    (s) => s.city.toLowerCase() === selectedCity.toLowerCase() && s.available
  );

  // Discount percentage calculation
  const discountPct = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : product.discountPercentage || 0;

  if (variant === 'compact') {
    return (
      <div
        onClick={handleCardClick}
        className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#D4AF37]/50 hover:shadow-sm transition-all cursor-pointer group active-press"
      >
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#F6F5F2] shrink-0 relative">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[9.5px] font-mono font-semibold text-[#997A2E] uppercase">
              {product.sku || 'DESLA!'}
            </span>
            {localStock && (
              <span className="text-[9px] text-[#0F0F10] font-semibold flex items-center gap-0.5">
                • In Stock {selectedCity}
              </span>
            )}
          </div>
          <h4 className="font-heading font-semibold text-xs text-[#0F0F10] truncate mt-0.5">
            {product.name}
          </h4>
          <span className="font-price font-semibold text-sm text-[#0F0F10] mt-0.5 block">
            {formatNaira(product.price)}
          </span>
        </div>
        <button
          onClick={handleQuickAdd}
          className="w-8 h-8 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] text-[#0F0F10] hover:bg-[#D4AF37] hover:text-[#0F0F10] transition-colors flex items-center justify-center shrink-0 active-press cursor-pointer"
          aria-label={`Add ${product.name} to bag`}
        >
          {justAdded ? <Check size={14} className="stroke-[3] text-[#0F0F10]" /> : <Plus size={16} strokeWidth={2.2} />}
        </button>
      </div>
    );
  }

  const isRail = variant === 'rail';

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col bg-white rounded-2xl border border-transparent hover:border-[#E5E7EB] hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden active-press ${
        isRail ? 'w-[195px] shrink-0' : 'w-full'
      }`}
    >
      {/* Borderless Product Image Frame on clean light-neutral container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F6F5F2] rounded-xl">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1608248597359-0c679234b4c7?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Clinical & Formulation Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.isBestseller ? (
            <span className="px-2.5 py-0.5 rounded-full bg-[#0F0F10]/90 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/30 text-[9px] font-mono font-bold uppercase tracking-wider shadow-xs">
              Apothecary Choice
            </span>
          ) : product.isNew ? (
            <span className="px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[#0F0F10] border border-white/80 text-[9px] font-mono font-semibold tracking-tight shadow-xs">
              New Formulation
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[#4B5563] border border-white/80 text-[9px] font-mono font-semibold tracking-tight shadow-xs">
              Clinical Lab
            </span>
          )}
        </div>

        {/* Wishlist Heart Button with Frosted Dew Glass */}
        <button
          onClick={handleWishlist}
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-white/85 backdrop-blur-md shadow-xs border border-white/80 flex items-center justify-center text-[#6B7280] hover:text-[#D4AF37] active:scale-90 transition-all cursor-pointer"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={13}
            strokeWidth={2}
            className={wishlisted ? 'text-[#D4AF37] fill-[#D4AF37]' : ''}
          />
        </button>

        {/* Hover Quick-Add Action Pill */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            onClick={handleQuickAdd}
            className="w-full py-2 px-3 rounded-full bg-[#0F0F10]/90 backdrop-blur-md hover:bg-[#D4AF37] text-white hover:text-[#0F0F10] text-xs font-heading font-semibold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-white/20"
          >
            {justAdded ? (
              <>
                <Check size={13} strokeWidth={3} className="text-[#D4AF37]" />
                <span>Added to Bag</span>
              </>
            ) : (
              <>
                <Plus size={13} strokeWidth={2.5} />
                <span>Quick View &amp; Add</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="pt-3 pb-3 px-3 flex flex-col flex-1 justify-between space-y-1.5">
        <div>
          {/* Brand & Star Rating */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-mono text-[#997A2E] uppercase tracking-wider font-semibold">
              {product.sku || 'DESLA!™'}
            </span>
            <div className="flex items-center gap-1 text-[#D4AF37]">
              <Star size={11} fill="currentColor" strokeWidth={0} />
              <span className="font-semibold text-[#0F0F10]">{product.rating}</span>
              <span className="text-[#9CA3AF]">({product.reviewsCount || 482})</span>
            </div>
          </div>

          {/* Product Title */}
          <h3 className="font-heading font-medium text-[13px] leading-snug text-[#0F0F10] line-clamp-2 min-h-[36px] mt-1 group-hover:text-[#997A2E] transition-colors">
            {product.name}
          </h3>

          {/* Local Stock Indicator Tag */}
          <div className="mt-1 flex items-center gap-1 text-[10.5px]">
            {localStock ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF9F6] border border-[#E5E7EB] text-[#0F0F10] text-[10px] font-medium truncate">
                <MapPin size={10} className="shrink-0 text-[#997A2E]" />
                <span>In Stock: {selectedCity} Hub</span>
              </span>
            ) : (
              <span className="text-[#9CA3AF] text-[10px] truncate">
                Lagos Central Lab Dispatch
              </span>
            )}
          </div>
        </div>

        {/* Pricing and Action */}
        <div className="pt-2 border-t border-[#F3F4F6] flex items-center justify-between gap-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-price font-bold text-base leading-[20px] text-[#0F0F10]">
              {formatNaira(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[11px] font-price text-[#9CA3AF] line-through">
                {formatNaira(product.originalPrice)}
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xs ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-white hover:bg-[#D4AF37] text-[#0F0F10] hover:text-[#0F0F10] border border-[#E5E7EB] hover:border-[#D4AF37]'
            }`}
            aria-label={`Add ${product.name} to bag`}
          >
            {justAdded ? <Check size={12} strokeWidth={3} /> : <Plus size={14} strokeWidth={2.2} />}
          </button>
        </div>
      </div>
    </div>
  );
};
