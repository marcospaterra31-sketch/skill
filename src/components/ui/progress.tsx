import React from 'react';
import { cn } from '../../utils/cn.ts';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  indicatorClassName?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className,
  indicatorClassName,
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-slate-800', className)}
      {...props}
    >
      <div
        className={cn('h-full bg-indigo-500 transition-all duration-300 ease-out', indicatorClassName)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
