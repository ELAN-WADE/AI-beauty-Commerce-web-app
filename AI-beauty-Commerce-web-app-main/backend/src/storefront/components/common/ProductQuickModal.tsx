import { animateToBag } from '../../lib/cart-motion';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { X, Check, ShoppingBag, Star, ShieldCheck, Minus, Plus } from '@phosphor-icons/react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { ProductImage } from './ProductImage';
import { DeslaMobileDrawer, DeslaRollingNumber } from '../motion/DeslaMobileDrawer';

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
  const { addToCart, viewProductDetails, navigateTo } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (isOpen && product?.id) router.prefetch('/products/' + encodeURIComponent(product.id));
  }, [isOpen, product?.id, router]);
  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes?.[0] || 'Standard');
  const [quantity, setQuantity] = useState<number>(1);
  const [justAdded, setJustAdded] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync state on product change
  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes?.[0] || 'Standard');
      setQuantity(1);
      setJustAdded(false);
      setIsSubmitting(false);
    }
  }, [product?.id]);
  useEffect(() => {
    if (product) setSelectedSize(previous => product.sizes?.includes(previous) ? previous : product.sizes?.[0] || 'Standard');
  }, [product?.sizes?.join('|')]);

  const unitPrice = product ? (product.variants?.find(v => v.sizeLabel === selectedSize)?.priceNgn ?? product.price) : 0;
  const comparePrice = product
    ? (product.variants?.find(v => v.sizeLabel === selectedSize)?.compareAtNgn ?? product.originalPrice)
    : undefined;

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!product || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (!addToCart({ ...product, price: unitPrice }, selectedSize, quantity)) { setIsSubmitting(false); return; }
      animateToBag(event.currentTarget, product.image);
      setJustAdded(true);
      toast.success(`Added ${product.name}`, {
        description: `${selectedSize} × ${quantity} · ${formatNaira(unitPrice * quantity)}`,
        action: {
          label: 'View Bag',
          onClick: () => navigateTo('cart'),
        },
      });
      setTimeout(() => {
        setJustAdded(false);
        setIsSubmitting(false);
        onClose();
      }, 650);
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleViewFullDetails = () => {
    if (!product) return;
    onClose();
    viewProductDetails(product);
  };

  if (!product) return null;

  return (
    <DeslaMobileDrawer
      open={isOpen}
      onClose={onClose}
      ariaLabel={product.name}
      desktopPanelClassName="relative w-full max-w-2xl lg:max-w-3xl bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden max-h-[85dvh] flex flex-col font-body"
      mobileContentClassName="bg-white rounded-t-[26px] border-t border-[#E7E1D6] shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden"
    >
      {/* Accessible Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-white/90 sm:bg-black/5 hover:bg-black/10 text-[#0F0F10] active:scale-95 transition-[transform,background-color] duration-150 cursor-pointer flex items-center justify-center shadow-sm sm:shadow-none"
        aria-label="Close modal"
      >
        <X size={17} weight="bold" aria-hidden="true" />
      </button>

      {/* Dual Grid Layout: Compact photo top on mobile, 2-col luxury packshot on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 overflow-y-auto overscroll-contain-y">
        {/* Product photograph */}
        <div className="relative bg-[#FAF9F6] h-[220px] sm:h-auto sm:min-h-[400px] overflow-hidden shrink-0">
          <ProductImage priority src={product.image} alt={product.name} sizes="(max-width: 1023px) 100vw, 512px" className="absolute inset-0 object-cover object-center" />

          {/* Badges */}
          <div className="absolute top-3.5 left-4 right-14 z-10 flex flex-row flex-wrap items-center gap-1.5">
            {product.customBadge && !/clinical/i.test(product.customBadge) && (
              <span className="px-2 py-0.5 rounded-full bg-white/85 backdrop-blur-sm text-[10px] font-mono font-medium uppercase tracking-wide text-[#0F0F10]">
                {product.customBadge}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-white/85 backdrop-blur-sm text-[10px] font-mono font-medium uppercase tracking-wide text-[#0F0F10]">
              {[product.subCategory, product.category].find(value => value && !/clinical/i.test(value)) || 'Formulation'}
            </span>
            {product.isBestseller && (
              <span className="px-2 py-0.5 rounded-full bg-[#111111]/80 backdrop-blur-sm text-[10px] font-mono font-medium uppercase tracking-wide text-[#E6C77A]">
                Best Seller
              </span>
            )}
          </div>

          {/* Authenticity Guarantee */}
          <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-sm text-[11px] font-medium text-[#0F0F10] w-fit">
            <ShieldCheck size={14} weight="fill" className="text-[#997A2E]" aria-hidden="true" />
            <span>{product.brandInfo?.guarantee || "Authentic Formulation"}</span>
          </div>
        </div>

        {/* Right Column: Formulation Details & Controls */}
        <div className="p-5 sm:p-8 flex flex-col justify-between space-y-4 sm:space-y-5 min-w-0">
          <div className="space-y-2">
            <h2
              id="quick-add-title"
              className="font-heading font-semibold text-lg sm:text-2xl text-[#0F0F10] tracking-tight leading-snug break-words"
            >
              {product.name}
            </h2>

            {/* Rating */}
            {product.rating && product.rating > 0 ? (
              <div className="flex items-center gap-2 text-xs text-[#737373]">
                <div className="flex items-center text-[#D4AF37]">
                  {[...Array(Math.min(5, Math.max(1, Math.round(product.rating))))].map((_, i) => (
                    <Star key={i} size={12} weight="fill" aria-hidden="true" />
                  ))}
                </div>
                <span className="font-medium text-[#0F0F10] text-xs">{product.rating.toFixed(1)}</span>
                {product.reviewsCount ? (
                  <>
                    <span>•</span>
                    <span className="text-[11px] text-[#737373]">
                      {product.reviewsCount} {product.reviewsCount === 1 ? 'verified review' : 'verified reviews'}
                    </span>
                  </>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                <span className="text-[11px]">Unrated</span>
              </div>
            )}

            {/* Price with rolling digit transition */}
            <div className="flex items-baseline gap-2.5 pt-0.5">
              <span className="font-price font-semibold text-2xl text-[#0F0F10]">
                <DeslaRollingNumber value={unitPrice} prefix="₦" />
              </span>
              {comparePrice && comparePrice > unitPrice && (
                <span className="text-xs font-mono text-[#A3A3A3] line-through">
                  {formatNaira(comparePrice)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-[13px] text-[#525252] leading-relaxed line-clamp-3 pt-0.5">
              {product.description}
            </p>

            {/* Active Natural Ingredients Preview */}
            {product.keyIngredients && product.keyIngredients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {product.keyIngredients.slice(0, 3).map((ing, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-[10.5px] font-medium text-[#0F0F10]">
                    {ing.name}{ing.percentage ? " (" + ing.percentage + ")" : ""}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Size / Variant Options */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2 pt-0.5">
              <label className="text-xs font-medium text-[#0F0F10] flex justify-between">
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
                      className={`px-3.5 py-2 rounded-full text-xs font-medium transition-[transform,background-color,color] duration-150 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                        isSelected
                          ? 'bg-[#0F0F10] text-white shadow-sm font-semibold'
                          : 'bg-[#F5F5F5] text-[#525252] hover:bg-[#EBEBEB]'
                      }`}
                    >
                      <span>{size}</span>
                      {isSelected && <Check size={12} weight="bold" className="text-[#D4AF37]" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Stepper & Add to Bag */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              {/* Stepper */}
              <div className="flex items-center rounded-full bg-[#F5F5F5] px-2 py-1 shrink-0 min-h-[46px]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-[#0F0F10] hover:bg-white active:scale-90 transition-[transform,background-color] duration-150 cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center font-mono font-semibold text-xs text-[#0F0F10]">
                  <DeslaRollingNumber value={quantity} />
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-[#0F0F10] hover:bg-white active:scale-90 transition-[transform,background-color] duration-150 cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Primary Add CTA */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isSubmitting}
                className="flex-1 min-h-[46px] py-3 px-5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white font-heading font-semibold text-xs sm:text-[13px] tracking-wide shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-[transform,background-color] duration-150 cursor-pointer disabled:opacity-75"
              >
                {justAdded ? (
                  <>
                    <Check size={16} weight="bold" className="text-emerald-400" aria-hidden="true" />
                    <span>Added to Bag</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} weight="fill" className="text-[#D4AF37]" aria-hidden="true" />
                    <span className="inline-flex items-center gap-1">
                      <span>Add •</span>
                      <DeslaRollingNumber value={unitPrice * quantity} prefix="₦" />
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* View Full Product Details Link */}
            <div className="text-center pt-0.5">
              <button
                type="button"
                onClick={handleViewFullDetails}
                className="text-xs font-medium text-[#737373] hover:text-[#0F0F10] underline underline-offset-4 cursor-pointer transition-colors py-1"
              >
                View full formulation dossier &amp; reviews →
              </button>
            </div>
          </div>
        </div>
      </div>
    </DeslaMobileDrawer>
  );
};
