import React, { useState } from 'react';
import { Store, Building, Phone, MapPin, Check, Shield } from 'lucide-react';

export const DistributorSettings: React.FC = () => {
  const [hubName, setHubName] = useState('Desla!™ Central Laboratory & Hub');
  const [address, setAddress] = useState('Plot 14 Admiralty Way, Lekki Phase 1, Lagos');
  const [phone, setPhone] = useState('+234 814 812 0642');
  const [bankName, setBankName] = useState('Zenith Bank Plc');
  const [accountNumber, setAccountNumber] = useState('1012345678');
  const [accountName] = useState('DESLA LAGOS CENTRAL OPERATIONS');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl mx-auto">
      <div className="pb-2 border-b border-[#E5E7EB]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
          Hub Configuration
        </span>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
          Distributor Hub Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Manage your city hub physical pickup point, emergency dispatch contacts, and settlement accounts.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Hub Profile */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
          <h2 className="font-heading font-bold text-base text-[#0F0F10]">City Hub Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-[#0F0F10] block mb-1">Hub Name</label>
              <input
                type="text"
                value={hubName}
                onChange={(e) => setHubName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#0F0F10] block mb-1">Dispatch Phone / WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-[#0F0F10] block mb-1">Customer Pickup &amp; Warehousing Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6]"
              />
            </div>
          </div>
        </div>

        {/* Settlement Bank */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-[#0F0F10]">
              Wholesale Settlement Bank Account
            </h2>
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Verified ✓
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-[#0F0F10] block mb-1">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#0F0F10] block mb-1">Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] font-mono"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs">
            <span className="text-[#6B7280]">Verified Account Name: </span>
            <strong className="text-[#0F0F10] font-mono">{accountName}</strong>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-8 py-3 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold shadow-xs active:scale-[0.97] transition-all cursor-pointer flex items-center gap-2"
          >
            {saved ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span>Hub Settings Saved ✓</span>
              </>
            ) : (
              <span>Save Hub Settings</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
