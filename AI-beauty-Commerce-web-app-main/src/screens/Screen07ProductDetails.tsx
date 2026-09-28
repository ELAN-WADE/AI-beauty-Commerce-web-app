import React, { useState } from 'react';
import {
  Star,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Award,
  Sparkles,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Camera,
  Play,
  Share2,
  X,
  Store,
  Truck,
  Flame,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Screen07ProductDetails: React.FC = () => {
  const {
    selectedProduct,
    addToCart,
    isWishlisted,
    toggleWishlist,
    navigateTo,
    products,
    viewProductDetails,
    goBack,
    selectedCity,
    getDistributorsForCity,
    getReviewsForProduct,
    addReview,
    getPostsForProduct,
    userProfile
  } = useApp();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(
    selectedProduct?.selectedSize || selectedProduct?.sizes[0] || 'Standard'
  );
  const [quantity, setQuantity] = useState(1);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'local' | 'lagos'>('local');
  const [openAccordion, setOpenAccordion] = useState<string | null>('what-it-does');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSkinType, setReviewSkinType] = useState('Combination Skin');
  const [justAdded, setJustAdded] = useState(false);

  if (!selectedProduct) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center text-[#0F0F10]">
        <div className="space-y-4">
          <h3 className="font-heading font-extrabold tracking-tight text-2xl text-[#0F0F10]">Product Not Found</h3>
          <p className="text-sm text-[#6B7280]">The requested formulation is currently unavailable.</p>
          <button
            onClick={() => navigateTo('catalogue')}
            className="px-6 py-2.5 rounded-full bg-[#0F0F10] text-white font-bold text-xs"
          >
            Back to Catalogue
          </button>
        </div>
      </div>
    );
  }

  const wishlisted = isWishlisted(selectedProduct.id);
  const images = selectedProduct.galleryImages || [
    selectedProduct.image,
    'https://images.unsplash.com/photo-1608248597359-0c679234b4c7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80'
  ];

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const handleAddToCart = () => {
    addToCart(selectedProduct, selectedSize, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  // Local Stock Check
  const localStock = selectedProduct.distributorStock?.find(
    (s) => s.city.toLowerCase() === selectedCity.toLowerCase() && s.available
  );
  const cityPartners = getDistributorsForCity(selectedCity);
  const primaryPartner = cityPartners[0];

  // Reviews & Community Posts
  const productReviews = getReviewsForProduct(selectedProduct.id);
  const communityBuzzPosts = getPostsForProduct(selectedProduct.id, selectedProduct.hashtag);

  // Discount calculation
  const discountPct = selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price
    ? Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)
    : selectedProduct.discountPercentage || 0;

  const handleSubmitReview = (e: React.FormEvent) => {
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
      skinType: reviewSkinType
    });

    setReviewTitle('');
    setReviewComment('');
    setIsReviewModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] flex flex-col pb-28">
      {/* Top Header / Breadcrumb Trail */}
      <div className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <button
              onClick={goBack}
              className="p-1 -ml-1 rounded-full text-[#0F0F10] hover:bg-[#F3F4F6] active-press transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <ChevronLeft size={20} strokeWidth={2.2} />
            </button>
            <span className="hidden sm:inline hover:underline cursor-pointer" onClick={() => navigateTo('home')}>Home</span>
            <span className="hidden sm:inline text-gray-300">/</span>
            <span className="hidden sm:inline hover:underline cursor-pointer" onClick={() => navigateTo('catalogue')}>{selectedProduct.category}</span>
            <span className="hidden sm:inline text-gray-300">/</span>
            <span className="font-semibold text-[#0F0F10] truncate max-w-[200px] md:max-w-md">{selectedProduct.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#997A2E] font-bold px-2 py-0.5 rounded-full bg-[#FBF5E8] border border-[#D4AF37]/30">
              {selectedProduct.sku || 'DESLA!™'}
            </span>
            <button
              onClick={() => toggleWishlist(selectedProduct.id)}
              className="p-2 rounded-full text-[#6B7280] hover:text-[#D4AF37] hover:bg-[#F3F4F6] active-press transition-colors cursor-pointer"
              aria-label="Wishlist"
            >
              <Heart
                size={18}
                strokeWidth={2}
                className={wishlisted ? 'text-[#D4AF37] fill-[#D4AF37]' : ''}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Temu-Inspired 2-Column Desktop Grid */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 space-y-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LEFT COLUMN: Vertical Thumbnails Strip + Large Main Preview (7 cols) */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 items-start">
            {/* Vertical Thumbnails (Temu Style) */}
            <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto no-scrollbar shrink-0 max-h-[500px]">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-[#F6F5F2] border-2 transition-all shrink-0 cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-[#D4AF37] shadow-sm'
                      : 'border-[#E5E7EB] opacity-80 hover:opacity-100 hover:border-gray-400'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Large Main Hero Image Viewport with Nav Arrows */}
            <div className="relative flex-1 aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#F6F5F2] border border-[#E5E7EB] shadow-xs group">
              <img
                src={images[activeImageIndex] || selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />

              {/* Prev / Next Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center text-[#0F0F10] hover:bg-[#D4AF37] hover:text-[#0F0F10] active-press transition-colors cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center text-[#0F0F10] hover:bg-[#D4AF37] hover:text-[#0F0F10] active-press transition-colors cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Badges on Hero Image */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                <span className="px-3 py-1 rounded-full bg-[#0F0F10]/90 text-white font-mono text-xs font-bold shadow-xs">
                  {selectedProduct.sku}
                </span>
                {discountPct > 0 && (
                  <span className="px-3 py-1 rounded-full bg-[#D4AF37] text-[#0F0F10] font-mono text-xs font-black shadow-xs">
                    {discountPct}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Commerce, Sourcing & Swatches (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Top Commercial Badges (Temu PDP Inspired) */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F3EEE3] border border-[#E5E7EB] text-[#0F0F10] text-xs font-bold">
                  <CheckCircle2 size={13} className="text-[#997A2E]" />
                  Free Local Shipping in {selectedCity}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FBF5E8] border border-[#D4AF37]/40 text-[#997A2E] text-xs font-bold">
                  <Award size={13} className="text-[#D4AF37]" />
                  #1 Best-Seller in {selectedProduct.category}
                </span>
              </div>

              {/* Product Title */}
              <h1 className="font-heading font-semibold text-2xl lg:text-3xl text-[#0F0F10] tracking-tight leading-tight">
                {selectedProduct.name}
              </h1>

              {/* Social Proof & Rating Strip */}
              <div className="flex items-center gap-3 text-xs pt-0.5 text-[#6B7280]">
                <div className="flex items-center gap-1 text-[#D4AF37]">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                  <span className="font-bold text-[#0F0F10] ml-1">{selectedProduct.rating}</span>
                </div>
                <span>•</span>
                <span className="underline cursor-pointer">{productReviews.length + 482} verified reviews</span>
                <span>•</span>
                <span className="font-semibold text-[#0F0F10]">2.4K+ sold</span>
              </div>
            </div>

            {/* Price & Savings Block (Temu PDP Style) */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="font-price font-semibold text-3xl text-[#FB7701]">
                  {formatNaira(selectedProduct.price)}
                </span>
                {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                  <span className="font-price text-base text-[#9CA3AF] line-through">
                    {formatNaira(selectedProduct.originalPrice)}
                  </span>
                )}
                {discountPct > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-xs font-bold">
                    Save {discountPct}%
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-amber-800 font-medium">
                <Flame size={14} className="text-amber-600 fill-amber-500" />
                <span>Almost Sold Out: High order volume in {selectedCity} today</span>
              </div>
            </div>

            {/* LOCAL CITY DISTRIBUTOR SOURCING SELECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0F0F10] block">
                Fulfillment Route:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Local City Hub */}
                <div
                  onClick={() => setFulfillmentMethod('local')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    fulfillmentMethod === 'local'
                      ? 'border-[#D4AF37] bg-[#FBF5E8]/60 shadow-xs'
                      : 'border-[#E5E7EB] bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#0F0F10] flex items-center gap-1">
                      <MapPin size={13} className="text-[#D4AF37]" />
                      <span>{selectedCity} Local Hub</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#0F0F10] bg-[#F3EEE3] px-2 py-0.5 rounded">
                      SAVE ₦3,500
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] leading-snug">
                    Same-day pickup or bike dispatch via authorized {selectedCity} partner.
                  </p>
                </div>

                {/* Option 2: Lagos Central HQ */}
                <div
                  onClick={() => setFulfillmentMethod('lagos')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    fulfillmentMethod === 'lagos'
                      ? 'border-[#D4AF37] bg-[#FBF5E8]/60 shadow-xs'
                      : 'border-[#E5E7EB] bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#0F0F10] flex items-center gap-1">
                      <Truck size={13} className="text-[#6B7280]" />
                      <span>Lagos Central HQ</span>
                    </span>
                    <span className="text-[10px] text-[#6B7280]">2-4 Days</span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] leading-snug">
                    Dispatched from Victoria Island laboratory with clinical seals.
                  </p>
                </div>
              </div>
            </div>

            {/* VARIANT & SIZE PHOTO SWATCHES (Temu Mattress Color Swatches Style) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0F0F10]">
                  Formulation Size: <strong className="text-[#997A2E]">{selectedSize}</strong>
                </span>
                <span className="text-[#6B7280] text-[11px]">Clinical Dosage</span>
              </div>

              {/* Photo Swatch Cards Grid */}
              <div className="grid grid-cols-2 gap-3">
                {selectedProduct.sizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <div
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`p-2.5 rounded-xl border-2 flex items-center gap-2.5 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#D4AF37] bg-[#FBF5E8] shadow-xs'
                          : 'border-[#E5E7EB] bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg bg-[#F6F5F2] overflow-hidden shrink-0">
                        <img src={selectedProduct.image} alt={size} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-[#0F0F10] block truncate">
                          {size}
                        </span>
                        <span className="text-[11px] font-mono text-[#6B7280] block">
                          {formatNaira(selectedProduct.price)}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-[#D4AF37] text-[#0F0F10] flex items-center justify-center shrink-0">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* QUANTITY & PRIMARY ACTION BUTTONS */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                {/* Quantity Stepper */}
                <div className="flex items-center rounded-full border border-[#E5E7EB] bg-[#F8F9FA] px-3 py-2">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1 rounded-full hover:bg-white text-[#0F0F10] active-press transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center font-mono font-bold text-sm text-[#0F0F10]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-1 rounded-full hover:bg-white text-[#0F0F10] active-press transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Primary Add to Bag CTA */}
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3.5 px-6 rounded-full bg-[#0F0F10] hover:bg-[#1F1D22] text-white font-heading font-extrabold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 active-press transition-all cursor-pointer"
                >
                  {justAdded ? (
                    <>
                      <Check size={16} strokeWidth={3} className="text-[#D4AF37]" />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={17} strokeWidth={2.2} className="text-[#D4AF37]" />
                      <span>Add to Bag • {formatNaira(selectedProduct.price * quantity)}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Direct WhatsApp Local Sourcing CTA */}
              {primaryPartner && (
                <a
                  href={`https://wa.me/${primaryPartner.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(primaryPartner.name)},%20I%20am%20ordering%20${encodeURIComponent(selectedProduct.name)}%20(${selectedSize})%20in%20${selectedCity}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-emerald-900 font-heading font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Store size={15} className="text-emerald-700" />
                  <span>Order via WhatsApp from {primaryPartner.name} ({selectedCity})</span>
                </a>
              )}
            </div>

            {/* ACCORDIONS: INCI Transparency & Routine Guide */}
            <div className="border-t border-[#E5E7EB] pt-4 divide-y divide-[#E5E7EB] text-xs">
              {/* Accordion 1: What It Does */}
              <div className="py-3">
                <button
                  onClick={() => toggleAccordion('what-it-does')}
                  className="w-full flex items-center justify-between font-bold text-[#0F0F10] text-left cursor-pointer"
                >
                  <span>What It Does &amp; Clinical Benefits</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      openAccordion === 'what-it-does' ? 'rotate-180 text-[#D4AF37]' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'what-it-does' && (
                  <p className="mt-2 text-[#6B7280] leading-relaxed">
                    {selectedProduct.description}
                  </p>
                )}
              </div>

              {/* Accordion 2: INCI Ingredients */}
              <div className="py-3">
                <button
                  onClick={() => toggleAccordion('ingredients')}
                  className="w-full flex items-center justify-between font-bold text-[#0F0F10] text-left cursor-pointer"
                >
                  <span>INCI Clinical Ingredients Transparency</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      openAccordion === 'ingredients' ? 'rotate-180 text-[#D4AF37]' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'ingredients' && (
                  <div className="mt-2 space-y-2 text-[#6B7280]">
                    <p className="leading-relaxed">
                      Safe-conscious formulations formulated without harsh sulfates, artificial endocrine disruptors, or bleaching agents:
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedProduct.keyIngredients?.map((ing, idx: number) => (
                        <span key={idx} className="px-2.5 py-0.5 rounded-full bg-[#F6F5F2] text-[#0F0F10] text-[11px] font-medium border border-[#E5E7EB]">
                          {ing.name}{ing.percentage ? ` (${ing.percentage})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* VERIFIED CUSTOMER REVIEWS & LIVE COMMUNITY BUZZ STREAM */}
        <section className="pt-10 border-t border-[#E5E7EB] space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-xl text-[#0F0F10]">
                  Verified Customer Reviews
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F3EEE3] text-[#0F0F10] border border-[#E5E7EB] text-xs font-bold">
                  NAFDAC Verified
                </span>
              </div>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Real feedback from verified buyers across Lagos, Abuja, and Port Harcourt.
              </p>
            </div>

            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#D4AF37] text-white hover:text-[#0F0F10] text-xs font-heading font-bold active-press transition-colors cursor-pointer"
            >
              Write a Review + Photo
            </button>
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {productReviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={rev.authorAvatar} alt={rev.authorName} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <span className="font-bold text-xs text-[#0F0F10] block">{rev.authorName}</span>
                      <span className="text-[10px] text-[#263127] font-semibold">• Verified Buyer ({rev.city})</span>
                    </div>
                  </div>
                  <div className="flex text-[#D4AF37]">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} size={12} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                </div>

                <h4 className="font-heading font-bold text-xs text-[#0F0F10]">{rev.title}</h4>
                <p className="text-xs text-[#6B7280] leading-relaxed">{rev.comment}</p>

                {rev.skinType && (
                  <span className="inline-block text-[10px] font-mono text-[#997A2E] bg-[#FBF5E8] px-2 py-0.5 rounded-full">
                    Skin Type: {rev.skinType}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Community Buzz Stream (#Hashtag Video Proof) */}
          {communityBuzzPosts.length > 0 && (
            <div className="pt-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-[#D4AF37]" />
                  <h4 className="font-heading font-bold text-base text-[#0F0F10]">
                    Desla Collective Buzz ({selectedProduct.hashtag})
                  </h4>
                </div>
                <button
                  onClick={() => navigateTo('community')}
                  className="text-xs font-bold text-[#997A2E] hover:underline"
                >
                  View All Social Posts →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {communityBuzzPosts.map((post) => (
                  <div key={post.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-2">
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
            </div>
          )}
        </section>
      </main>

      {/* Review Submission Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#E5E7EB] space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-[#0F0F10]">
                Write a Verified Review
              </h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
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
                      className="cursor-pointer"
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
                <label className="text-xs font-semibold text-[#0F0F10] block mb-1">Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cleared my hyperpigmentation in 3 weeks!"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F0F10] block mb-1">Review</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Share details about the texture, hydration level, and results on your skin..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E7EB] text-xs text-[#6B7280] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#0F0F10] text-white text-xs font-bold hover:bg-[#D4AF37] hover:text-[#0F0F10] transition-colors cursor-pointer"
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
