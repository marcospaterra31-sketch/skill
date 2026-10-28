import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '../../utils/cn.ts';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  tipo: 'success' | 'error' | 'info';
  titulo: string;
  descricao?: string;
}

interface ToastContextType {
  adicionarToast: (tipo: 'success' | 'error' | 'info', titulo: string, descricao?: string) => void;
  removerToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removerToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const adicionarToast = useCallback(
    (tipo: 'success' | 'error' | 'info', titulo: string, descricao?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, tipo, titulo, descricao }]);
      setTimeout(() => {
        removerToast(id);
      }, 4000);
    },
    [removerToast]
  );

  return (
    <ToastContext.Provider value={{ adicionarToast, removerToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md transition-all duration-200 animate-in slide-in-from-bottom-3',
              toast.tipo === 'success' && 'border-emerald-500/30 text-emerald-200',
              toast.tipo === 'error' && 'border-rose-500/30 text-rose-200',
              toast.tipo === 'info' && 'border-sky-500/30 text-sky-200'
            )}
          >
            {toast.tipo === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.tipo === 'error' && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />}
            {toast.tipo === 'info' && <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-100">{toast.titulo}</p>
              {toast.descricao && <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{toast.descricao}</p>}
            </div>
            <button
              onClick={() => removerToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
              aria-label="Fechar notificação"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast deve ser utilizado dentro de um ToastProvider');
  }
  return ctx;
}
