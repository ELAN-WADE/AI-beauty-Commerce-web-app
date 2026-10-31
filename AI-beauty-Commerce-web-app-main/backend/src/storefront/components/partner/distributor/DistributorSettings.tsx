import React, { useEffect, useState, useRef } from 'react';
import { Store, Building, Phone, MapPin, Check, Shield, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { partnerBankRegister } from '../../../lib/owned-api';

export const DistributorSettings: React.FC = () => {
  const { distributorHubSettings, updateDistributorHubSettings, selectedCity } = useApp();

  const [hubName, setHubName] = useState(distributorHubSettings.hubName);
  const [address, setAddress] = useState(distributorHubSettings.address);
  const [phone, setPhone] = useState(distributorHubSettings.whatsappNumber);
  const [operatingHours, setOperatingHours] = useState(distributorHubSettings.operatingHours);
  const [pickupEnabled, setPickupEnabled] = useState(distributorHubSettings.pickupEnabled ?? true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(distributorHubSettings.deliveryEnabled ?? true);

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankVerified, setBankVerified] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dirty = useRef(new Set<string>());

  useEffect(() => {
    if (!dirty.current.has('hubName')) setHubName(distributorHubSettings.hubName);
    if (!dirty.current.has('address')) setAddress(distributorHubSettings.address);
    if (!dirty.current.has('phone')) setPhone(distributorHubSettings.whatsappNumber);
    if (!dirty.current.has('operatingHours')) setOperatingHours(distributorHubSettings.operatingHours);
    if (!dirty.current.has('pickupEnabled')) setPickupEnabled(distributorHubSettings.pickupEnabled);
    if (!dirty.current.has('deliveryEnabled')) setDeliveryEnabled(distributorHubSettings.deliveryEnabled);
  }, [distributorHubSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true); setError('');
    try {
    const saved = await updateDistributorHubSettings({
      hubName,
      address,
      whatsappNumber: phone,
      operatingHours,
      pickupEnabled,
      deliveryEnabled
    });
    if (!saved) throw new Error('Sign in with the distributor account before saving.');
    if (accountNumber.length === 10) {
      const bankCode = /gtb|guaranty/i.test(bankName) ? '058' : /zenith/i.test(bankName) ? '057' : /access/i.test(bankName) ? '044' : /first/i.test(bankName) ? '011' : /stanbic/i.test(bankName) ? '221' : '';
      if (!bankCode) throw new Error('Choose a supported bank name.');
      try {
        await partnerBankRegister('DISTRIBUTOR', { bankCode, bankName: bankName.trim(), accountName: hubName.trim().toUpperCase(), accountNumber });
        setBankVerified(false);
      } catch (error) { throw error; }
    }
    dirty.current.clear();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not save hub settings.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl mx-auto">
      <div className="pb-2 border-b border-[#E5E7EB]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
          Hub Configuration • {selectedCity || 'Lagos'}
        </span>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
          Distributor Hub Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Manage your city hub physical pickup point, emergency dispatch contacts, operating hours, and settlement accounts.
        </p>
      </div>

      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Hub Profile */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
          <h2 className="font-heading font-bold text-base text-[#0F0F10]">City Hub Profile &amp; Pickup Point</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-[#0F0F10] block mb-1">Hub Name</label>
              <input
                type="text"
                aria-label="Hub name" value={hubName}
                onChange={(e) => { dirty.current.add('hubName'); setHubName(e.target.value); }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#0F0F10] block mb-1">Dispatch WhatsApp / Phone</label>
              <input
                type="tel"
                aria-label="Hub phone" value={phone}
                onChange={(e) => { dirty.current.add('phone'); setPhone(e.target.value); }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] font-mono focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-[#0F0F10] block mb-1">Customer Pickup &amp; Warehousing Address</label>
              <input
                type="text"
                aria-label="Hub address" value={address}
                onChange={(e) => { dirty.current.add('address'); setAddress(e.target.value); }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-[#0F0F10] block mb-1">Operating Hours</label>
              <input
                type="text"
                aria-label="Hub operating hours" value={operatingHours}
                onChange={(e) => { dirty.current.add('operatingHours'); setOperatingHours(e.target.value); }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#E5E7EB] flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#0F0F10]">
              <input
                type="checkbox"
                checked={pickupEnabled}
                onChange={(e) => { dirty.current.add('pickupEnabled'); setPickupEnabled(e.target.checked); }}
                className="w-4 h-4 rounded text-[#0F0F10] focus:ring-0"
              />
              <span>Allow Direct Customer Hub Pickup</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#0F0F10]">
              <input
                type="checkbox"
                checked={deliveryEnabled}
                onChange={(e) => { dirty.current.add('deliveryEnabled'); setDeliveryEnabled(e.target.checked); }}
                className="w-4 h-4 rounded text-[#0F0F10] focus:ring-0"
              />
              <span>Allow Same-Day Rider Delivery</span>
            </label>
          </div>
        </div>

        {/* Settlement Bank */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-[#0F0F10]">
              Wholesale Settlement Bank Account
            </h2>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 size={12} /> {bankVerified ? 'Verified' : 'Awaiting verification'}
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
            <strong className="text-[#0F0F10] font-mono">{hubName.toUpperCase() || 'Not provided'}</strong>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-2">
          <button
            type="submit" disabled={saving}
            className="px-8 py-3 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold shadow-xs active:scale-[0.97] transition-all cursor-pointer flex items-center gap-2"
          >
            {saved ? (
              <>
                <Check size={14} className="text-[#D4AF37]" />
                <span className="text-[#D4AF37]">Hub Settings Saved Successfully ✓</span>
              </>
            ) : (
              <span>{saving ? 'Saving…' : 'Save Hub Settings'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
