import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  FlaskConical,
  Layers,
  DollarSign,
  Tag,
  Image as ImageIcon,
  Sliders,
  ShieldCheck,
  MapPin,
  Upload,
  Loader2
} from '../common/SolidIcons';
import { uploadProductMediaApi } from '../../lib/owned-api';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';

interface ProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: (productData: any) => Promise<void> | void;
  categoriesList?: { id: string; name: string; slug: string }[];
}

const SKIN_TYPE_OPTIONS = ['Dry', 'Oily', 'Sensitive', 'Combination', 'Balanced', 'All Skin Types'];
const CONCERN_OPTIONS = [
  'Hyperpigmentation',
  'Compromised Moisture Barrier',
  'Fine Lines & Wrinkles',
  'Acne & Blemishes',
  'Dullness & Uneven Tone',
  'Harmattan Dehydration',
  'Enlarged Pores',
  'Redness & Sensitivity'
];

const PRESET_BADGES = [
  '',
  'Natural Formulation',
  'SPF 50+ PA++++',
  'Cold-Pressed Nilotica',
  'Dermatologist Tested',
  'Fragrance Free',
  'Hypoallergenic'
];

const PRESET_IMAGES = [
  { label: 'Barrier Cream', url: '/product_barrier_cream.jpg' },
  { label: 'Azelaic Acid Elixir', url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
  { label: 'Radiant Body Oil', url: 'https://images.unsplash.com/photo-1608248597359-0c679234b4c7?auto=format&fit=crop&w=800&q=80' },
  { label: 'Shea Butter Balm', url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80' },
  { label: 'Hydrating Essence', url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80' },
  { label: 'Vitamin C Serum', url: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=80' }
];

export const ProductDrawer: React.FC<ProductDrawerProps> = ({
  isOpen,
  onClose,
  product,
  onSave,
  categoriesList = [
    { id: 'cat-1', name: 'Facial Care', slug: 'facial-care' },
    { id: 'cat-2', name: 'Body Care', slug: 'body-care' },
    { id: 'cat-3', name: 'Fine Fragrance', slug: 'fine-fragrance' },
    { id: 'cat-4', name: 'Lip Care', slug: 'lip-care' },
    { id: 'cat-5', name: 'Sun Protection', slug: 'sun-protection' },
    { id: 'cat-6', name: 'Hair & Scalp', slug: 'hair-scalp' }
  ]
}) => {
  const { isLiveBackend } = useApp();
  const [activeTab, setActiveTab] = useState<'identity' | 'pricing' | 'natural' | 'media' | 'logistics' | 'flags'>('identity');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Identity Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [brand, setBrand] = useState('DESLA!™');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [hashtag, setHashtag] = useState('');

  // 2. Variants & Pricing State
  const [variants, setVariants] = useState<
    { id?: string; sku: string; sizeLabel: string; priceNgn: number; compareAtNgn: number | null; stock: number; isActive: boolean }[]
  >([{ sku: '', sizeLabel: '', priceNgn: 0, compareAtNgn: null, stock: 0, isActive: true }]);

  // 3. Natural Benefits & Ritual ACF State
  const [whatItDoes, setWhatItDoes] = useState<string[]>([]);
  const [newBulletText, setNewBulletText] = useState('');

  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>([]);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<
    { name: string; percentage: string; description: string }[]
  >([]);
  const [routine, setRoutine] = useState<'AM' | 'PM' | 'AM & PM'>('AM & PM');
  const [routineStep, setRoutineStep] = useState('');
  const [instructions, setInstructions] = useState('');
  const [precautions, setPrecautions] = useState('');

  // 4. Media State
  const [heroImage, setHeroImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [heroUploadError, setHeroUploadError] = useState<string | null>(null);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(null);
  const heroFileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  const handleHeroFileUpload = async (file: File) => {
    if (!file) return;
    setHeroUploadError(null);
    setIsUploadingHero(true);
    try {
      const res = await uploadProductMediaApi(file);
      setHeroImage(res.url);
    } catch (err: any) {
      setHeroUploadError(err?.message || 'Failed to upload image file.');
    } finally {
      setIsUploadingHero(false);
      if (heroFileRef.current) heroFileRef.current.value = '';
    }
  };

  const handleGalleryFilesUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setGalleryUploadError(null);
    setIsUploadingGallery(true);
    try {
      for (const file of fileArray) {
        const res = await uploadProductMediaApi(file);
        setGalleryImages((prev) => [...prev, res.url]);
      }
    } catch (err: any) {
      setGalleryUploadError(err?.message || 'Failed to upload gallery images.');
    } finally {
      setIsUploadingGallery(false);
      if (galleryFileRef.current) galleryFileRef.current.value = '';
    }
  };

  // 5. Regional Hub Logistics ACF State
  const [hubStocks, setHubStocks] = useState<{ city: string; available: boolean; quantity: number }[]>([]);

  // 6. Brand Ethics & Merchandising ACF State
  const [origin, setOrigin] = useState('');
  const [crueltyFree, setCrueltyFree] = useState(false);
  const [guarantee, setGuarantee] = useState('');
  const [customBadge, setCustomBadge] = useState('');

  const [isBestseller, setIsBestseller] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [isFlashSale, setIsFlashSale] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Sync state when editing an existing product or creating fresh
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setSlug(product.slug || product.id);
      setBrand(product.brand || 'DESLA!™');
      setCategory(product.category || 'skincare');
      setSubCategory(product.subCategory || '');
      setTagline(product.tagline || '');
      setDescription(product.description || '');
      setHashtag(product.hashtag || '');

      // Variants
      if (product.variants?.length) {
        setVariants(product.variants.map(variant => ({ ...variant })));
      } else if (product.sizes && product.sizes.length > 0) {
        setVariants(
          product.sizes.map((size, idx) => ({
            id: `var-${idx}`,
            sku: `${product.sku || 'DES'}-${idx + 1}`,
            sizeLabel: size,
            priceNgn: product.price || 0,
            compareAtNgn: product.originalPrice || null,
            stock: product.stockCount || 0,
            isActive: product.inStock !== false
          }))
        );
      } else {
        setVariants([
          {
            sku: product.sku || 'DES-PROD-01',
            sizeLabel: 'Standard',
            priceNgn: product.price || 0,
            compareAtNgn: product.originalPrice || null,
            stock: product.stockCount || 0,
            isActive: true
          }
        ]);
      }

      // Natural ACF
      if (product.whatItDoes && product.whatItDoes.length > 0) {
        setWhatItDoes(product.whatItDoes);
      } else {
        setWhatItDoes([]);
      }

      if (product.whoItsFor?.skinTypes) {
        setSelectedSkinTypes(product.whoItsFor.skinTypes);
      }
      if (product.whoItsFor?.concerns) {
        setSelectedConcerns(product.whoItsFor.concerns);
      }
      if (product.keyIngredients && product.keyIngredients.length > 0) {
        setIngredients(
          product.keyIngredients.map((i) => ({
            name: i.name,
            percentage: i.percentage || '',
            description: i.description || ''
          }))
        );
      }
      if (product.howToUse?.routine) {
        setRoutine((product.howToUse.routine as any) || 'AM & PM');
      }
      if (product.howToUse?.step) {
        setRoutineStep(product.howToUse.step);
      }
      setInstructions(product.howToUse?.instructions || '');
      setPrecautions(product.howToUse?.precautions || '');

      // Media
      setHeroImage(product.image || '');
      setGalleryImages(product.galleryImages?.length ? product.galleryImages : [product.image]);

      // Regional Hub Logistics ACF
      if (product.distributorStock && product.distributorStock.length > 0) {
        setHubStocks(product.distributorStock);
      } else {
        setHubStocks([]);
      }

      // Brand Ethics & Ribbons ACF
      setOrigin(product.brandInfo?.origin || '');
      setCrueltyFree(product.brandInfo?.crueltyFree === true);
      setGuarantee(product.brandInfo?.guarantee || '');
      setCustomBadge(/clinical/i.test(product.customBadge || '') ? '' : product.customBadge || '');

      // Flags
      setIsBestseller(!!product.isBestseller);
      setIsNew(!!product.isNew);
      setIsFlashSale(!!product.isFlashSale);
      setIsActive(product.isActive ?? product.inStock !== false);
    } else {
      // Reset for creation
      setName('');
      setSlug('');
      setBrand('DESLA!™');
      setCategory(categoriesList[0]?.slug || 'skincare');
      setSubCategory('');
      setTagline('');
      setDescription('');
      setHashtag('');
      setVariants([
        { sku: '', sizeLabel: '', priceNgn: 0, compareAtNgn: null, stock: 0, isActive: true }
      ]);
      setWhatItDoes([]);
      setSelectedSkinTypes([]);
      setSelectedConcerns([]);
      setIngredients([]);
      setInstructions('');
      setPrecautions('');
      setHeroImage('');
      setGalleryImages([]);
      setOrigin('');
      setCrueltyFree(false);
      setGuarantee('');
      setCustomBadge('');
      setHubStocks([]);
      setIsBestseller(false);
      setIsNew(true);
      setIsFlashSale(false);
      setIsActive(true);
    }
    setErrorMsg('');
  }, [product, isOpen]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!product) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  const handleAddVariant = () => {
    const nextIdx = variants.length + 1;
    setVariants((prev) => [
      ...prev,
      {
        sku: `${variants[0]?.sku.split('-')[0] || 'DES'}-${nextIdx * 50}ML`,
        sizeLabel: `${nextIdx * 50}ml / ${(nextIdx * 1.7).toFixed(1)} fl oz`,
        priceNgn: variants[0]?.priceNgn || 0,
        compareAtNgn: null,
        stock: 0,
        isActive: true
      }
    ]);
  };

  const handleUpdateVariant = (index: number, field: string, val: any) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Natural Benefits Bullets
  const handleAddBullet = () => {
    if (!newBulletText.trim()) return;
    setWhatItDoes((prev) => [...prev, newBulletText.trim()]);
    setNewBulletText('');
  };

  const handleRemoveBullet = (index: number) => {
    setWhatItDoes((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Taxonomies
  const toggleSkinType = (type: string) => {
    setSelectedSkinTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleConcern = (concern: string) => {
    setSelectedConcerns((prev) =>
      prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern]
    );
  };

  const handleAddIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { name: '', percentage: '', description: '' }
    ]);
  };

  const handleUpdateIngredient = (index: number, field: string, val: string) => {
    setIngredients((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Media
  const handleAddGalleryUrl = () => {
    if (!newGalleryUrl.trim()) return;
    setGalleryImages((prev) => [...prev, newGalleryUrl.trim()]);
    setNewGalleryUrl('');
  };

  const handleRemoveGalleryUrl = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Hub Stock
  const handleUpdateHubStock = (index: number, quantity: number) => {
    setHubStocks((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], quantity, available: quantity > 0 };
      return copy;
    });
  };

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Product name is required.');
      setActiveTab('identity');
      return;
    }

    if (variants.length === 0 || variants.some(v => !v.sku.trim() || !v.sizeLabel.trim() || !Number.isFinite(v.priceNgn) || v.priceNgn <= 0 || !Number.isInteger(v.stock) || v.stock < 0)) {
      setErrorMsg('Every variant needs a SKU, size, positive price, and whole-number stock quantity.');
      setActiveTab('pricing');
      return;
    }

    if (!category || !categoriesList.some(item => item.slug === category)) { setErrorMsg('Choose a saved category. Create a category in Formulations & Taxonomy first if needed.'); setActiveTab('identity'); return; }
    if (/clinical/i.test(customBadge)) { setErrorMsg('Clinical labels are not supported.'); return; }
    if (!heroImage.trim()) { setErrorMsg('Add the actual product image before publishing.'); setActiveTab('media'); return; }

    setIsSubmitting(true);
    try {
      const primaryPrice = variants[0].priceNgn;
      const primaryOriginalPrice = variants[0].compareAtNgn || undefined;

      const productPayload: Partial<Product> = {
        serverId: product?.serverId,
        version: product?.version,
        slug,
        variants,
        isActive,
        id: product?.id || `des-${Date.now()}`,
        sku: variants[0].sku,
        name: name.trim(),
        brand: brand.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        category,
        subCategory,
        price: primaryPrice,
        originalPrice: primaryOriginalPrice,
        image: heroImage,
        galleryImages: galleryImages.length > 0 ? galleryImages : [heroImage],
        sizes: variants.map((v) => v.sizeLabel),
        selectedSize: variants[0]?.sizeLabel,
        inStock: isActive && variants.some((v) => v.stock > 0),
        stockCount: variants.reduce((acc, v) => acc + (v.stock || 0), 0),
        isBestseller,
        isNew,
        isFlashSale,
        hashtag: hashtag.trim() || undefined,
        rating: product?.rating || 0,
        reviewsCount: product?.reviewsCount || 0,
        customBadge: customBadge.trim() || undefined,
        whatItDoes: whatItDoes.filter((b) => b.trim().length > 0),
        whoItsFor: {
          skinTypes: selectedSkinTypes,
          concerns: selectedConcerns
        },
        keyIngredients: ingredients.filter((ing) => ing.name.trim().length > 0),
        howToUse: {
          routine,
          step: routineStep,
          instructions: instructions.trim(),
          precautions: precautions.trim()
        },
        brandInfo: {
          origin: origin.trim(),
          crueltyFree,
          guarantee: guarantee.trim()
        },
        distributorStock: hubStocks
      };

      await onSave(productPayload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save product. Please verify fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 md:p-8">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0F0F10]/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Centered Modal Surface */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] z-10 border border-[#EAE8E3] animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#EAE8E3] flex items-center justify-between bg-[#FAF9F6]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-[#FAF9F6] text-[#0F0F10] border border-[#E5E7EB] font-bold">
                {product ? 'Catalog Editor' : 'New Formulation'}
              </span>
              <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#0F0F10] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F0F10]" />
                {isActive ? 'Published' : 'Draft'}
              </span>
            </div>
            <h3 className="text-lg font-heading font-extrabold text-[#0F0F10]">
              {product ? product.name : 'Create New Formulation'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#0F0F10] hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 6 Luxury Minimalist Tabs */}
        <div className="flex border-b border-[#E5E7EB] bg-[#FAF9F6] px-4 gap-1 overflow-x-auto text-xs font-mono">
          {[
            { id: 'identity', label: '1. Identity', icon: Tag },
            { id: 'pricing', label: '2. Pricing', icon: DollarSign },
            { id: 'natural', label: '3. Natural ACF', icon: FlaskConical },
            { id: 'media', label: '4. Photography', icon: ImageIcon },
            { id: 'logistics', label: '5. Hub Logistics', icon: Layers },
            { id: 'flags', label: '6. Brand Ethics', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 flex items-center gap-1.5 border-b-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isTabActive
                    ? 'border-[#0F0F10] text-[#0F0F10] font-bold bg-white'
                    : 'border-transparent text-[#6B7280] hover:text-[#0F0F10]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* TAB 1: IDENTITY */}
          {activeTab === 'identity' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#0F0F10] mb-1 uppercase tracking-wide">
                  Product Name *
                </label>
                <input
                  type="text"
                  aria-label="Product name" value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Bio-Active Barrier Cream"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs font-medium focus:outline-none focus:border-[#0F0F10]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#0F0F10] mb-1 uppercase tracking-wide">
                    Brand Label
                  </label>
                  <input
                    type="text"
                    aria-label="Brand" value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#0F0F10] mb-1 uppercase tracking-wide">
                    Slug (URL Key)
                  </label>
                  <input
                    type="text"
                    aria-label="Product slug" value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAF9F6] text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#0F0F10] mb-1 uppercase tracking-wide">
                    Primary Category
                  </label>
                  <select
                    aria-label="Primary category" value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs cursor-pointer"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#0F0F10] mb-1 uppercase tracking-wide">
                    Sub-Category / Discipline
                  </label>
                  <input
                    type="text"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    placeholder="e.g. Barrier Cream, Treatment Oil"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F0F10] mb-1 uppercase tracking-wide">
                  Natural Tagline
                </label>
                <input
                  type="text"
                  aria-label="Product tagline" value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Ultra-repairing lipid balm for stressed epidermal barriers"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F0F10] mb-1 uppercase tracking-wide">
                  Editorial Formulation Description
                </label>
                <textarea
                  rows={4}
                  aria-label="Product description" value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe natural efficacy, origin ingredients, scent profile, and ritual application..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F0F10] mb-1 uppercase tracking-wide">
                  Social Hashtag (Community Buzz Integration)
                </label>
                <input
                  type="text"
                  value={hashtag}
                  onChange={(e) => setHashtag(e.target.value)}
                  placeholder="#DeslaBarrierRepair"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PRICING & VARIANTS */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#0F0F10] uppercase tracking-wide">
                    SKU &amp; Size Variants
                  </h4>
                  <p className="text-[11px] text-[#6B7280]">
                    Authoritative Nigerian Naira (₦ NGN) storage.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="px-3.5 py-1.5 rounded-full bg-[#0F0F10] text-white text-xs font-bold flex items-center gap-1 hover:bg-[#27272A] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Variant
                </button>
              </div>

              <div className="space-y-3">
                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-[#E5E7EB] bg-white shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#F3F4F6]">
                      <span className="text-[11px] font-mono font-bold text-[#0F0F10]">
                        Variant #{idx + 1}
                      </span>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="text-rose-600 hover:text-rose-800 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-[#6B7280] mb-1">
                          SKU Code
                        </label>
                        <input
                          type="text"
                          aria-label={`SKU ${idx + 1}`} value={v.sku}
                          onChange={(e) => handleUpdateVariant(idx, 'sku', e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-mono uppercase bg-[#FAF9F6]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-[#6B7280] mb-1">
                          Volume / Packaging Label
                        </label>
                        <input
                          type="text"
                          aria-label={`Size ${idx + 1}`} value={v.sizeLabel}
                          onChange={(e) => handleUpdateVariant(idx, 'sizeLabel', e.target.value)}
                          placeholder="e.g. 50ml / 1.7 fl oz"
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-[#6B7280] mb-1">
                          Retail Price (₦)
                        </label>
                        <input
                          type="number"
                          aria-label={`Price NGN ${idx + 1}`} value={v.priceNgn || ''}
                          onChange={(e) => handleUpdateVariant(idx, 'priceNgn', Number(e.target.value))}
                          placeholder="24500"
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-bold text-[#0F0F10]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-[#6B7280] mb-1">
                          Compare-At (₦)
                        </label>
                        <input
                          type="number"
                          aria-label={`Compare price NGN ${idx + 1}`} value={v.compareAtNgn || ''}
                          onChange={(e) =>
                            handleUpdateVariant(
                              idx,
                              'compareAtNgn',
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          placeholder="28000"
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs text-[#6B7280]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-[#6B7280] mb-1">
                          Central Stock Units
                        </label>
                        <input
                          type="number"
                          aria-label={`Stock quantity ${idx + 1}`} value={v.stock}
                          onChange={(e) => handleUpdateVariant(idx, 'stock', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-bold text-[#0F0F10]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: NATURAL BENEFITS & RITUAL ACF */}
          {activeTab === 'natural' && (
            <div className="space-y-6">
              {/* What It Does (Natural Bullet Points) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#0F0F10] uppercase tracking-wide">
                      Natural Benefits ("What It Does" Accordion)
                    </h4>
                    <p className="text-[11px] text-[#6B7280]">
                      Renders directly on PDP accordion as natural bullet points.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {whatItDoes.map((bullet, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0F0F10] shrink-0" />
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWhatItDoes((prev) => prev.map((b, i) => (i === idx ? val : b)));
                        }}
                        className="flex-1 bg-transparent text-xs text-[#0F0F10] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveBullet(idx)}
                        className="text-[#6B7280] hover:text-rose-600 p-1 cursor-pointer"
                        title="Remove bullet"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newBulletText}
                      onChange={(e) => setNewBulletText(e.target.value)}
                      placeholder="Add a new natural benefit bullet..."
                      className="flex-1 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddBullet();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddBullet}
                      className="px-4 py-2 rounded-xl bg-[#0F0F10] text-white text-xs font-bold hover:bg-[#27272A] cursor-pointer shrink-0"
                    >
                      Add Bullet
                    </button>
                  </div>
                </div>
              </div>

              {/* Application Ritual & Precautions */}
              <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
                <h4 className="text-xs font-bold text-[#0F0F10] uppercase tracking-wide">
                  Application Ritual &amp; Safety Precautions
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#6B7280] mb-1">
                      Regimen Timing
                    </label>
                    <select
                      value={routine}
                      onChange={(e) => setRoutine(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs cursor-pointer"
                    >
                      <option value="AM">Morning (AM)</option>
                      <option value="PM">Evening (PM)</option>
                      <option value="AM & PM">Both Morning &amp; Evening (AM &amp; PM)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#6B7280] mb-1">
                      Regimen Step
                    </label>
                    <select
                      value={routineStep}
                      onChange={(e) => setRoutineStep(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs cursor-pointer"
                    >
                      <option value="Cleanse">01 / CLEANSE</option>
                      <option value="Treat">02 / TREAT</option>
                      <option value="Moisturize">03 / MOISTURIZE</option>
                      <option value="Protect">04 / PROTECT (SPF)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#6B7280] mb-1">
                    Step Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g. Apply 2-3 drops to cleansed skin morning and evening..."
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#6B7280] mb-1">
                    Safety Precautions &amp; Patch Test Warning
                  </label>
                  <textarea
                    rows={2}
                    value={precautions}
                    onChange={(e) => setPrecautions(e.target.value)}
                    placeholder="e.g. For external topical use only. Conduct a 24-hour patch test..."
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs resize-none"
                  />
                </div>
              </div>

              {/* Target Audience: Skin Types & Concerns */}
              <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
                <h4 className="text-xs font-bold text-[#0F0F10] uppercase tracking-wide">
                  Target Skin Types &amp; Concerns
                </h4>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#6B7280] mb-2">
                    Compatible Skin Types
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SKIN_TYPE_OPTIONS.map((type) => {
                      const isSelected = selectedSkinTypes.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleSkinType(type)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#0F0F10] text-white border-[#0F0F10]'
                              : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-[#FAF9F6]'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#6B7280] mb-2">
                    Natural Concerns Addressed
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CONCERN_OPTIONS.map((concern) => {
                      const isSelected = selectedConcerns.includes(concern);
                      return (
                        <button
                          key={concern}
                          type="button"
                          onClick={() => toggleConcern(concern)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#0F0F10] text-white border-[#0F0F10]'
                              : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-[#FAF9F6]'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                          {concern}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Active Natural Ingredients */}
              <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#0F0F10] uppercase tracking-wide">
                    Active Natural Ingredients
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="text-xs text-[#0F0F10] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Ingredient
                  </button>
                </div>

                {ingredients.map((ing, idx) => (
                  <div key={idx} className="p-3 rounded-2xl border border-[#E5E7EB] bg-white space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={ing.name}
                          onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value)}
                          placeholder="Ingredient name (e.g. Ceramide NP)"
                          className="w-full px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-xs font-medium"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={ing.percentage}
                          onChange={(e) => handleUpdateIngredient(idx, 'percentage', e.target.value)}
                          placeholder="Assay % (e.g. 3.5%)"
                          className="w-full px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-xs text-center font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={ing.description}
                        onChange={(e) => handleUpdateIngredient(idx, 'description', e.target.value)}
                        placeholder="Natural mechanism (e.g. Restores intercellular lipid bilayers)"
                        className="flex-1 px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-xs text-[#6B7280]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PHOTOGRAPHY & MEDIA */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              {/* Primary Packshot */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-[#0F0F10] uppercase tracking-wide">
                    Primary Packshot Photography *
                  </label>
                  <span className="text-[10px] text-[#6B7280]">
                    Max 10MB (JPEG, PNG, WEBP, GIF)
                  </span>
                </div>

                {heroUploadError && (
                  <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>{heroUploadError}</span>
                  </div>
                )}

                <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Image Preview */}
                    <div className="relative w-28 h-28 rounded-2xl border border-[#E5E7EB] overflow-hidden bg-[#FAF9F6] shrink-0 shadow-2xs group">
                      <img
                        src={heroImage}
                        alt="Primary Hero"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/product_barrier_cream.jpg';
                        }}
                      />
                      {isUploadingHero && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex flex-col items-center justify-center text-white gap-1 p-2 text-center">
                          <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
                          <span className="text-[10px] font-medium">Uploading...</span>
                        </div>
                      )}
                    </div>

                    {/* Upload Controls & Drag-Drop Target */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleHeroFileUpload(file);
                      }}
                      className="flex-1 w-full border-2 border-dashed border-[#E5E7EB] hover:border-[#0F0F10] rounded-xl p-4 text-center transition-colors bg-[#FAF9F6]/60 flex flex-col items-center justify-center gap-2"
                    >
                      <input
                        type="file"
                        ref={heroFileRef}
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleHeroFileUpload(file);
                        }}
                      />

                      <div className="w-9 h-9 rounded-full bg-white shadow-2xs border border-[#E5E7EB] flex items-center justify-center text-[#0F0F10]">
                        <Upload className="w-4 h-4 text-[#0F0F10]" />
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => heroFileRef.current?.click()}
                          disabled={isUploadingHero}
                          className="text-xs font-bold text-[#0F0F10] hover:text-[#997A2E] underline cursor-pointer disabled:opacity-50"
                        >
                          {isUploadingHero ? 'Uploading file...' : 'Click to upload packshot photo'}
                        </button>
                        <p className="text-[10.5px] text-[#6B7280] mt-0.5">
                          or drag and drop your formulation image here
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* URL Text Fallback / Direct Editor */}
                  <div className="pt-2 border-t border-[#F3EEE3]">
                    <label className="block text-[10px] font-mono uppercase text-[#6B7280] mb-1">
                      Direct Photo URL or Asset Path:
                    </label>
                    <input
                      type="text"
                      aria-label="Product image URL"
                      value={heroImage}
                      onChange={(e) => setHeroImage(e.target.value)}
                      placeholder="e.g. /uploads/products/packshot.jpg or https://..."
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-[#FAF9F6] text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Pick Presets */}
              <div>
                <label className="block text-[11px] font-bold text-[#0F0F10] mb-2 uppercase tracking-wide">
                  Quick Pick Studio Presets
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setHeroImage(preset.url)}
                      className="p-1.5 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#0F0F10] text-center transition flex flex-col items-center gap-1 cursor-pointer group"
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-12 h-12 rounded-lg object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="text-[9.5px] font-medium text-[#0F0F10] truncate w-full">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gallery List */}
              <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-[#0F0F10] uppercase tracking-wide">
                    Gallery Perspectives &amp; Texture Shots ({galleryImages.length})
                  </label>
                  <span className="text-[10px] text-[#6B7280]">
                    PDP multi-angle carousel
                  </span>
                </div>

                {galleryUploadError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span>{galleryUploadError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="file"
                    ref={galleryFileRef}
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleGalleryFilesUpload(e.target.files);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => galleryFileRef.current?.click()}
                    disabled={isUploadingGallery}
                    className="px-4 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] hover:border-[#0F0F10] text-[#0F0F10] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {isUploadingGallery ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
                        <span>Uploading Angles...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Angle Photos</span>
                      </>
                    )}
                  </button>

                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={newGalleryUrl}
                      onChange={(e) => setNewGalleryUrl(e.target.value)}
                      placeholder="Or paste angle photo URL..."
                      className="flex-1 px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddGalleryUrl}
                      className="px-4 py-2 rounded-xl bg-[#0F0F10] text-white text-xs font-bold hover:bg-[#27272A] cursor-pointer"
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-2">
                  {galleryImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl border border-[#E5E7EB] overflow-hidden aspect-square bg-[#FAF9F6] shadow-2xs"
                    >
                      <img src={img} alt={"Perspective " + (idx + 1)} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryUrl(idx)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[#0F0F10] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow cursor-pointer"
                        title="Remove perspective image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REGIONAL HUB LOGISTICS ACF */}
          {activeTab === 'logistics' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[#0F0F10] uppercase tracking-wide">
                  Regional Warehouse &amp; Hub Stock Allocations
                </h4>
                <p className="text-[11px] text-[#6B7280]">
                  Manage physical hub pools through Inventory and Distributor Hubs. Product publication updates central stock only.
                </p>
              </div>

              <div className="space-y-3">
                {isLiveBackend ? <p className="rounded-xl border p-4 text-sm">Use Inventory → Move Stock to allocate real SKUs to an exact hub. Hub balances are maintained in the stock ledger.</p> : <>
                {hubStocks.map((hub, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-[#E5E7EB] bg-white flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-center text-[#0F0F10]">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <strong className="text-xs text-[#0F0F10] block">{hub.city}</strong>
                        <span className="text-[10px] font-mono text-[#6B7280]">
                          {hub.quantity > 0 ? `${hub.quantity} Units Allocated` : 'Exhausted / Low'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-[10px] font-mono uppercase text-[#6B7280]">Units:</label>
                      <input
                        type="number"
                        min="0"
                        value={hub.quantity}
                        onChange={(e) => handleUpdateHubStock(idx, Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 px-3 py-1.5 rounded-xl border border-[#E5E7EB] text-xs font-bold font-mono text-center"
                      />
                    </div>
                  </div>
                ))}
                </>}
              </div>
            </div>
          )}

          {/* TAB 6: BRAND ETHICS & RIBBONS ACF */}
          {activeTab === 'flags' && (
            <div className="space-y-5">
              {/* Brand Info ACF */}
              <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-white space-y-3">
                <h4 className="text-xs font-bold text-[#0F0F10] uppercase tracking-wide">
                  Brand Heritage &amp; Natural Origin ACF
                </h4>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#6B7280] mb-1">
                    Formulation Origin &amp; Lab Standards
                  </label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="e.g. Lagos Formulation Laboratory & Paris Derm-Center"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#6B7280] mb-1">
                    Authenticity &amp; Exchange Guarantee
                  </label>
                  <input
                    type="text"
                    value={guarantee}
                    onChange={(e) => setGuarantee(e.target.value)}
                    placeholder="e.g. 100% Natural Assay Authenticity Guaranteed"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-xs font-bold text-[#0F0F10] block">Cruelty-Free Certified</span>
                    <span className="text-[10px] text-[#6B7280]">Guarantees no animal testing in African or international labs.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={crueltyFree}
                    onChange={(e) => setCrueltyFree(e.target.checked)}
                    className="w-4 h-4 accent-[#0F0F10] cursor-pointer"
                  />
                </div>
              </div>

              {/* Custom Ribbon Badge ACF */}
              <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-white space-y-3">
                <h4 className="text-xs font-bold text-[#0F0F10] uppercase tracking-wide">
                  Merchandising Ribbon / Custom Badge ACF
                </h4>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#6B7280] mb-1">
                    Custom Ribbon Text
                  </label>
                  <input
                    type="text"
                    value={customBadge}
                    onChange={(e) => setCustomBadge(e.target.value)}
                    placeholder="e.g. NAFDAC Certified, Cold-Pressed Nilotica"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-mono"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRESET_BADGES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomBadge(preset)}
                      className="px-2.5 py-1 rounded-full text-[10px] font-mono border border-[#E5E7EB] bg-[#FAF9F6] text-[#0F0F10] hover:border-[#0F0F10] cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Switches */}
              <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="text-xs text-[#0F0F10] block">Publish Formulation to Live Storefront</strong>
                    <span className="text-[11px] text-[#6B7280]">
                      When active, formulation appears in customer search, catalogue shelves, and routine builders.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-[#0F0F10] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#F3F4F6]">
                  <div>
                    <strong className="text-xs text-[#0F0F10] block">Featured Bestseller</strong>
                    <span className="text-[11px] text-[#6B7280]">
                      Pins product to high-priority shelf position.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isBestseller}
                    onChange={(e) => setIsBestseller(e.target.checked)}
                    className="w-4 h-4 accent-[#0F0F10] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#F3F4F6]">
                  <div>
                    <strong className="text-xs text-[#0F0F10] block">New Natural Drop</strong>
                    <span className="text-[11px] text-[#6B7280]">
                      Displays in "Just Formulated" carousel and alerts routine builders.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isNew}
                    onChange={(e) => setIsNew(e.target.checked)}
                    className="w-4 h-4 accent-[#0F0F10] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#F3F4F6]">
                  <div>
                    <strong className="text-xs text-[#0F0F10] block">Harmattan Flash Sale</strong>
                    <span className="text-[11px] text-[#6B7280]">
                      Activates special seasonal discount tag and highlights compare-at price.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isFlashSale}
                    onChange={(e) => setIsFlashSale(e.target.checked)}
                    className="w-4 h-4 accent-[#0F0F10] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Sticky Footer */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#FAF9F6] flex items-center justify-between sticky bottom-0 z-20">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-[#E5E7EB] bg-white text-xs font-bold text-[#6B7280] hover:text-[#0F0F10] hover:bg-[#FAF9F6] transition cursor-pointer"
          >
            Discard
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-7 py-2.5 rounded-full bg-[#0F0F10] text-white text-xs font-bold hover:bg-[#27272A] active:scale-[0.98] transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Saving Formulation...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{product ? 'Save & Update Product' : 'Publish to Catalog'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
