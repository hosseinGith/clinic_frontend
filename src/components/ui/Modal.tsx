import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed !m-0 inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm mf-overlay-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`w-full ${maxWidth} bg-white rounded-lg border border-neutral-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh] mf-modal-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 id="modal-title" className="text-base font-bold text-neutral-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
