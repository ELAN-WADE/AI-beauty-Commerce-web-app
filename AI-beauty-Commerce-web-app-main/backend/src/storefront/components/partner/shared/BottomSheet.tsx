'use client';

import React from 'react';
import { X } from '../../common/SolidIcons';
import { DeslaMobileDrawer } from '../../motion/DeslaMobileDrawer';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) => {
  return (
    <DeslaMobileDrawer
      open={isOpen}
      onClose={onClose}
      ariaLabel={title || 'Details sheet'}
      forceDrawer
      mobileContentClassName="bg-white rounded-t-[26px] border-t border-[#E7E1D6] shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden"
    >
      {/* Header */}
      {title && (
        <div className="px-5 py-3 border-b border-[#EAE5DC] flex items-center justify-between shrink-0">
          <h3 className="font-heading font-semibold text-base text-[#0F0F10]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sheet"
            className="w-8 h-8 rounded-full bg-[#F5F2EB] text-[#4B5563] hover:text-[#111111] flex items-center justify-center cursor-pointer active:scale-95 transition-[transform,color] duration-150"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain-y px-5 py-4 space-y-4">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-5 py-3.5 border-t border-[#EAE5DC] bg-[#FAF9F6] shrink-0">
          {footer}
        </div>
      )}
    </DeslaMobileDrawer>
  );
};
