import React, { useState } from 'react';
import {
  Megaphone,
  Clock,
  ArrowRight,
  CheckCircle2,
  Download,
  AlertCircle,
  X,
  Upload,
  Link as LinkIcon,
  Video,
  FileCheck,
  Send
} from 'lucide-react';
import { FilterTabs } from '../shared/FilterTabs';
import { ActionDrawer } from '../shared/ActionDrawer';
import { useApp } from '../../../context/AppContext';
import { CreatorCampaignBrief, CreatorCampaignSubmission } from '../../../types';

export const CreatorCampaigns: React.FC = () => {
  const {
    creatorCampaigns,
    creatorSubmissions,
    authUser,
    applyToCampaign,
    submitCampaignDeliverable
  } = useApp();

  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('available');
  const [selectedCampaign, setSelectedCampaign] = useState<CreatorCampaignBrief | null>(null);

  // Application Drawer state
  const [pitchText, setPitchText] = useState('');
  const [appliedCampaignIds, setAppliedCampaignIds] = useState<string[]>([]);

  // Deliverable Submission Modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitCampaignId, setSubmitCampaignId] = useState<string>('');
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const campaigns = creatorCampaigns.map((c) => ({
    ...c,
    eligibility: 'Eligible (Level 2+)',
    products: ['Radiant Glow Formulation', 'Barrier Cream SPF50+']
  }));

  const handleApply = async (campaign: CreatorCampaignBrief) => {
    const saved = await applyToCampaign(campaign.id, authUser?.profile?.displayName || authUser?.email?.split('@')[0] || 'creator', pitchText);
    if (!saved) { setToastMessage('Could not submit the campaign application. Refresh and try again.'); return; }
    if (!appliedCampaignIds.includes(campaign.id)) {
      setAppliedCampaignIds((prev) => [...prev, campaign.id]);
    }
    setSelectedCampaign(null);
    setToastMessage(`Application for "${campaign.title}" submitted to natural brand marketing!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeliverableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverableUrl.trim()) return;

    const saved = await submitCampaignDeliverable(submitCampaignId, authUser?.profile?.displayName || authUser?.email?.split('@')[0] || 'creator', deliverableUrl.trim());
    if (!saved) { setToastMessage('Could not submit this deliverable. Confirm the application is approved and try again.'); return; }
    setIsSubmitModalOpen(false);
    setDeliverableUrl('');
    setActiveTab('active');
    setToastMessage('Deliverable link submitted! Marketing will review within 24 hours.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
            Opportunities &amp; Brand Collaborations
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
            Creator Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Join verified brand briefs, access boosted commission rates, and earn milestone bonuses.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="px-5 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold shadow-xs active:scale-[0.97] transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Upload size={14} className="text-[#D4AF37]" />
          <span>Submit Deliverable Link</span>
        </button>
      </div>

      <FilterTabs
        tabs={[
          { id: 'available', label: 'Available Opportunities', count: campaigns.length },
          { id: 'active', label: 'My Active Briefs & Submissions', count: creatorSubmissions.length + appliedCampaignIds.length },
          { id: 'completed', label: 'Past Completed', count: creatorSubmissions.filter((s) => s.status === 'APPROVED' || s.status === 'PAID').length }
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as typeof activeTab)}
      />

      {/* ========================================================= */}
      {/* TAB 1: AVAILABLE OPPORTUNITIES */}
      {/* ========================================================= */}
      {activeTab === 'available' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((camp) => (
            <article
              key={camp.id}
              className="rounded-3xl border border-[#E5E7EB] bg-white overflow-hidden shadow-xs hover:border-[#D4AF37] hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-52 w-full bg-[#FAF9F6] overflow-hidden">
                  <img
                    src={camp.heroImage}
                    alt={camp.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-[#0F0F10]/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-mono font-bold">
                    {camp.category}
                  </div>
                  <div className="absolute top-3 right-3 bg-[#0F0F10] text-white px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
                    <Clock size={11} />
                    <span>{camp.deadline}</span>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <h2 className="font-heading font-extrabold text-xl text-[#0F0F10]">
                    {camp.title}
                  </h2>
                  <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-2">
                    {camp.description}
                  </p>

                  <div className="p-3.5 rounded-2xl bg-[#FBF5E8] border border-[#D4AF37]/30 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-mono text-[#997A2E] uppercase block">
                        Reward Rate
                      </span>
                      <span className="font-extrabold text-[#0F0F10] text-sm font-mono">
                        {camp.commissionRate}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-[#997A2E] uppercase block">
                        Milestone Reward
                      </span>
                      <span className="font-bold text-[#0F0F10]">{camp.bonus}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => setSelectedCampaign(camp)}
                  className="w-full py-3 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
                >
                  <span>Read Full Brief &amp; Apply</span>
                  <ArrowRight size={14} className="text-[#D4AF37]" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ACTIVE BRIEFS & SUBMISSIONS */}
      {/* ========================================================= */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {/* Submissions Section */}
          <div className="rounded-3xl bg-white border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="font-heading font-extrabold text-lg text-[#0F0F10]">
                  Submitted Deliverables ({creatorSubmissions.length})
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Natural and marketing approvals for published content
                </p>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-4 py-2 rounded-full bg-[#0F0F10] text-[#D4AF37] text-xs font-bold hover:bg-[#27272A] cursor-pointer flex items-center gap-1.5"
              >
                <Upload size={13} />
                <span>Submit Deliverable</span>
              </button>
            </div>

            <div className="divide-y divide-[#E5E7EB]">
              {creatorSubmissions.map((sub) => (
                <div key={sub.id} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF9F6] transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0F0F10]">{sub.campaignTitle}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        sub.status === 'APPROVED'
                          ? 'bg-black text-[#D4AF37] border border-[#D4AF37]/30'
                          : sub.status === 'PAID'
                          ? 'bg-emerald-900 text-white'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                      <span className="font-mono text-[11px]">{sub.submittedAt}</span>
                      <span>•</span>
                      <a
                        href={sub.deliverableUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0F0F10] font-mono underline hover:text-[#997A2E] truncate max-w-xs"
                      >
                        {sub.deliverableUrl}
                      </a>
                    </div>
                    {sub.notes && (
                      <p className="text-[11px] text-[#4B5563] mt-1 bg-white px-3 py-1.5 rounded-lg border border-[#E5E7EB] inline-block">
                        Note: {sub.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-mono font-bold text-[#0F0F10]">
                      {sub.status === 'APPROVED' ? 'Milestone Bonus Cleared ✓' : 'Under Review'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Briefs List */}
          <div className="rounded-3xl bg-white border border-[#E5E7EB] shadow-xs p-6 space-y-4">
            <h3 className="font-heading font-extrabold text-base text-[#0F0F10]">
              Active Collaborative Briefs In Production
            </h3>
            <div className="space-y-3">
              {campaigns.filter((c) => appliedCampaignIds.includes(c.id)).map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-[#0F0F10]">{c.title}</h4>
                    <p className="text-xs text-[#6B7280] font-mono mt-0.5">
                      Deadline: {c.deadline} • Rate: {c.commissionRate} ({c.bonus})
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSubmitCampaignId(c.id);
                      setIsSubmitModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    Submit Deliverable
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PAST COMPLETED */}
      {/* ========================================================= */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {creatorCampaigns.filter(campaign => campaign.status === 'COMPLETED').map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-heading font-bold text-sm text-[#0F0F10]">{item.title}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold">
                    Completed campaign
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-0.5 font-mono">
                  {item.category}
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-[#0F0F10] self-start sm:self-auto">
                Completed
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* CAMPAIGN BRIEF ACTION DRAWER */}
      {/* ========================================================= */}
      <ActionDrawer
        isOpen={Boolean(selectedCampaign)}
        onClose={() => setSelectedCampaign(null)}
        title={selectedCampaign?.title || 'Campaign Brief'}
        subtitle={selectedCampaign?.category}
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => selectedCampaign && handleApply(selectedCampaign)}
              className="flex-1 py-3 rounded-full bg-[#0F0F10] text-[#D4AF37] font-bold text-xs shadow-md cursor-pointer hover:bg-[#27272A] transition-transform active:scale-95"
            >
              Submit Application to Campaign
            </button>
          </div>
        }
      >
        {selectedCampaign && (
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase text-[#997A2E]">
                Campaign Summary
              </span>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                {selectedCampaign.description}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FBF5E8] border border-[#D4AF37]/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#997A2E] uppercase block">Commission Rate</span>
                <span className="font-mono font-bold text-[#0F0F10] text-sm">{selectedCampaign.commissionRate}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-[#997A2E] uppercase block">Milestone Bonus</span>
                <span className="font-bold text-[#0F0F10] text-sm">{selectedCampaign.bonus}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#0F0F10]">Deliverables Required</h4>
              <ul className="space-y-1.5">
                {(selectedCampaign.deliverables || []).map((d: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-[#4B5563]">
                    <CheckCircle2 size={14} className="text-[#0F0F10] shrink-0" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[#0F0F10]">Natural Guidelines</h4>
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-[11px] text-[#4B5563] space-y-1">
                <p>• Avoid exaggerated claims regarding skin lightening or bleaching.</p>
                <p>• Emphasize natural hydration, barrier lipid restoration, and natural radiance.</p>
                <p>• Feature tagged product in application shots with clear lighting.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-[#0F0F10] block">
                Creator Production Pitch / Angle
              </label>
              <textarea
                rows={3}
                value={pitchText}
                onChange={(e) => setPitchText(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        )}
      </ActionDrawer>

      {/* ========================================================= */}
      {/* SUBMIT DELIVERABLE MODAL */}
      {/* ========================================================= */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-[#E5E7EB] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAF9F6]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center">
                  <Upload size={16} />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-[#0F0F10]">
                    Submit Campaign Deliverable
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Post your live social media URL for natural review &amp; payout
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-[#6B7280] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleDeliverableSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0F0F10] mb-1">
                  Target Campaign Brief
                </label>
                <select
                  value={submitCampaignId}
                  onChange={(e) => setSubmitCampaignId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] focus:bg-white focus:outline-none font-medium"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.commissionRate})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F0F10] mb-1">
                  Published Social Link (Instagram Reel / TikTok / YouTube)
                </label>
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-3.5 top-3 text-[#9CA3AF]" />
                  <input
                    type="url"
                    required
                    placeholder="https://instagram.com/reel/desla_routine_glow..."
                    value={deliverableUrl}
                    onChange={(e) => setDeliverableUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-[11px] text-[#6B7280] space-y-1">
                <span className="font-bold text-[#0F0F10] block">Automated Verification Checklist:</span>
                <p>• Post must tag <strong className="text-[#0F0F10]">@deslabeauty</strong> and include your promo code.</p>
                <p>• Once verified by natural marketing, milestone bonus is automatically cleared to your NUBAN balance.</p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-[#E5E7EB] text-xs font-semibold text-[#0F0F10] hover:bg-[#FAF9F6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-[#D4AF37] text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>Submit for Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
