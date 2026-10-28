import React, { createContext, useContext } from 'react';
import { cn } from '../../utils/cn.ts';

interface TabsContextType {
  value: string;
  onValueChange: (val: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export interface TabsProps {
  value: string;
  onValueChange: (val: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, children, className }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div
    role="tablist"
    className={cn(
      'inline-flex h-9 items-center justify-start rounded-lg bg-slate-900 p-1 text-slate-400 border border-slate-800/80',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, className, children, ...props }) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger deve ser usado dentro de Tabs');

  const isSelected = ctx.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer disabled:pointer-events-none disabled:opacity-50 select-none',
        isSelected
          ? 'bg-indigo-600 text-white shadow-sm font-semibold'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({ value, className, children, ...props }) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsContent deve ser usado dentro de Tabs');

  if (ctx.value !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn('mt-4 focus-visible:outline-none animate-in fade-in-50 duration-150', className)}
      {...props}
    >
      {children}
    </div>
  );
};
