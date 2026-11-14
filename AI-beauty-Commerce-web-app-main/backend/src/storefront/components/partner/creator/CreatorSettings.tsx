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
    <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl mx-auto">
      <div className="pb-2 border-b border-[#E5E7EB]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
          Profile &amp; Bank Configuration
        </span>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
          Studio Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Manage your creator dossier, saved social profile links, and Nigerian settlement bank details.
        </p>
      </div>

      {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      {loading && <p role="status">Loading your creator settings…</p>}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
          <h2 className="font-heading font-bold text-base text-[#0F0F10]">Creator Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-[#0F0F10] block mb-1">Full Legal Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#0F0F10] block mb-1">Public Creator Handle</label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#0F0F10] block mb-1">Notification Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#0F0F10] block mb-1">WhatsApp / Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Bank Settlement Dossier */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-[#0F0F10]">
              Settlement Bank Account (NUBAN)
            </h2>
            <span className="text-[10px] font-mono font-bold text-[#0F0F10] bg-[#FAF9F6] px-2.5 py-0.5 rounded-full border border-[#E5E7EB]">
               {bankVerified ? 'Verified for payout' : 'Awaiting verification'}
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
              <label className="text-[11px] font-bold text-[#0F0F10] block mb-1">10-Digit Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] font-mono"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs">
            <span className="text-[#6B7280]">{bankVerified ? 'Verified beneficiary name: ' : 'Beneficiary name (requires review): '}</span>
            <strong className="text-[#0F0F10] font-mono">{accountName || name.toUpperCase() || 'Not provided'}</strong>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit" disabled={loading || saving}
            className="px-8 py-3 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold shadow-xs active:scale-[0.97] transition-all cursor-pointer flex items-center gap-2"
          >
            {saved ? (
              <>
                <Check size={14} className="text-[#0F0F10]" />
                <span>Changes Saved ✓</span>
              </>
            ) : (
              <span>{saving ? 'Saving settings…' : 'Save Studio Settings'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
