import React from 'react';
import { cn } from '../../utils/cn.ts';
import { Info, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'success' | 'destructive';
  title?: string;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  title,
  children,
  ...props
}) => {
  const icons = {
    info: <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />,
    destructive: <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />,
  };

  const variants = {
    info: 'border-sky-900/40 bg-sky-950/20 text-sky-200',
    warning: 'border-amber-900/40 bg-amber-950/20 text-amber-200',
    success: 'border-emerald-900/40 bg-emerald-950/20 text-emerald-200',
    destructive: 'border-rose-900/40 bg-rose-950/20 text-rose-200',
  };

  return (
    <div
      role="alert"
      className={cn(
        'relative flex gap-3 rounded-lg border p-4 text-xs transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-semibold leading-tight text-white">{title}</h5>}
        <div className="text-slate-300 leading-relaxed">{children}</div>
      </div>
    </div>
  );
};
