import React from 'react';
import { cn } from '../../utils/cn.ts';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  ...props
}) => {
  const variants = {
    default: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    secondary: 'bg-slate-800 text-slate-300 border-slate-700',
    outline: 'border-slate-700/80 text-slate-300 bg-transparent',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    destructive: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors select-none tabular-nums',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};
