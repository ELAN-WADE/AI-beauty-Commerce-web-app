import React, { useState } from 'react';
import { HelpCircle, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export const CreatorSupport: React.FC = () => {
  const [topic, setTopic] = useState('commission');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl mx-auto">
      <div className="pb-2 border-b border-[#E5E7EB] text-center">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
          Creator Partner Care
        </span>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
          Creator Support Concierge
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Direct escalation desk for commission inquiries, PR box tracking, and partnership support.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs">
        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF9F6] text-[#0F0F10] border border-[#E5E7EB] flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="font-heading font-bold text-lg text-[#0F0F10]">
              Ticket #CRT-9042 Created
            </h3>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              Thank you, Amara. The Creator Concierge team will respond via in-app notification and email within 4 hours.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setMessage('');
              }}
              className="mt-4 px-5 py-2 rounded-full bg-[#0F0F10] text-white text-xs font-semibold cursor-pointer"
            >
              Submit Another Inquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#0F0F10] block mb-1">
                Inquiry Category
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-[#E5E7EB] bg-[#FAF9F6] text-xs font-medium focus:outline-none focus:border-[#D4AF37] cursor-pointer"
              >
                <option value="commission">Commission Attribution &amp; Clearance</option>
                <option value="pr-box">PR Package Delivery or Missing Items</option>
                <option value="campaign">Campaign Brief Submission Clarification</option>
                <option value="technical">Storefront or Link Tracking Technical Bug</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#0F0F10] block mb-1">
                Message / Details
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain the issue with order numbers or campaign links…"
                className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] bg-[#FAF9F6] text-xs focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-[#D4AF37] font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.98] transition-all"
            >
              <Send size={14} />
              <span>Submit Priority Ticket</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
