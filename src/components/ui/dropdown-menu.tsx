import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn.ts';

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  align = 'right',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>

      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[160px] rounded-lg border border-slate-800 bg-slate-900 py-1 shadow-xl focus:outline-none backdrop-blur-md',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          {items.map((item) => (
            <button
              key={item.id}
              disabled={item.disabled}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                item.destructive
                  ? 'text-rose-400 hover:bg-rose-500/10 hover:text-rose-300'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              )}
            >
              {item.icon && <span className="h-3.5 w-3.5 shrink-0">{item.icon}</span>}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
