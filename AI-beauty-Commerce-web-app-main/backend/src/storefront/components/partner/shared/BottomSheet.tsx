import React, { useEffect } from 'react';
import { X } from 'lucide-react';

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
  footer
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden md:hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#0F0F10]/60 backdrop-blur-xs transition-opacity duration-200"
      />

      <div className="fixed inset-x-0 bottom-0 z-10 max-h-[90dvh] flex flex-col bg-white rounded-t-3xl shadow-2xl border-t border-[#E5E7EB] animate-in slide-in-from-bottom duration-250 ease-out">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 cursor-grab">
          <div className="w-12 h-1.5 rounded-full bg-[#E5E7EB]" />
        </div>

        {/* Header */}
        {title && (
          <div className="px-5 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-[#0F0F10]">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close sheet"
              className="w-8 h-8 rounded-full bg-[#F3F4F6] text-[#4B5563] flex items-center justify-center cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-[#E5E7EB] bg-[#FAF9F6] pb-safe">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
