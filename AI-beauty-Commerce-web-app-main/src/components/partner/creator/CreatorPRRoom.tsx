import React, { useState } from 'react';
import {
  Gift,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  PackageCheck,
  AlertCircle,
  X,
  MapPin,
  Phone,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { FilterTabs } from '../shared/FilterTabs';
import { StatusBadge } from '../shared/StatusBadge';
import { useApp } from '../../../context/AppContext';
import { PRBoxOffering, CreatorPRRequest } from '../../../types';
import { usePartnerRecords } from '../../../lib/use-partner-records';
import { writePartnerWorkspace } from '../../../lib/owned-api';

export interface CreatorPRRoomProps {
  onOpenCreateWithBox?: (boxTitle: string) => void;
}

export const CreatorPRRoom: React.FC<CreatorPRRoomProps> = ({
  onOpenCreateWithBox
}) => {
  const { authUser } = useApp();
  const { records, error, loading, refresh } = usePartnerRecords('CREATOR');
  const prBoxes: PRBoxOffering[] = records.filter(record => record.kind === 'PR_BOX' && !record.ownerId).map(record => {
    const details = record.data?.details || {};
    return { id: record.id, title: record.title, category: String(details.category || 'PR kit'), retailValue: String(details.retailValue || ''), openSpots: typeof details.spotsLeft === 'number' ? String(details.spotsLeft) : 'Allocation confirmed on review', spotsLeft: typeof details.spotsLeft === 'number' ? details.spotsLeft : -1, thumbnail: record.url, description: record.body, includedProducts: Array.isArray(details.includedProducts) ? details.includedProducts as string[] : [], eligibleTiers: ['Verified'], isActive: true };
  });
  const creatorPRRequests: CreatorPRRequest[] = records.filter(record => record.kind === 'PR_REQUEST' && record.ownerId).map(record => ({ id: record.id, boxId: record.parentId || '', boxTitle: record.title, creatorName: authUser?.profile?.displayName || authUser?.email || '', creatorHandle: '', creatorTier: 'Verified', shippingAddress: record.body, requestedAt: record.createdAt, status: (record.status === 'SUBMITTED' ? 'PENDING' : record.status) as CreatorPRRequest['status'], trackingNumber: record.data?.shipping?.trackingReference || (record.status === 'DISPATCHED' ? record.reviewNote : undefined), dispatchedAt: record.data?.shipping?.dispatchedAt, deliveredAt: record.data?.shipping?.deliveredAt }));
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'delivered'>('available');

  // Request modal state
  const [selectedBoxForRequest, setSelectedBoxForRequest] = useState<PRBoxOffering | null>(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live courier tracking modal state
  const [trackingRequest, setTrackingRequest] = useState<CreatorPRRequest | null>(null);

  // Filter requests by status
  const activeRequests = creatorPRRequests.filter((r) => r.status !== 'DELIVERED');
  const deliveredRequests = creatorPRRequests.filter((r) => r.status === 'DELIVERED');

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoxForRequest) return;

    const creatorName = authUser?.profile?.displayName || authUser?.email?.split('@')[0] || 'Creator';
    const creatorHandle = `@${creatorName.toLowerCase().replace(/\s+/g, '_')}`;

    try {
      await writePartnerWorkspace({ action: 'apply', kind: 'CREATOR', publicationId: selectedBoxForRequest.id, title: selectedBoxForRequest.title, body: [shippingAddress.trim(), deliveryNotes.trim()].filter(Boolean).join('\n'), url: '', productIds: [] });
      await refresh();
      setToastMessage(`PR Box "${selectedBoxForRequest.title}" request submitted for review.`);
      setSelectedBoxForRequest(null);
      setActiveTab('active');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (error) { setToastMessage(error instanceof Error ? error.message : 'Could not submit this request. Please try again.'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {loading && <p role="status" className="text-sm">Loading PR kits…</p>}
      {error && <p role="alert" className="text-sm text-rose-700">{error}<button onClick={() => void refresh()} className="ml-3 underline">Retry</button></p>}
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
      <div className="pb-2 border-b border-[#E5E7EB]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
          VIP Sampling &amp; Press Packaging
        </span>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
          Creator PR Room
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Request complimentary formulation boxes shipped to your door, test in real life, and create honest regimens.
        </p>
      </div>

      <FilterTabs
        tabs={[
          { id: 'available', label: 'Available PR Packages', count: prBoxes.length },
          { id: 'active', label: 'Dispatched & In Transit', count: activeRequests.length },
          { id: 'delivered', label: 'Delivered & Past', count: deliveredRequests.length }
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as typeof activeTab)}
      />

      {/* Dispatched Box Alert Banner (When there's an active in-transit package) */}
      {activeRequests.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF9F6] text-[#0F0F10] border border-[#E5E7EB] flex items-center justify-center shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs sm:text-sm text-[#0F0F10]">
                  {activeRequests[0].boxTitle} — {activeRequests[0].status === 'DISPATCHED' ? 'Out with Courier' : 'Awaiting Hub Packing'}
                </h3>
                <StatusBadge status={activeRequests[0].status === 'DISPATCHED' ? 'in-transit' : 'pending'} />
              </div>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                {activeRequests[0].courier || 'Courier not recorded'} • {activeRequests[0].trackingNumber || 'Tracking not recorded'} • Destination: {activeRequests[0].shippingAddress}
              </p>
            </div>
          </div>

          <button
            onClick={() => setTrackingRequest(activeRequests[0])}
            className="px-4 py-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] shrink-0 cursor-pointer shadow-2xs"
          >
            Track Courier &amp; PIN
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: AVAILABLE PR PACKAGES */}
      {/* ========================================================= */}
      {activeTab === 'available' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prBoxes.map((box) => (
            <article
              key={box.id}
              className="rounded-3xl border border-[#E5E7EB] bg-white overflow-hidden shadow-xs hover:border-[#D4AF37] hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-48 w-full bg-[#FAF9F6] overflow-hidden">
                  <img
                    src={box.thumbnail}
                    alt={box.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-[#0F0F10]/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-mono font-bold">
                    {box.retailValue} Value (Complimentary)
                  </div>
                  <div className="absolute top-3 right-3 bg-[#0F0F10] text-[#D4AF37] px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                    Eligible Tier ✓
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                      {box.openSpots || `${box.spotsLeft} spots remaining`}
                    </span>
                    <h2 className="font-heading font-extrabold text-xl text-[#0F0F10] mt-0.5">
                      {box.title}
                    </h2>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    {box.description}
                  </p>

                  <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#9CA3AF] uppercase">
                        Deliverables:
                      </span>
                      <span className="font-bold text-[#0F0F10]">1 Shoppable Desla Routine + 1 Post</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#9CA3AF] uppercase">
                        Included Items:
                      </span>
                      <span className="font-medium text-[#4B5563] truncate max-w-[200px]">
                        {(box.includedProducts || []).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => setSelectedBoxForRequest(box)}
                  disabled={box.spotsLeft === 0}
                  className={`w-full py-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer ${
                    box.spotsLeft === 0
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[#0F0F10] hover:bg-[#27272A] text-white shadow-xs'
                  }`}
                >
                  <span>{box.spotsLeft === 0 ? 'Fully Allocated' : 'Request PR Package to Address'}</span>
                  <ArrowRight size={14} className="text-[#D4AF37]" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ACTIVE & IN TRANSIT REQUESTS */}
      {/* ========================================================= */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeRequests.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#E5E7EB]">
              <PackageCheck size={36} className="mx-auto text-[#9CA3AF] mb-3" />
              <h3 className="font-heading font-bold text-base text-[#0F0F10]">No Active In-Transit Packages</h3>
              <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
                Select an available PR box from the Available tab to have high-potency natural formulations dispatched directly to you.
              </p>
              <button
                onClick={() => setActiveTab('available')}
                className="mt-4 px-5 py-2 rounded-full bg-[#0F0F10] text-[#D4AF37] text-xs font-bold cursor-pointer"
              >
                Browse Available Boxes
              </button>
            </div>
          ) : (
            activeRequests.map((req) => (
              <div
                key={req.id}
                className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                      Tracking #{req.trackingNumber || 'Not recorded'}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F0F10]" />
                    <span className="text-xs font-mono text-[#6B7280]">{req.requestedAt}</span>
                  </div>
                  <h3 className="font-heading font-extrabold text-lg text-[#0F0F10]">
                    {req.boxTitle}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                    <span className="flex items-center gap-1">
                      <Truck size={14} className="text-[#0F0F10]" />
                      <strong>Courier:</strong> {req.courier || 'Recorded in tracking reference'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} className="text-[#0F0F10]" />
                      <span className="truncate max-w-xs">{req.shippingAddress}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTrackingRequest(req)}
                    className="px-5 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>View delivery status</span>
                    <ChevronRight size={14} className="text-[#D4AF37]" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: DELIVERED & PAST PR PACKAGES */}
      {/* ========================================================= */}
      {activeTab === 'delivered' && (
        <div className="space-y-4">
          {deliveredRequests.map(request => ({ id: request.id, title: request.boxTitle, date: 'Requested ' + new Date(request.requestedAt).toLocaleDateString() })).map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-heading font-bold text-sm text-[#0F0F10]">{item.title}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-[#FAF9F6] text-[#0F0F10] border border-[#E5E7EB] text-[10px] font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-[#0F0F10]" />
                    <span>Delivered</span>
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-0.5 font-mono">
                  {item.date}
                </p>
              </div>

              {onOpenCreateWithBox && (
                <button
                  onClick={() => onOpenCreateWithBox(item.title)}
                  className="px-4 py-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] cursor-pointer self-start sm:self-auto"
                >
                  Create New Reel with Kit
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* REQUEST PR BOX MODAL */}
      {/* ========================================================= */}
      {selectedBoxForRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-[#E5E7EB] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAF9F6]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center">
                  <Gift size={16} />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-[#0F0F10]">
                    Request PR Collection
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Direct dispatch from Desla Central Laboratory
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBoxForRequest(null)}
                className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-[#6B7280] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
              {/* Box summary banner */}
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center gap-3.5">
                <img
                  src={selectedBoxForRequest.thumbnail}
                  alt={selectedBoxForRequest.title}
                  className="w-16 h-16 rounded-xl object-cover border border-[#E5E7EB] shrink-0"
                />
                <div>
                  <h4 className="font-heading font-bold text-sm text-[#0F0F10]">
                    {selectedBoxForRequest.title}
                  </h4>
                  <p className="text-xs text-[#997A2E] font-mono font-bold mt-0.5">
                    {selectedBoxForRequest.retailValue} Retail Value • Complimentary VIP Press Box
                  </p>
                  <p className="text-[11px] text-[#6B7280] line-clamp-1 mt-1">
                    {(selectedBoxForRequest.includedProducts || []).join(' • ')}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F0F10] mb-1">
                  Recipient Identity &amp; Creator Tier
                </label>
                <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs flex items-center justify-between">
                  <span className="font-bold text-[#0F0F10]">{authUser?.profile?.displayName || authUser?.email || ''}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#0F0F10] text-[#D4AF37] font-mono text-[10px] font-bold">
                    Approved creator
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F0F10] mb-1">
                  Courier Delivery Address
                </label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3.5 top-3 text-[#9CA3AF]" />
                  <input
                    type="text"
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F0F10]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F0F10] mb-1">
                  Delivery Notes / Access Gate Instructions
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Call upon arrival at Lekki Phase 1 estate gate"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-[11px] text-[#6B7280]">
                <span className="font-bold text-[#0F0F10]">Editorial Agreement:</span> By claiming this press kit, you agree to create 1 authentic routine video or post within 21 days of delivery.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setSelectedBoxForRequest(null)}
                  className="px-4 py-2.5 rounded-full border border-[#E5E7EB] text-xs font-semibold text-[#0F0F10] hover:bg-[#FAF9F6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-[#D4AF37] text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  Request kit for review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* LIVE COURIER TRACKING MODAL */}
      {/* ========================================================= */}
      {trackingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#E5E7EB] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAF9F6]">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#997A2E]">
                  Recorded delivery status
                </span>
                <h3 className="font-heading font-extrabold text-lg text-[#0F0F10]">
                  {trackingRequest.boxTitle}
                </h3>
              </div>
              <button
                onClick={() => setTrackingRequest(null)}
                className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-[#6B7280] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Waypoint steps */}
              <div className="space-y-4">
                {[
                  { step: 'Request saved', time: new Date(trackingRequest.requestedAt).toLocaleString(), status: 'done', desc: trackingRequest.shippingAddress },
                  ...(trackingRequest.dispatchedAt ? [{ step: 'Dispatch recorded', time: new Date(trackingRequest.dispatchedAt).toLocaleString(), status: 'done', desc: trackingRequest.trackingNumber || '' }] : []),
                  ...(trackingRequest.deliveredAt ? [{ step: 'Delivery recorded', time: new Date(trackingRequest.deliveredAt).toLocaleString(), status: 'done', desc: '' }] : []),
                ].map((s, idx) => (
                  <div key={idx} className="flex items-start gap-3 relative">
                    <div className="mt-0.5">
                      {s.status === 'done' ? (
                        <div className="w-6 h-6 rounded-full bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center text-xs">
                          ✓
                        </div>
                      ) : s.status === 'active' ? (
                        <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#0F0F10] flex items-center justify-center text-xs font-bold animate-pulse">
                          ●
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs">
                          ○
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${s.status === 'active' ? 'text-[#0F0F10]' : s.status === 'done' ? 'text-[#0F0F10]' : 'text-gray-400'}`}>
                          {s.step}
                        </span>
                        <span className="text-[10px] font-mono text-[#9CA3AF]">{s.time}</span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#6B7280]">Status and references are recorded by the administrator. No live courier feed or handover code is available for this kit.</p>
              <button onClick={() => setTrackingRequest(null)}
                className="w-full py-2.5 rounded-full bg-[#0F0F10] text-white text-xs font-bold hover:bg-[#27272A] cursor-pointer"
              >
                Close Tracking View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
