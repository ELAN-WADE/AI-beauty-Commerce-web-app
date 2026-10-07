import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export const ActionDrawer: React.FC<ActionDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'lg'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass = {
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl'
  }[width];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#0F0F10]/50 backdrop-blur-xs transition-opacity duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen ${widthClass} bg-white shadow-2xl flex flex-col justify-between border-l border-[#E5E7EB] animate-in slide-in-from-right duration-250 ease-out`}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between gap-4 bg-[#FAF9F6]">
            <div>
              <h2 className="font-heading font-bold text-lg sm:text-xl text-[#0F0F10]">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-[#6B7280] mt-0.5 font-medium">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close drawer"
              className="w-9 h-9 rounded-full bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#0F0F10] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#FAF9F6]">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
