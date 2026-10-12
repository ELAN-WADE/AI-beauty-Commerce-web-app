import React, { useEffect, useState } from 'react';
import {
  Star,
  Minus,
  Plus,
  ShoppingBag,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Award,
  CheckCircle2,
  MessageSquare,
  X,
  Store,
  Check,
  ArrowRight,
  Camera
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../../components/common/ProductCard';
import { ProductImage } from '../../components/common/ProductImage';
import { isOwnedApiConfigured, fetchProductReviewsApi, fetchStockNearCity, resolveVariantId, submitReviewApi } from '../../lib/owned-api';
import type { Product, ProductReview } from '../../types';

export const Screen07ProductDetails: React.FC<{ initialProduct?: Product }> = ({ initialProduct }) => {
  const {
    selectedProduct: contextSelectedProduct,
    addToCart,
    navigateTo,
    products,
    setSelectedCategory,
    selectedCity,
    getDistributorsForCity,
    getReviewsForProduct,
    addReview,
    getPostsForProduct,
    userProfile
  } = useApp();

  // Phase 3 SSR: server renders with the ISR-seeded product so HTML already
  // shows the right formulation; the client hydrates with the identical object
  // (no mismatch, no "Product Not Found" flash). Context still syncs post-mount.
  const selectedProduct = initialProduct ?? contextSelectedProduct;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(
    selectedProduct?.selectedSize || selectedProduct?.sizes[0] || 'Standard'
  );
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>('what-it-does');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSkinType, setReviewSkinType] = useState('Combination Skin');
  const [reviewPhoto, setReviewPhoto] = useState<string>('');
  const [justAdded, setJustAdded] = useState(false);
  const [liveReviews, setLiveReviews] = useState<ProductReview[] | null>(null);
  const [liveStock, setLiveStock] = useState<{ units: number; partners: number } | null>(null);

  // Live reads (owned backend): approved reviews + city stock for this variant.
  const selectedProductId = selectedProduct?.id;
  const selectedProductSizes = selectedProduct?.sizes?.join('|');
  useEffect(() => {
    if (!isOwnedApiConfigured || !selectedProductId) return;
    let cancelled = false;
    fetchProductReviewsApi(selectedProductId)
      .then((live) => {
        if (!cancelled && live && live.length > 0) setLiveReviews(live);
      })
      .catch(() => {});
    const firstSize = (selectedProductSizes ?? '').split('|')[0] || 'Standard';
    resolveVariantId(selectedProductId, firstSize)
      .then((variantId) => {
        if (!variantId || cancelled) return null;
        return fetchStockNearCity(variantId, selectedCity);
      })
      .then((stock) => {
        if (!cancelled && stock && stock.length > 0) {
          setLiveStock({ units: stock.reduce((s, r) => s + r.quantity, 0), partners: stock.length });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedProductId, selectedProductSizes, selectedCity]);

  if (!selectedProduct) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center text-[#0F0F10]">
        <div className="space-y-4">
          <h3 className="font-heading font-extrabold tracking-tight text-2xl text-[#0F0F10]">Product Not Found</h3>
          <p className="text-sm text-[#6B7280]">The requested formulation is currently unavailable.</p>
          <button
            onClick={() => navigateTo('catalogue')}
            className="px-6 py-2.5 rounded-full bg-[#0F0F10] text-white font-bold text-xs active-press cursor-pointer"
          >
            Back to Catalogue
          </button>
        </div>
      </div>
    );
  }

  // Resilient image list with guaranteed packshot fallbacks
  const defaultFallbackImages = [
    selectedProduct.image || '/product_barrier_cream.jpg',
    '/product_barrier_cream.jpg',
    '/product_cleanser.jpg',
    '/product_sunscreen.jpg'
  ];

  const images = (selectedProduct.galleryImages && selectedProduct.galleryImages.length > 0)
    ? selectedProduct.galleryImages
    : defaultFallbackImages;

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const handleAddToCart = () => {
    addToCart(selectedProduct, selectedSize, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const cityPartners = getDistributorsForCity(selectedCity);
  const primaryPartner = cityPartners[0];

  // Reviews & Community Posts
  const productReviews = getReviewsForProduct(selectedProduct.id);
  const communityBuzzPosts = getPostsForProduct(selectedProduct.id, selectedProduct.hashtag);
  const shownReviews = liveReviews ?? productReviews;

  // Discount calculation
  const discountPct = selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price
    ? Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)
    : selectedProduct.discountPercentage || 0;

  // Filter other formulations - exactly 5 items for balanced desktop 5-col row
  const otherProducts = React.useMemo(() => {
    if (!selectedProduct) return products.slice(0, 5);
    const sameCategory = products.filter(
      (p) => p.id !== selectedProduct.id && p.category === selectedProduct.category
    );
    const otherCategories = products.filter(
      (p) => p.id !== selectedProduct.id && p.category !== selectedProduct.category
    );
    return [...sameCategory, ...otherCategories].slice(0, 5);
  }, [products, selectedProduct]);

  const [reviewSyncNote, setReviewSyncNote] = useState<string | null>(null);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewComment.trim()) return;

    addReview({
      productId: selectedProduct.id,
      productSku: selectedProduct.sku,
      authorName: userProfile.name,
      authorAvatar: userProfile.avatar,
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment,
      verifiedPurchase: true,
      city: selectedCity,
      skinType: reviewSkinType,
      photoUrl: reviewPhoto || undefined
    });

    const published = await submitReviewApi({
      productId: selectedProduct.id,
      rating: reviewRating,
      title: reviewTitle,
      comment: reviewComment
    }).catch(() => false);
    setReviewSyncNote(
      published
        ? null
        : 'Saved on this device only — we could not reach the server. Reconnect and re-submit to publish it.'
    );

    setReviewTitle('');
    setReviewComment('');
    setReviewPhoto('');
    setIsReviewModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] flex flex-col pb-28 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* Main Content: Mobile First Ordering + Desktop Dual-Grid */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-3 space-y-6 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* ========================================================================= */}
          {/* 1. MEDIA GALLERY (lg:col-span-7, order-1)                                 */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 order-1 space-y-3 min-w-0">
            <div className="flex flex-col-reverse md:flex-row gap-3.5 items-start">
              {/* Vertical Thumbnails */}
              <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar shrink-0 max-h-[480px]">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden bg-[#F6F5F2] border-2 transition-all shrink-0 cursor-pointer active-press ${
                      activeImageIndex === idx
                        ? 'border-[#D4AF37] shadow-xs'
                        : 'border-[#E5E7EB] opacity-75 hover:opacity-100 hover:border-gray-400'
                    }`}
                  >
                    <ProductImage
                      src={img}
                      alt={`Thumbnail ${idx}`}
                      sizes="64px"
                      className="object-cover"
                      fallbackSrc={selectedProduct.image || '/product_barrier_cream.jpg'}
                    />
                  </button>
                ))}
              </div>

              {/* Main Hero Image Viewport - Full Bleed Coverage without Awkward Letterboxing */}
              <div className="relative flex-1 aspect-square max-h-[480px] w-full rounded-2xl overflow-hidden bg-[#F6F5F2] border border-[#E5E7EB] shadow-xs group">
                <ProductImage
                  src={images[activeImageIndex] || selectedProduct.image || '/product_barrier_cream.jpg'}
                  alt={selectedProduct.name}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  className="object-cover object-center transition-transform duration-300 group-hover:scale-102"
                />

                {/* Prev / Next Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-[#0F0F10] hover:bg-[#D4AF37] hover:text-[#0F0F10] active-press transition-all cursor-pointer z-10"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-[#0F0F10] hover:bg-[#D4AF37] hover:text-[#0F0F10] active-press transition-all cursor-pointer z-10"
                      aria-label="Next image"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. PRODUCT BUY-BOX & ADD-TO-BAG (lg:col-span-5, order-2, sticky on desktop) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 order-2 space-y-4 lg:sticky lg:top-20 min-w-0">
            {/* Commercial Badges & SKU */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F3EEE3] border border-[#E5E7EB] text-[#0F0F10] text-[10px] font-semibold">
                  <CheckCircle2 size={11} className="text-[#997A2E]" />
                  Free Local Shipping in {selectedCity}
                </span>
                {selectedProduct.sku && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F6F5F2] border border-[#E5E7EB] text-[#6B7280] font-mono text-[10px] font-medium">
                    {selectedProduct.sku}
                  </span>
                )}
              </div>

              {/* Product Title */}
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10] tracking-tight leading-snug">
                {selectedProduct.name}
              </h1>

              {/* Rating Strip */}
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <div className="flex items-center gap-1 text-[#D4AF37]">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={11} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                  <span className="font-bold text-[#0F0F10] ml-0.5 text-[11px]">{selectedProduct.rating}</span>
                </div>
                <span>•</span>
                <span className="text-[11px] text-[#6B7280]">
                  {shownReviews.length + 482} verified reviews
                </span>
                <span>•</span>
                <span className="font-medium text-[#0F0F10] text-[11px]">
                  2.4K+ sold
                </span>
              </div>
            </div>

            {/* Price & Savings Block - Clean White Card */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] space-y-1">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="font-price font-extrabold text-xl sm:text-2xl text-[#0F0F10]">
                  {formatNaira(selectedProduct.price)}
                </span>
                {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                  <span className="font-price text-xs sm:text-sm text-[#9CA3AF] line-through">
                    {formatNaira(selectedProduct.originalPrice)}
                  </span>
                )}
                {discountPct > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                    {discountPct}% OFF
                  </span>
                )}
              </div>
              <p className="text-[10.5px] text-[#6B7280]">
                Taxes included. Authorized Lagos dispatch with temperature control.
              </p>
            </div>

            {/* SIZE / VARIANT SELECTION */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#0F0F10] block">
                Select Formulation Volume
              </span>
              <div className="grid grid-cols-2 gap-2">
                {selectedProduct.sizes?.map((size: string) => {
                  const isSelected = selectedSize === size;
                  return (
                    <div
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all active-press ${
                        isSelected
                          ? 'border-[#0F0F10] bg-[#FAF9F6] shadow-2xs'
                          : 'border-[#E5E7EB] bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#0F0F10] block truncate">
                          {size}
                        </span>
                        <span className="text-[10.5px] font-mono text-[#6B7280] block">
                          {formatNaira(selectedProduct.price)}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-[#D4AF37] text-[#0F0F10] flex items-center justify-center shrink-0">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* QUANTITY & ERGONOMIC LUXURY ADD TO BAG ACTION */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                {/* Quantity Stepper */}
                <div className="flex items-center rounded-full border border-[#E5E7EB] bg-[#F8F9FA] px-2.5 py-1 shrink-0 min-h-[42px] select-none" style={{ touchAction: "manipulation" }}>
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1 rounded-full hover:bg-white text-[#0F0F10] active-press transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-7 text-center font-mono font-bold text-xs text-[#0F0F10]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-1 rounded-full hover:bg-white text-[#0F0F10] active-press transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Primary Add to Bag CTA */}
                <button
                  onClick={handleAddToCart}
                  className="flex-1 sm:flex-initial sm:max-w-xs min-h-[46px] py-3 px-7 rounded-full bg-[#0F0F10] hover:bg-[#1F1D22] text-white font-heading font-bold text-xs sm:text-[13px] tracking-wide shadow-sm flex items-center justify-center gap-2 active-press transition-all cursor-pointer"
                >
                  {justAdded ? (
                    <>
                      <Check size={15} strokeWidth={3} className="text-[#D4AF37]" />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={15} strokeWidth={2.2} className="text-[#D4AF37]" />
                      <span>Add to Bag • {formatNaira(selectedProduct.price * quantity)}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Direct WhatsApp Local Sourcing CTA */}
              {liveStock && (
                <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 text-center">
                  Live stock: {liveStock.units} units across {liveStock.partners} verified {liveStock.partners === 1 ? 'partner' : 'partners'} in {selectedCity}
                </p>
              )}
              {primaryPartner && (
                <a
                  href={`https://wa.me/${primaryPartner.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(primaryPartner.name)},%20I%20am%20ordering%20${encodeURIComponent(selectedProduct.name)}%20(${selectedSize})%20in%20${selectedCity}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-emerald-900 font-heading font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer active-press"
                >
                  <Store size={14} className="text-emerald-700" />
                  <span>WhatsApp Pickup from {primaryPartner.name} ({selectedCity})</span>
                </a>
              )}
            </div>

            {/* ACCORDIONS: INCI Transparency & Routine Guide */}
            <div className="border-t border-[#E5E7EB] pt-2 divide-y divide-[#E5E7EB] text-xs">
              {/* Accordion 1: What It Does */}
              <div className="py-2.5">
                <button
                  onClick={() => toggleAccordion('what-it-does')}
                  className="w-full flex items-center justify-between font-bold text-[#0F0F10] text-left cursor-pointer active-press"
                >
                  <span>What It Does &amp; Clinical Benefits</span>
                  <ChevronDown
                    size={15}
                    className={`transition-transform duration-200 ${
                      openAccordion === 'what-it-does' ? 'rotate-180 text-[#D4AF37]' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'what-it-does' && (
                  <p className="mt-2 text-[#6B7280] leading-relaxed text-[11.5px]">
                    {selectedProduct.description}
                  </p>
                )}
              </div>

              {/* Accordion 2: INCI Ingredients */}
              <div className="py-2.5">
                <button
                  onClick={() => toggleAccordion('ingredients')}
                  className="w-full flex items-center justify-between font-bold text-[#0F0F10] text-left cursor-pointer active-press"
                >
                  <span>INCI Clinical Ingredients Transparency</span>
                  <ChevronDown
                    size={15}
                    className={`transition-transform duration-200 ${
                      openAccordion === 'ingredients' ? 'rotate-180 text-[#D4AF37]' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'ingredients' && (
                  <div className="mt-2 space-y-1.5 text-[#6B7280] text-[11.5px]">
                    <p className="leading-relaxed">
                      Safe-conscious formulations formulated without harsh sulfates, artificial endocrine disruptors, or bleaching agents:
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {selectedProduct.keyIngredients?.map((ing, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded-full bg-[#F6F5F2] text-[#0F0F10] text-[10.5px] font-medium border border-[#E5E7EB]">
                          {ing.name}{ing.percentage ? ` (${ing.percentage})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. VERIFIED CUSTOMER REVIEWS & COLLECTIVE BUZZ (lg:col-span-7, order-3)   */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 order-3 space-y-6 pt-4 border-t border-[#E5E7EB]">
            {/* Reviews Section */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-extrabold text-base text-[#0F0F10]">
                      Verified Customer Reviews
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#F3EEE3] text-[#0F0F10] border border-[#E5E7EB] text-[10.5px] font-bold">
                      NAFDAC Verified
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Real feedback and photo proofs from verified buyers across Nigeria.
                  </p>
                </div>

                <button
                  onClick={() => { setReviewSyncNote(null); setIsReviewModalOpen(true); }}
                  className="px-4 py-2 rounded-full bg-[#0F0F10] hover:bg-[#D4AF37] text-white hover:text-[#0F0F10] text-xs font-heading font-bold active-press transition-colors cursor-pointer shrink-0"
                >
                  Write Review
                </button>
              </div>
              {reviewSyncNote && (
                <p role="status" className="text-[11px] text-[#997A2E] bg-[#FBF5E8] border border-[#D4AF37]/30 rounded-xl px-3 py-2">
                  {reviewSyncNote}
                </p>
              )}

              {/* Reviews Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {shownReviews.map((rev) => (
                  <div key={rev.id} className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={rev.authorAvatar} alt={rev.authorName} className="w-7 h-7 rounded-full object-cover" />
                        <div>
                          <span className="font-bold text-xs text-[#0F0F10] block">{rev.authorName}</span>
                          <span className="text-[10px] text-[#263127] font-semibold">• Verified ({rev.city})</span>
                        </div>
                      </div>
                      <div className="flex text-[#D4AF37]">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} size={11} fill="currentColor" strokeWidth={0} />
                        ))}
                      </div>
                    </div>

                    <h4 className="font-heading font-bold text-xs text-[#0F0F10]">{rev.title}</h4>
                    <p className="text-xs text-[#6B7280] leading-relaxed">{rev.comment}</p>

                    {/* Customer Photo Proof if Attached */}
                    {rev.photoUrl && (
                      <div className="pt-1">
                        <a href={rev.photoUrl} target="_blank" rel="noopener noreferrer" className="inline-block group/photo">
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F6F5F2]">
                            <img
                              src={rev.photoUrl}
                              alt="Customer result proof"
                              className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/15 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera size={13} className="text-white" />
                            </div>
                          </div>
                          <span className="text-[9.5px] font-semibold text-[#6B7280] flex items-center gap-1 mt-0.5">
                            <Camera size={10} className="text-[#997A2E]" /> Photo proof
                          </span>
                        </a>
                      </div>
                    )}

                    {rev.skinType && (
                      <span className="inline-block text-[10px] font-mono text-[#997A2E] bg-[#FBF5E8] px-2 py-0.5 rounded-full">
                        Skin Type: {rev.skinType}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* DESLA COLLECTIVE BUZZ STREAM */}
            {communityBuzzPosts.length > 0 && (
              <section className="pt-6 border-t border-[#E5E7EB] space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-[#D4AF37]" />
                    <h4 className="font-heading font-bold text-sm text-[#0F0F10]">
                      Community Buzz ({selectedProduct.hashtag})
                    </h4>
                  </div>
                  <button
                    onClick={() => navigateTo('community')}
                    className="text-xs font-bold text-[#997A2E] hover:underline active-press cursor-pointer"
                  >
                    View All Posts →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {communityBuzzPosts.map((post) => (
                    <div key={post.id} className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-2">
                      <div className="flex items-center gap-2">
                        <img src={post.authorAvatar} alt={post.authorName} className="w-7 h-7 rounded-full object-cover" />
                        <div>
                          <span className="font-bold text-xs text-[#0F0F10] block">{post.authorName}</span>
                          <span className="text-[10px] text-[#6B7280]">{post.authorRole}</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#4B5563] leading-relaxed line-clamp-2">{post.content}</p>
                      <span className="text-[11px] font-mono font-bold text-[#997A2E] block">{post.taggedProductHashtag || selectedProduct.hashtag}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* 4. EXPLORE OTHER FORMULATIONS & ROUTINE PAIRINGS (Exactly 5 Cards for Balanced Desktop Row) */}
        {otherProducts.length > 0 && (
          <section className="mt-10 pt-8 border-t border-[#E5E7EB]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                  <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#0F0F10] tracking-tight">
                    Explore Other Formulations
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FBF5E8] border border-[#D4AF37]/30 text-[#997A2E] text-[10.5px] font-bold">
                    Pairings
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-1">
                  Routine pairings fulfilled locally in {selectedCity}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedCategory('All');
                  navigateTo('catalogue');
                }}
                className="text-xs font-heading font-bold text-[#0F0F10] hover:text-[#997A2E] flex items-center gap-1.5 group cursor-pointer active-press"
              >
                <span>View Full Catalogue</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {otherProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Review Submission Modal with Photo Upload */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#E5E7EB] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-[#0F0F10]">
                Write a Verified Review
              </h3>
              <button
                onClick={() => {
                  setIsReviewModalOpen(false);
                  setReviewPhoto('');
                }}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer active-press"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#0F0F10] block mb-1">Your Rating</label>
                <div className="flex gap-2 text-[#D4AF37]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="cursor-pointer active-press"
                    >
                      <Star
                        size={22}
                        fill={star <= reviewRating ? 'currentColor' : 'none'}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="review-headline" className="text-xs font-semibold text-[#0F0F10] block mb-1">Headline</label>
                <input
                  id="review-headline"
                  type="text"
                  required
                  placeholder="e.g. Cleared my hyperpigmentation in 3 weeks!"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label htmlFor="review-skin-type" className="text-xs font-semibold text-[#0F0F10] block mb-1">Skin Type</label>
                <select
                  id="review-skin-type"
                  value={reviewSkinType}
                  onChange={(e) => setReviewSkinType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Combination Skin">Combination Skin</option>
                  <option value="Oily Skin">Oily Skin</option>
                  <option value="Dry Skin">Dry Skin</option>
                  <option value="Sensitive Skin">Sensitive Skin</option>
                  <option value="Normal Skin">Normal Skin</option>
                </select>
              </div>

              <div>
                <label htmlFor="review-comment" className="text-xs font-semibold text-[#0F0F10] block mb-1">Review</label>
                <textarea
                  id="review-comment"
                  required
                  rows={3}
                  placeholder="Share details about the texture, hydration level, and results on your skin..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Photo Upload Attachment */}
              <div>
                <label className="text-xs font-semibold text-[#0F0F10] block mb-1">
                  Photo Proof or Receipt (Optional)
                </label>
                {reviewPhoto ? (
                  <div className="relative inline-block">
                    <img
                      src={reviewPhoto}
                      alt="Review upload preview"
                      className="w-20 h-20 rounded-xl object-cover border border-[#E5E7EB]"
                    />
                    <button
                      type="button"
                      onClick={() => setReviewPhoto('')}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0F0F10] text-white flex items-center justify-center text-[10px] hover:bg-rose-600 transition-colors cursor-pointer"
                      aria-label="Remove photo"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-dashed border-[#D1D5DB] hover:border-[#D4AF37] bg-[#F9FAFB] cursor-pointer transition-colors">
                    <Camera size={16} className="text-[#997A2E]" />
                    <span className="text-xs text-[#6B7280]">
                      Attach photo of your results or packaging
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setReviewPhoto(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsReviewModalOpen(false);
                    setReviewPhoto('');
                  }}
                  className="px-4 py-2 rounded-full border border-[#E5E7EB] text-xs text-[#6B7280] font-semibold cursor-pointer active-press"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#0F0F10] text-white text-xs font-bold hover:bg-[#D4AF37] hover:text-[#0F0F10] active-press transition-colors cursor-pointer"
                >
                  Submit Verified Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
