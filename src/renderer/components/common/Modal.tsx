import React, { useEffect, useRef } from 'react';
import { VscClose } from 'react-icons/vsc';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

const WIDTHS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({ open, title, onClose, width = 'md', children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={[
          'bg-base-900 border border-surface-border rounded-xl shadow-2xl w-full flex flex-col max-h-[85vh]',
          WIDTHS[width],
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border shrink-0">
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors p-0.5"
          >
            <VscClose size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
