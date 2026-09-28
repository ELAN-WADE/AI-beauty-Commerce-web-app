import React, { useState } from 'react';
import {
  Sparkles,
  Award,
  Gift,
  Tag,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Copy
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';

export const Screen16Rewards: React.FC = () => {
  const { userProfile, vouchers, pointsActivity, redeemVoucher } = useApp();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FCFAF9] pb-28">
      <Header title="Beauty Rewards Club" />

      <main className="max-w-md mx-auto px-4 pt-3 space-y-5">
        {/* Luxury Gold Membership Card */}
        <section
          aria-label="Membership Status"
          className="relative rounded-hero overflow-hidden p-5 bg-gradient-to-br from-[#D99A26] via-[#F3C053] to-[#B37B15] text-[#1E1B1D] shadow-float border border-amber-300"
        >
          {/* Subtle light reflections overlay */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/10 backdrop-blur-xs text-[10px] font-bold tracking-widest uppercase">
                <Award size={13} />
                <span>{userProfile.tier} Tier Member</span>
              </div>
              <h2 className="font-heading font-extrabold text-2xl tracking-tight mt-2 text-[#1E1B1D]">
                {userProfile.name}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-black/10 flex items-center justify-center font-heading font-extrabold text-lg">
              ✦
            </div>
          </div>

          <div className="relative z-10 mt-6 pt-4 border-t border-black/10 flex items-end justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">
                Available Rewards Balance
              </span>
              <p className="font-heading font-extrabold text-3xl text-[#1E1B1D] leading-none mt-0.5">
                {userProfile.points.toLocaleString()}{' '}
                <span className="text-sm font-bold uppercase tracking-wider">Points</span>
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold bg-black/10 px-2 py-1 rounded-lg">
              Level 3
            </span>
          </div>

          {/* Progress bar to Platinum */}
          <div className="relative z-10 mt-3.5">
            <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
              <span>Progress to Platinum</span>
              <span>{userProfile.pointsToNextReward} pts to go</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-black/15 overflow-hidden">
              <div className="h-full bg-[#1E1B1D] rounded-full w-[82%]" />
            </div>
          </div>
        </section>

        {/* Redeemable Vouchers Section */}
        <section aria-label="Redeemable Vouchers">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-heading font-bold text-sm text-glowly-charcoal leading-none">
                Redeem Exclusive Vouchers
              </h3>
              <p className="text-[11px] text-glowly-muted mt-0.5">
                Use your points to claim instant discounts at checkout
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {vouchers.map((v) => {
              const canAfford = userProfile.points >= v.pointsCost;

              return (
                <div
                  key={v.id}
                  className="p-3.5 rounded-card bg-white border border-glowly-border shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-glowly-accent text-glowly-primary flex items-center justify-center shrink-0">
                      <Tag size={18} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-heading font-bold text-xs text-glowly-charcoal truncate">
                          {v.title}
                        </h4>
                        <span className="px-1.5 py-0.5 rounded bg-glowly-surface text-glowly-primary font-mono text-[9px] font-bold border">
                          {v.discountValue}
                        </span>
                      </div>
                      <p className="text-[10px] text-glowly-muted mt-0.5">
                        Cost: <strong>{v.pointsCost} Points</strong> • {v.expiresAt}
                      </p>
                      {v.isRedeemed && (
                        <div className="flex items-center gap-1.5 mt-1 font-mono text-xs font-bold text-emerald-700">
                          <span>Code: {v.code}</span>
                          <button
                            onClick={() => handleCopy(v.code)}
                            className="p-0.5 hover:text-emerald-900"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {v.isRedeemed ? (
                      <span className="px-3 py-1.5 rounded-btn bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        Redeemed
                      </span>
                    ) : (
                      <button
                        onClick={() => redeemVoucher(v.id)}
                        disabled={!canAfford}
                        className={`px-3.5 py-1.5 rounded-btn text-xs font-bold transition-all ${
                          canAfford
                            ? 'bg-glowly-primary text-white hover:bg-glowly-primary-hover active:scale-95 shadow-soft'
                            : 'bg-glowly-surface text-glowly-muted border border-glowly-border cursor-not-allowed'
                        }`}
                      >
                        Redeem
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* How to Earn Points Guide */}
        <section aria-label="Earning Rules" className="p-4 rounded-card bg-white border border-glowly-border space-y-2.5 text-xs">
          <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-glowly-charcoal">
            How to Earn Glowly Points
          </h4>
          <div className="space-y-1.5 text-glowly-muted">
            <div className="flex items-center justify-between py-1 border-b border-glowly-border/40">
              <span>Every ₦100 Spent on Catalogue</span>
              <strong className="text-glowly-charcoal font-mono">+1 Point</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-glowly-border/40">
              <span>Complete AI Skin Diagnosis</span>
              <strong className="text-glowly-primary font-mono">+500 Points</strong>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Birthday Month Radiance Gift</span>
              <strong className="text-amber-600 font-mono">+500 Points</strong>
            </div>
          </div>
        </section>

        {/* Points History Ledger */}
        <section aria-label="Activity History">
          <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-glowly-charcoal mb-2.5">
            Points Ledger & Activity
          </h4>
          <div className="space-y-2">
            {pointsActivity.map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-xl bg-white border border-glowly-border flex items-center justify-between text-xs"
              >
                <div>
                  <h5 className="font-semibold text-glowly-charcoal text-xs">
                    {act.title}
                  </h5>
                  <span className="text-[10px] text-glowly-muted">{act.date}</span>
                </div>
                <span
                  className={`font-mono font-bold text-xs ${
                    act.points > 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {act.points > 0 ? `+${act.points}` : act.points} pts
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
