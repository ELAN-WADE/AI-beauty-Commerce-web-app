import React, { useState } from 'react';
import {
  Video,
  Sparkles,
  Star,
  BookOpen,
  FileText,
  Palette,
  Plus,
  Trash2,
  Check,
  ArrowRight,
  ArrowLeft,
  Eye,
  ShoppingBag,
  ExternalLink,
  Upload,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export interface CreatorContentEditorProps {
  onPublishSuccess?: () => void;
  onCancel?: () => void;
}

export type ContentFormat =
  | 'routine'
  | 'video'
  | 'review'
  | 'tutorial'
  | 'article'
  | 'lookbook';

export const CreatorContentEditor: React.FC<CreatorContentEditorProps> = ({
  onPublishSuccess,
  onCancel
}) => {
  const { products } = useApp();
  const [selectedFormat, setSelectedFormat] = useState<ContentFormat>('routine');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [routineTitle, setRoutineTitle] = useState('Morning Melanin Barrier Shield');
  const [routineCategory, setRoutineCategory] = useState('Hydration & Barrier Repair');
  const [promoCode, setPromoCode] = useState('AMARA10');
  const [steps, setSteps] = useState([
    {
      id: 'step-1',
      title: 'Gentle Amino Acid Cleanse',
      productId: products[0]?.id || 'prod-1',
      proTip: 'Massage gently into damp skin for 60 seconds with lukewarm water.'
    },
    {
      id: 'step-2',
      title: 'Antioxidant Radiance Treatment',
      productId: products[1]?.id || 'prod-2',
      proTip: 'Press 3-4 drops into skin while still slightly damp to lock in maximum hydration.'
    }
  ]);
  const [isPublished, setIsPublished] = useState(false);

  const formats = [
    { id: 'video', label: 'Short Video', icon: Video, desc: 'Reel or TikTok clip' },
    { id: 'routine', label: 'Beauty Routine', icon: Sparkles, desc: 'Step-by-step skincare regimen', popular: true },
    { id: 'review', label: 'Product Review', icon: Star, desc: 'In-depth clinical formulation review' },
    { id: 'tutorial', label: 'Tutorial', icon: BookOpen, desc: 'Application technique guide' },
    { id: 'article', label: 'Skin Article', icon: FileText, desc: 'Educational skin health editorial' },
    { id: 'lookbook', label: 'Look / Collection', icon: Palette, desc: 'Curated beauty product pairing' }
  ];

  const handleAddStep = () => {
    setSteps([
      ...steps,
      {
        id: `step-${Date.now()}`,
        title: 'Formulation Step',
        productId: products[2]?.id || products[0]?.id || 'prod-1',
        proTip: 'Apply evenly and allow 30 seconds to absorb before next layer.'
      }
    ]);
  };

  const handleRemoveStep = (id: string) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((s) => s.id !== id));
  };

  const handlePublish = () => {
    setIsPublished(true);
    if (onPublishSuccess) {
      setTimeout(onPublishSuccess, 1200);
    }
  };

  if (isPublished) {
    return (
      <div className="p-8 sm:p-14 rounded-3xl bg-white border border-[#E5E7EB] text-center max-w-xl mx-auto shadow-md animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E] bg-[#FBF5E8] px-3 py-1 rounded-full border border-[#D4AF37]/30">
          Published to Desla! Storefront
        </span>
        <h2 className="font-heading font-extrabold text-2xl text-[#0F0F10] mt-3">
          {routineTitle}
        </h2>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-2 max-w-md mx-auto">
          Your routine is now live and shoppable. Clients can buy the full regimen with your promo code <strong>{promoCode}</strong> (12% commission attributed to you).
        </p>

        <div className="mt-6 p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs font-mono flex items-center justify-between gap-3">
          <span className="truncate text-[#4B5563]">delsla.com/@amara/r/morning-barrier</span>
          <button
            onClick={() => alert('Link copied to clipboard!')}
            className="px-3 py-1 rounded-full bg-[#0F0F10] text-white font-bold text-[11px] shrink-0 cursor-pointer"
          >
            Copy Link
          </button>
        </div>

        <div className="mt-8 flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-full bg-[#0F0F10] text-white text-xs font-semibold cursor-pointer"
          >
            Return to Studio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200 pb-12">
      {/* Top Workflow Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
            Content Studio Builder
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
            Create New Content
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => alert('Draft saved successfully to My Content!')}
            className="px-4 py-2 rounded-full border border-[#D4AF37] bg-[#FBF5E8] hover:bg-[#F3EEE3] text-xs font-bold text-[#997A2E] cursor-pointer"
          >
            Save Draft
          </button>
        </div>
      </div>

      {/* Format Selector Grid */}
      <section className="space-y-3">
        <label className="text-xs font-bold text-[#0F0F10] block">
          What would you like to create today?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {formats.map((f) => {
            const Icon = f.icon;
            const isSelected = selectedFormat === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFormat(f.id as ContentFormat)}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#D4AF37] bg-[#FBF5E8] shadow-xs ring-1 ring-[#D4AF37]'
                    : 'border-[#E5E7EB] bg-white hover:border-[#D4AF37]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-[#0F0F10] text-[#D4AF37]' : 'bg-[#FAF9F6] text-[#6B7280]'
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  {f.popular && (
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#997A2E] bg-white px-1.5 py-0.2 rounded-full border border-[#D4AF37]/30">
                      Popular
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#0F0F10]">{f.label}</h3>
                  <p className="text-[10px] text-[#6B7280] line-clamp-1 mt-0.5">{f.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Routine Stepper Header */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-between text-xs">
        <span className="font-mono font-bold text-[#997A2E]">
          Step {currentStep} of 4: {currentStep === 1 ? 'Regimen Details' : currentStep === 2 ? 'Formulation Steps' : currentStep === 3 ? 'Attribution & Promo' : 'Live Preview'}
        </span>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((stepNum) => (
            <div
              key={stepNum}
              className={`w-6 h-1.5 rounded-full transition-all ${
                currentStep >= stepNum ? 'bg-[#D4AF37]' : 'bg-[#E5E7EB]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Regimen Details */}
      {currentStep === 1 && (
        <section className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-5">
          <div>
            <label className="text-xs font-bold text-[#0F0F10] block mb-1">
              Routine Title
            </label>
            <input
              type="text"
              value={routineTitle}
              onChange={(e) => setRoutineTitle(e.target.value)}
              placeholder="e.g. Morning Melanin Barrier Shield"
              className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#D4AF37] bg-[#FAF9F6]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#0F0F10] block mb-1">
              Primary Skin Goal / Concern
            </label>
            <select
              value={routineCategory}
              onChange={(e) => setRoutineCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#D4AF37] bg-[#FAF9F6] cursor-pointer"
            >
              <option>Hydration &amp; Barrier Repair</option>
              <option>Hyper-pigmentation &amp; Dark Spot Defense</option>
              <option>Melanin UV Defense &amp; Complexion Glow</option>
              <option>Acne Clarifying &amp; Pore Refinement</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#0F0F10] block mb-1">
              Cover Visual / Reel Media
            </label>
            <div className="border-2 border-dashed border-[#E5E7EB] rounded-2xl p-6 text-center hover:border-[#D4AF37] transition-colors cursor-pointer bg-[#FAF9F6]">
              <Upload size={24} className="mx-auto text-[#997A2E] mb-2" />
              <p className="text-xs font-semibold text-[#0F0F10]">Click to upload high-res cover photo or MP4 clip</p>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">JPG, PNG or MP4 up to 50MB (9:16 or 1:1 ratio)</p>
            </div>
          </div>
        </section>
      )}

      {/* Step 2: Formulation Steps & Products */}
      {currentStep === 2 && (
        <section className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-[#0F0F10]">
                Regimen Steps &amp; Formulations
              </h3>
              <p className="text-xs text-[#6B7280]">
                Link authentic Desla products so followers can buy directly from your routine.
              </p>
            </div>
            <button
              onClick={handleAddStep}
              className="px-3.5 py-1.5 rounded-full bg-[#0F0F10] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} className="text-[#D4AF37]" />
              <span>Add Step</span>
            </button>
          </div>

          <div className="space-y-4">
            {steps.map((st, idx) => (
              <div
                key={st.id}
                className="p-4 sm:p-5 rounded-2xl border border-[#E5E7EB] bg-[#FAF9F6] space-y-3 relative group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E] bg-white px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                    Step {idx + 1}
                  </span>
                  {steps.length > 1 && (
                    <button
                      onClick={() => handleRemoveStep(st.id)}
                      className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                      title="Remove step"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#0F0F10] block mb-1">
                      Step Name
                    </label>
                    <input
                      type="text"
                      value={st.title}
                      onChange={(e) => {
                        const newSteps = [...steps];
                        newSteps[idx].title = e.target.value;
                        setSteps(newSteps);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#0F0F10] block mb-1">
                      Linked Desla Formulation
                    </label>
                    <select
                      value={st.productId}
                      onChange={(e) => {
                        const newSteps = [...steps];
                        newSteps[idx].productId = e.target.value;
                        setSteps(newSteps);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs bg-white cursor-pointer font-medium"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (₦{p.price.toLocaleString('en-NG')})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#0F0F10] block mb-1">
                    Creator Pro-Tip / Technique
                  </label>
                  <textarea
                    rows={2}
                    value={st.proTip}
                    onChange={(e) => {
                      const newSteps = [...steps];
                      newSteps[idx].proTip = e.target.value;
                      setSteps(newSteps);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Step 3: Attribution & Promo Code */}
      {currentStep === 3 && (
        <section className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-5">
          <div>
            <label className="text-xs font-bold text-[#0F0F10] block mb-1">
              Attached Promo Code
            </label>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm font-mono font-bold bg-[#FAF9F6]"
            />
            <p className="text-[11px] text-[#6B7280] mt-1">
              Gives clients 10% off. You automatically earn 12% cash commission on every completed order.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FBF5E8] border border-[#D4AF37]/30 space-y-2">
            <h4 className="text-xs font-bold text-[#0F0F10] flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#D4AF37]" />
              <span>Attribution Summary:</span>
            </h4>
            <p className="text-xs text-[#4B5563]">
              Every customer that adds this routine or its individual items to their cart via your shared link will be permanently tagged to your creator dossier for 30 days.
            </p>
          </div>
        </section>
      )}

      {/* Step 4: Preview & Publish */}
      {currentStep === 4 && (
        <section className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-6">
          <div className="border border-[#E5E7EB] rounded-2xl p-5 bg-[#FAF9F6] max-w-md mx-auto space-y-4">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E] bg-white px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
              Live Storefront Preview
            </span>
            <h3 className="font-heading font-extrabold text-xl text-[#0F0F10]">
              {routineTitle}
            </h3>
            <p className="text-xs text-[#6B7280]">By Amara Nnadi • {routineCategory}</p>

            <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
              {steps.map((st, i) => {
                const prod = products.find((p) => p.id === st.productId) || products[0];
                return (
                  <div key={st.id} className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#0F0F10]">Step {i + 1}: {st.title}</span>
                      <p className="text-[11px] text-[#6B7280]">{prod?.name}</p>
                    </div>
                    <span className="font-mono font-bold text-[#0F0F10]">
                      ₦{prod?.price.toLocaleString('en-NG')}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="w-full py-2.5 rounded-full bg-[#0F0F10] text-white text-xs font-bold cursor-default"
            >
              Add Full Routine to Cart with {promoCode}
            </button>
          </div>
        </section>
      )}

      {/* Sticky Bottom Actions */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#E5E7EB]">
        {currentStep > 1 ? (
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            className="px-5 py-2.5 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        {currentStep < 4 ? (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            className="px-6 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            onClick={handlePublish}
            className="px-8 py-3 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-[#D4AF37] text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer active:scale-[0.97] transition-all"
          >
            <Check size={16} />
            <span>Publish Routine to Storefront</span>
          </button>
        )}
      </div>
    </div>
  );
};
