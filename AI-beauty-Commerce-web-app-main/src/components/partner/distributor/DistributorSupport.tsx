import React, { useState } from 'react';
import { PhoneCall, ShieldAlert, Send, CheckCircle2 } from 'lucide-react';

export const DistributorSupport: React.FC = () => {
  const [topic, setTopic] = useState('damaged-batch');
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
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600">
          Direct Logistics Dispatch
        </span>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
          Logistics &amp; Stock Incident Support
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Priority escalation channel for warehouse inventory discrepancies, courier disputes, and damaged laboratory cartons.
        </p>
      </div>

      {/* Emergency Hotline Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#FBF5E8] border border-[#D4AF37]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-[#0F0F10] block">Priority Central Dispatch Line:</span>
          <span className="text-[#6B7280]">Immediate phone resolution for courier pickup failures.</span>
        </div>
        <a
          href="tel:+2348148120642"
          className="px-4 py-2 rounded-full bg-[#0F0F10] text-[#D4AF37] font-mono font-bold flex items-center justify-center gap-1.5 shrink-0"
        >
          <PhoneCall size={13} />
          <span>+234 814 812 0642</span>
        </a>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs">
        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="font-heading font-bold text-lg text-[#0F0F10]">
              Incident Ticket #DIS-4190 Logged
            </h3>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              Central Laboratory Operations Control will inspect this incident immediately. A replacement carton or adjustment credit will be dispatched if required.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setMessage('');
              }}
              className="mt-4 px-5 py-2 rounded-full bg-[#0F0F10] text-white text-xs font-semibold cursor-pointer"
            >
              Report Another Incident
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#0F0F10] block mb-1">
                Incident Classification
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-[#E5E7EB] bg-[#FAF9F6] text-xs font-medium focus:outline-none focus:border-[#D4AF37] cursor-pointer"
              >
                <option value="damaged-batch">Damaged Bottles in Laboratory Carton</option>
                <option value="courier-dispute">Courier Failed Pickup / Customer Delay</option>
                <option value="mismatch">Stock Count Discrepancy on Shelf</option>
                <option value="settlement">Wholesale Payout &amp; Margin Query</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#0F0F10] block mb-1">
                Incident Description &amp; Order / Carton Numbers
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Include batch numbers, order IDs, or courier tracking references…"
                className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] bg-[#FAF9F6] text-xs focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.98] transition-all"
            >
              <Send size={14} className="text-[#D4AF37]" />
              <span>Submit Incident to Central Control</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
