import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn.ts';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50 select-none whitespace-nowrap active:scale-[0.98] cursor-pointer';

    const variants = {
      primary:
        'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 shadow-indigo-500/20',
      secondary:
        'bg-slate-800 text-slate-100 hover:bg-slate-700/80 border border-slate-700/60',
      outline:
        'border border-slate-700/80 bg-transparent text-slate-200 hover:bg-slate-800/60 hover:text-white',
      ghost:
        'text-slate-300 hover:bg-slate-800/60 hover:text-white',
      destructive:
        'bg-rose-600 text-white shadow-sm hover:bg-rose-500 shadow-rose-500/20',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
      md: 'h-9 px-4 text-sm rounded-lg gap-2',
      lg: 'h-11 px-5 text-base rounded-lg gap-2.5',
      icon: 'h-9 w-9 p-0 rounded-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
