import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn.ts';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, checked, ...props }, ref) => {
    const checkId = id || (label ? `check-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="flex items-start gap-2.5">
        <input
          id={checkId}
          type="checkbox"
          ref={ref}
          checked={checked}
          className={cn(
            'h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-2 focus:ring-indigo-500/80 focus:ring-offset-2 focus:ring-offset-slate-950 transition-colors cursor-pointer mt-0.5',
            className
          )}
          {...props}
        />
        {(label || description) && (
          <div className="text-xs">
            {label && (
              <label htmlFor={checkId} className="font-medium text-slate-200 cursor-pointer select-none">
                {label}
              </label>
            )}
            {description && <p className="text-slate-400 mt-0.5">{description}</p>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
