import React from 'react';

export interface EmptyStateCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  showArtwork?: boolean;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  showArtwork = true
}) => {
  return (
    <div className="p-8 sm:p-12 rounded-3xl border border-dashed border-[#E5E7EB] bg-white text-center flex flex-col items-center justify-center max-w-lg mx-auto">
      {showArtwork ? (
        <div className="relative mb-5">
          <div className="w-28 h-20 rounded-2xl overflow-hidden border border-[#E5E7EB] bg-[#FAF9F6] shadow-2xs">
            <img
              src="/artwork/empty-state-apothecary.webp"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-2.5 -right-2.5 w-9 h-9 rounded-xl bg-white border border-[#E5E7EB] text-[#997A2E] flex items-center justify-center shadow-xs">
            {icon}
          </div>
        </div>
      ) : (
        <div className="w-14 h-14 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] text-[#997A2E] flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="font-heading font-semibold text-base sm:text-lg text-[#0F0F10]">{title}</h3>
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
