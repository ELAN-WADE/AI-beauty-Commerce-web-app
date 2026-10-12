import React from 'react';

export interface EmptyStateCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="p-8 sm:p-12 rounded-3xl border border-dashed border-[#E5E7EB] bg-white text-center flex flex-col items-center justify-center max-w-lg mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] text-[#997A2E] flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-heading font-bold text-base sm:text-lg text-[#0F0F10]">{title}</h3>
      <p className="text-xs sm:text-sm text-[#6B7280] mt-1.5 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-6 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-semibold shadow-xs active:scale-[0.97] transition-all cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
