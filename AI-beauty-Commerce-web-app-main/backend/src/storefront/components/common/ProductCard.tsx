import React, { useState } from 'react';
import { motion } from 'motion/react';
import { animateToBag } from '../../lib/cart-motion';
import { Heart, ShoppingBag, Star, Check } from '@phosphor-icons/react';
import { Product } from '../../types';
import { useProductActions } from '../../context/AppContext';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  variant?: 'grid' | 'rail' | 'compact';
  onQuickAdd?: () => void;
  onOpenModal?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  variant = 'grid',
  onQuickAdd,
  onOpenModal
}) => {
  const { addToCart, isWishlisted, toggleWishlist, openQuickModal } = useProductActions();
  const wishlisted = isWishlisted(product.id);
  const [justAdded, setJustAdded] = useState(false);

  const formatNaira = (amount: number) => '₦' + amount.toLocaleString('en-NG');

  const handleCardClick = () => {
    if (onOpenModal) {
      onOpenModal(product);
    } else {
      openQuickModal(product);
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If product has multiple selectable variants or modal is requested, open modal
    const hasMultipleVariants = product.sizes && product.sizes.length > 1;

    if (hasMultipleVariants) {
      if (onOpenModal) {
        onOpenModal(product);
      } else {
        openQuickModal(product);
      }
      return;
    }

    // Single simple product: add directly to cart
    const size = product.selectedSize || (product.sizes && product.sizes[0]) || 'Standard';
    if (!addToCart(product, size, 1)) return;
    animateToBag(e.currentTarget as HTMLElement, product.image);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
    if (onQuickAdd) onQuickAdd();
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const badge = /clinical/i.test(product.customBadge || '') ? '' : product.customBadge;
  const descriptor = [product.subCategory, product.category].find(value => value && !/clinical/i.test(value)) || 'Formulation';

  // Compact variant (e.g. for cart sidebars or miniature rails)
  if (variant === 'compact') {
    return (
      <div
        onClick={handleCardClick}
        className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#D4AF37]/40 transition-all cursor-pointer group active:scale-[0.99]"
      >
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#FAF9F6] shrink-0 relative">
          <ProductImage
            src={product.image}
            alt={product.name}
            sizes="64px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium truncate">
            {descriptor}
          </p>
          <h4 className="font-heading font-medium text-xs text-[#0F0F10] truncate mt-0.5">
            {product.name}
          </h4>
          <span className="font-price font-semibold text-xs text-[#0F0F10] mt-0.5 block">
            {formatNaira(product.price)}
          </span>
        </div>
        <button
          onClick={handleActionClick}
          className="w-7 h-7 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-[#0F0F10] hover:bg-[#0F0F10] hover:text-white transition-colors flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
          aria-label={`Add ${product.name} to bag`}
        >
          {justAdded ? (
            <Check size={13} weight="bold" className="text-[#D4AF37]" aria-hidden="true" />
          ) : (
            <ShoppingBag size={14} weight="fill" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }

  const isRail = variant === 'rail';

  return (
    <article
      onClick={handleCardClick}
      className={`group relative flex flex-col bg-white rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden ${
        isRail ? 'w-[200px] shrink-0' : 'w-full'
      }`}
    >
      {/* Photographic Frame (Zero hover gap: strictly clipped rounded container + GPU transform) */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#F6F5F2] rounded-2xl isolate">
        <ProductImage
          src={product.image}
          alt={product.name}
          sizes="(max-width: 768px) 50vw, 20vw"
          className="object-cover object-center will-change-transform group-hover:scale-[1.03] transition-transform duration-300 ease-out"
        />

        {product.galleryImages?.[1] && <div className="desla-product-preview absolute inset-0 pointer-events-none"><ProductImage src={product.galleryImages[1]} alt={`${product.name} — alternate view`} sizes="(max-width: 768px) 50vw, 20vw" className="object-cover" /></div>}
        {badge && (
          <span className="absolute top-3 left-3 z-10 text-[#0F0F10] text-[10px] font-mono font-medium uppercase tracking-wider opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            {badge}
          </span>
        )}

        {/* Minimal Wishlist Accent with Tactile Heart Pop */}
        <button
          type="button"
          onClick={handleWishlist}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/95 hover:bg-white backdrop-blur-xs flex items-center justify-center text-[#6B7280] hover:text-[#0F0F10] active:scale-90 transition-all cursor-pointer shadow-xs"
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={wishlisted}
        >
          <motion.span
            key={wishlisted ? 'liked' : 'idle'}
            initial={wishlisted ? { scale: 0.8 } : false}
            animate={wishlisted ? { scale: [0.85, 1.22, 0.96, 1] } : { scale: 1 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="inline-flex items-center justify-center"
          >
            <Heart
              size={15}
              weight={wishlisted ? 'fill' : 'regular'}
              className={wishlisted ? 'text-red-600' : ''}
              aria-hidden="true"
            />
          </motion.span>
        </button>
      </div>

      {/* Product Content Details (Disciplined Minimalist Hierarchy) */}
      <div className="pt-2.5 pb-1 px-0.5 flex flex-col flex-1 justify-between">
        <div>
          {/* Concise Category & Rating (500 medium supporting metadata) */}
          <div className="flex items-center justify-between text-[11px] gap-2">
            <span className="text-[#6B7280] uppercase tracking-wider text-[10px] font-medium truncate opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
              {descriptor}
            </span>
            {product.rating > 0 && (
              <div className="flex items-center gap-1 text-[#0F0F10] shrink-0 text-[11px] font-medium">
                <Star size={11} weight="fill" className="text-[#D4AF37]" aria-hidden="true" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Product Name (Manrope 500) */}
          <h3 className="font-heading font-medium text-xs sm:text-[13px] leading-snug text-[#0F0F10] line-clamp-2 mt-0.5 group-hover:text-[#997A2E] transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Pricing (600) and Cart Control */}
        <div className="pt-1.5 mt-1 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-price font-semibold text-[14px] text-[#0F0F10]">
              {formatNaira(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10.5px] font-price text-[#9CA3AF] line-through">
                {formatNaira(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Cart Icon Quick Action Control */}
          <button
            onClick={handleActionClick}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-160 active:scale-90 cursor-pointer shadow-2xs ${
              justAdded
                ? 'bg-[#0F0F10] text-[#D4AF37]'
                : 'bg-[#FAF9F6] hover:bg-[#0F0F10] text-[#0F0F10] hover:text-white border border-[#E5E7EB] hover:border-[#0F0F10]'
            }`}
            aria-label={`Add ${product.name} to bag`}
            title={product.sizes && product.sizes.length > 1 ? 'Select size' : 'Add to bag'}
          >
            {justAdded ? (
              <Check size={13} weight="bold" className="text-[#D4AF37]" aria-hidden="true" />
            ) : (
              <ShoppingBag size={14} weight="fill" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
});
ProductCard.displayName = 'ProductCard';
