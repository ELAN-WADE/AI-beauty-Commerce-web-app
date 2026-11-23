'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from '../../common/SolidIcons';
import { DESLA_EASE_DRAWER } from '../../motion/DeslaMotion';
import { DeslaMobileDrawer, useIsMobileSheetViewport } from '../../motion/DeslaMobileDrawer';

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
  width = 'lg',
}) => {
  const isMobile = useIsMobileSheetViewport(768);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (isMobile || !isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isMobile]);

  // Mobile (< 768px): Native Vaul drag-to-dismiss bottom sheet
  if (isMobile) {
    return (
      <DeslaMobileDrawer
        open={isOpen}
        onClose={onClose}
        ariaLabel={title}
        forceDrawer
        mobileContentClassName="bg-white rounded-t-[26px] border-t border-[#E7E1D6] shadow-2xl max-h-[88dvh] flex flex-col overflow-hidden"
      >
        <div className="px-5 py-3 border-b border-[#EAE5DC] flex items-center justify-between gap-3 bg-[#FBF9F5] shrink-0">
          <div className="min-w-0">
            <h2 className="font-heading font-semibold text-base text-[#0F0F10] truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[11px] text-[#6B7280] mt-0.5 font-medium truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="w-8 h-8 rounded-full bg-white border border-[#E5E7EB] text-[#0F0F10] flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-transform duration-150"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain-y px-5 py-4 space-y-5">
          {children}
        </div>

        {footer && (
          <div className="px-5 py-3.5 border-t border-[#EAE5DC] bg-[#FBF9F5] shrink-0">
            {footer}
          </div>
        )}
      </DeslaMobileDrawer>
    );
  }

  const widthClass = {
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
  }[width];

  // Desktop (>= 768px): Smooth GPU right-edge slide panel preserved
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0F0F10]/45 backdrop-blur-sm"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
            <motion.div
              initial={prefersReduced ? { opacity: 0 } : { x: '100%' }}
              animate={prefersReduced ? { opacity: 1 } : { x: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { x: '100%' }}
              transition={{ duration: prefersReduced ? 0.12 : 0.26, ease: DESLA_EASE_DRAWER }}
              className={`pointer-events-auto w-screen ${widthClass} bg-white shadow-2xl flex flex-col justify-between border-l border-[#E5E7EB]`}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between gap-4 bg-[#FAF9F6]">
                <div>
                  <h2 className="font-heading font-semibold text-lg sm:text-xl text-[#0F0F10]">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-xs text-[#6B7280] mt-0.5 font-medium">{subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close drawer"
                  className="w-9 h-9 rounded-full bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#0F0F10] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain-y px-6 py-6 space-y-6">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#FAF9F6]">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
