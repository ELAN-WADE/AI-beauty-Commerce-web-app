import React from 'react';

export interface StatusBadgeProps {
  status:
    | 'active'
    | 'ready'
    | 'delivered'
    | 'cleared'
    | 'paid'
    | 'optimal'
    | 'eligible'
    | 'pending'
    | 'processing'
    | 'awaiting-packing'
    | 'low-stock'
    | 'in-transit'
    | 'out-of-stock'
    | 'cancelled'
    | 'issue'
    | 'draft'
    | 'scheduled'
    | 'published';
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'sm' }) => {
  const getStyles = () => {
    switch (status) {
      case 'active':
      case 'ready':
      case 'delivered':
      case 'cleared':
      case 'paid':
      case 'optimal':
      case 'eligible':
      case 'published':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';

      case 'pending':
      case 'processing':
      case 'awaiting-packing':
      case 'low-stock':
      case 'scheduled':
        return 'bg-amber-50 text-amber-800 border-amber-200/80';

      case 'in-transit':
        return 'bg-blue-50 text-blue-800 border-blue-200/80';

      case 'out-of-stock':
      case 'cancelled':
      case 'issue':
        return 'bg-rose-50 text-rose-800 border-rose-200/80';

      case 'draft':
      default:
        return 'bg-[#FAF9F6] text-[#6B7280] border-[#E5E7EB]';
    }
  };

  const getDotColor = () => {
    switch (status) {
      case 'active':
      case 'ready':
      case 'delivered':
      case 'cleared':
      case 'paid':
      case 'optimal':
      case 'eligible':
      case 'published':
        return 'bg-emerald-500';

      case 'pending':
      case 'processing':
      case 'awaiting-packing':
      case 'low-stock':
      case 'scheduled':
        return 'bg-amber-500';

      case 'in-transit':
        return 'bg-blue-500';

      case 'out-of-stock':
      case 'cancelled':
      case 'issue':
        return 'bg-rose-500';

      case 'draft':
      default:
        return 'bg-gray-400';
    }
  };

  const formattedLabel = label || status.replace(/-/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider font-semibold border rounded-full ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
      } ${getStyles()}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDotColor()}`} />
      <span className="capitalize">{formattedLabel}</span>
    </span>
  );
};
