import React, { useEffect } from 'react';
import { cn } from '../../utils/cn.ts';
import { X } from 'lucide-react';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-50 w-full rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl transition-all',
          widths[maxWidth],
          className
        )}
      >
        <button
          onClick={() => onOpenChange(false)}
          aria-label="Fechar"
          className="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <X className="h-4 w-4" />
        </button>

        {title && (
          <div className="mb-4 pr-6">
            <h2 className="text-base font-semibold text-slate-100">{title}</h2>
            {description && <p className="mt-1 text-xs text-slate-400 leading-relaxed">{description}</p>}
          </div>
        )}

        <div>{children}</div>
      </div>
    </div>
  );
};
