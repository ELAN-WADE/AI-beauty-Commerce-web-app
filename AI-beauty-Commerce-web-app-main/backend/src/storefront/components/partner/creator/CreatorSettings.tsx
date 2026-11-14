import React, { useEffect, useState } from 'react';
import { User, Instagram, Video, Building, Bell, Shield, Check } from '../../common/SolidIcons';
import { useApp } from '../../../context/AppContext';
import { fetchPartnerDashboard, partnerBankRegister, writePartnerWorkspace } from '../../../lib/owned-api';

export const CreatorSettings: React.FC = () => {
  const { authUser, refreshAuth } = useApp();
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState(authUser?.email ?? '');
  const [phone, setPhone] = useState(authUser?.profile?.phone ?? '');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankVerified, setBankVerified] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false; setLoading(true); setError(''); setEmail(authUser?.email || ''); setPhone(authUser?.profile?.phone || '');
    void fetchPartnerDashboard('CREATOR').then((dashboard: any) => {
      if (cancelled) return;
      setName(dashboard.profile.name || authUser?.profile?.displayName || ''); setHandle(dashboard.profile.handle || '');
      const bank = dashboard.wallet?.banks?.[0];
      setBankName(bank?.bankName || ''); setAccountNumber(bank?.maskedNumber || ''); setAccountName(bank?.accountName || ''); setBankVerified(Boolean(bank?.verifiedAt));
    }).catch(() => { if (!cancelled) setError('Could not load your creator settings. Reload this page to retry.'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [authUser?.id]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault(); if (saving || loading) return;
    setSaving(true); setSaved(false); setError(''); let profileSaved = false;
    try {
      const changedBank = Boolean(accountNumber.trim()) && !accountNumber.includes('•');
      const bankCode = /gtb|guaranty/i.test(bankName) ? '058' : /zenith/i.test(bankName) ? '057' : /access/i.test(bankName) ? '044' : /first/i.test(bankName) ? '011' : /stanbic/i.test(bankName) ? '221' : '';
      if (changedBank && (!/^\d{10}$/.test(accountNumber.trim()) || !bankCode || !accountName.trim())) throw new Error('Choose a supported bank, enter its ten-digit account number and the beneficiary name.');
      await writePartnerWorkspace({ action: 'profile', kind: 'CREATOR', name: name.trim(), handle: handle.trim(), address: '', phone, operatingHours: '' });
      profileSaved = true; await refreshAuth();
      if (changedBank) {
        await partnerBankRegister('CREATOR', { bankCode, bankName: bankName.trim(), accountName: accountName.trim().toUpperCase(), accountNumber: accountNumber.trim() });
        setBankVerified(false); setAccountNumber('••••••' + accountNumber.trim().slice(-4));
      }
      setSaved(true);
    } catch (cause) { setError((profileSaved ? 'Profile saved; bank details were not saved. ' : '') + (cause instanceof Error ? cause.message : 'Could not save settings. Please retry.')); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="pb-4 border-b border-[#E5E7EB]">
        <span className="text-xs font-medium text-[#6B7280]">
          Profile &amp; Bank Configuration
        </span>
        <h1 className="font-heading font-semibold text-xl sm:text-2xl text-[#0F0F10] mt-0.5">
          Studio Settings
        </h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Manage your creator profile and settlement bank details.
        </p>
      </div>

      {error && <p role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">{error}</p>}
      {saved && <p role="status" className="rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] p-3.5 text-sm font-medium text-[#0F0F10]">Creator settings saved.</p>}
      {loading && <p role="status" className="text-sm text-[#6B7280]">Loading your creator settings...</p>}
      <form onSubmit={handleSave} className="space-y-5">
        {/* Profile Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-4">
          <h2 className="font-heading font-medium text-base text-[#0F0F10]">Creator Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#0F0F10] block mb-1.5">Full Legal Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-base sm:text-sm bg-[#FAF9F6] focus:outline-none focus:border-[#0F0F10]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#0F0F10] block mb-1.5">Public Creator Handle</label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-base sm:text-sm bg-[#FAF9F6] font-mono focus:outline-none focus:border-[#0F0F10]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#0F0F10] block mb-1.5">Notification Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly
                className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-base sm:text-sm bg-[#FAF9F6] text-[#6B7280]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#0F0F10] block mb-1.5">WhatsApp / Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-base sm:text-sm bg-[#FAF9F6] font-mono focus:outline-none focus:border-[#0F0F10]"
              />
            </div>
          </div>
        </div>

        {/* Bank Settlement Dossier */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading font-medium text-base text-[#0F0F10]">
              Settlement Bank Account (NUBAN)
            </h2>
            <span className="text-xs font-medium text-[#4B5563] bg-[#FAF9F6] px-2.5 py-1 rounded-lg border border-[#E5E7EB]">
              {bankVerified ? 'Verified for payout' : 'Awaiting verification'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#0F0F10] block mb-1.5">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-base sm:text-sm bg-[#FAF9F6] focus:outline-none focus:border-[#0F0F10]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#0F0F10] block mb-1.5">10-Digit Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-base sm:text-sm bg-[#FAF9F6] font-mono focus:outline-none focus:border-[#0F0F10]"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs">
            <span className="text-[#6B7280]">{bankVerified ? 'Verified beneficiary name: ' : 'Beneficiary name (requires review): '}</span>
            <strong className="text-[#0F0F10] font-mono font-medium">{accountName || name.toUpperCase() || 'Not provided'}</strong>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading || saving}
            className="min-h-11 px-6 rounded-xl bg-[#0F0F10] hover:bg-[#27272A] text-white text-sm font-medium active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {saved ? (
              <>
                <Check size={15} />
                <span>Changes Saved</span>
              </>
            ) : (
              <span>{saving ? 'Saving settings...' : 'Save Studio Settings'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
