import React from 'react';
import { cn } from '../../utils/cn.ts';

export const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => (
  <div className="relative w-full overflow-auto rounded-lg border border-slate-800/80 bg-slate-900/40">
    <table className={cn('w-full caption-bottom text-xs text-left', className)} {...props} />
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <thead className={cn('border-b border-slate-800 bg-slate-900/80 text-slate-400 font-medium', className)} {...props} />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <tbody className={cn('divide-y divide-slate-800/60', className)} {...props} />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => (
  <tr className={cn('h-10 transition-colors hover:bg-slate-800/40 data-[state=selected]:bg-slate-800', className)} {...props} />
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <th className={cn('h-10 px-4 text-left align-middle font-medium text-slate-300 [&:has([role=checkbox])]:pr-0', className)} {...props} />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <td className={cn('px-4 py-2.5 align-middle [&:has([role=checkbox])]:pr-0', className)} {...props} />
);
