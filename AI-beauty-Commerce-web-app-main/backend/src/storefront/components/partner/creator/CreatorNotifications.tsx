import React from 'react';
import { Bell, Megaphone, Gift, Wallet, Sparkles, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '../shared/StatusBadge';

export const CreatorNotifications: React.FC = () => {
  const notifications = [
    {
      id: '1',
      title: 'New VIP Campaign Available',
      desc: 'Glow Season 2026 has opened for Level 3+ creators. 15% commission + ₦25,000 bonus.',
      time: '2 hours ago',
      icon: Megaphone,
      unread: true
    },
    {
      id: '2',
      title: 'PR Box Approved & Packaging',
      desc: 'Your request for the Radiant Glow Collection has been approved. Hub team is preparing your parcel.',
      time: '5 hours ago',
      icon: Gift,
      unread: true
    },
    {
      id: '3',
      title: 'Commission Cleared to Available Balance',
      desc: '₦18,400 from client order ORD-LAG-7819 has completed validation and is now withdrawable.',
      time: '1 day ago',
      icon: Wallet,
      unread: false
    },
    {
      id: '4',
      title: 'New Clinical Formulation Added to Studio',
      desc: 'Gentle Amino Cleanser and Sun Defense SPF50+ are now ready to tag in your routines.',
      time: '2 days ago',
      icon: Sparkles,
      unread: false
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="pb-2 border-b border-[#E5E7EB]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
          Studio Activity Feed
        </span>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
          Notifications
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Real-time updates on campaign invitations, PR package shipments, and cleared commissions.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
        <div className="divide-y divide-[#E5E7EB]">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div key={n.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] text-[#997A2E] flex items-center justify-center shrink-0">
                  <Icon size={18} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-[#0F0F10] flex items-center gap-2">
                      <span>{n.title}</span>
                      {n.unread && <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
                    </h3>
                    <span className="text-[10px] text-[#9CA3AF] font-mono shrink-0">{n.time}</span>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed">{n.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
