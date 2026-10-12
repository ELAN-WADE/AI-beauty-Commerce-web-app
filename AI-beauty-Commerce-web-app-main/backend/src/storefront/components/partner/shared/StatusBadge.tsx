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
    | 'published'
    | string;
  label?: string;
  size?: 'sm' | 'md';
  variant?: 'minimal' | 'badge';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  variant = 'minimal'
}) => {
  const formattedLabel = label || status.replace(/-/g, ' ');

  // Clean, monochrome minimalist status stamp (no rainbow/multicolor)
  if (variant === 'minimal') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F0F10] whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0F0F10] shrink-0" />
        <span className="capitalize">{formattedLabel}</span>
      </span>
    );
  }

  // Monospace uppercase stamp without unnecessary bulky borders
  return (
    <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-wider font-bold text-[10px] text-[#0F0F10]">
      <span className="w-1 h-1 rounded-full bg-[#0F0F10] shrink-0" />
      <span>{formattedLabel}</span>
    </span>
  );
};
