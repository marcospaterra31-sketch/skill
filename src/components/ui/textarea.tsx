import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn.ts';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-medium text-slate-300">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          rows={rows}
          ref={ref}
          className={cn(
            'flex w-full rounded-lg border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/80 focus-visible:border-transparent transition-all disabled:cursor-not-allowed disabled:opacity-50 resize-y font-mono',
            error && 'border-rose-500/80 focus-visible:ring-rose-500/80',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-[11px] text-slate-400">{hint}</p>}
        {error && <p className="text-[11px] font-medium text-rose-400">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
