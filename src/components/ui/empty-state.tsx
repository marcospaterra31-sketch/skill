import React from 'react';
import { cn } from '../../utils/cn.ts';
import { Button } from './button.tsx';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center transition-colors',
        className
      )}
    >
      {icon && <div className="mb-3 text-slate-500 flex items-center justify-center">{icon}</div>}
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-slate-400 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" variant="primary" className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
