import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn.ts';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, hint, error, id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-300">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'flex h-9 w-full rounded-lg border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/80 focus-visible:border-transparent transition-all disabled:cursor-not-allowed disabled:opacity-50',
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

Input.displayName = 'Input';
