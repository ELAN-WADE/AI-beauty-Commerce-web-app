import React from 'react';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  isProcessing?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isProcessing = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="alertdialog" aria-modal="true">
      <div className="fixed inset-0 bg-[#0F0F10]/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-3xl bg-white p-6 text-left shadow-xl transition-all sm:w-full sm:max-w-lg border border-[#E5E7EB]">
          <div className="flex items-start gap-4">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                variant === 'danger'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : variant === 'warning'
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-[#FBF5E8] text-[#997A2E] border border-[#D4AF37]/30'
              }`}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-[#0F0F10]">{title}</h3>
              <p className="mt-1.5 text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#E5E7EB] bg-white text-xs font-semibold text-[#0F0F10] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-semibold text-white shadow-xs transition-transform active:scale-[0.97] cursor-pointer flex items-center justify-center gap-2 ${
                variant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-[#0F0F10] hover:bg-[#27272A]'
              }`}
            >
              {isProcessing && <span className="animate-spin text-sm">↻</span>}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
