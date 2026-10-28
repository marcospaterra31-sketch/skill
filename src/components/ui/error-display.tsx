import React from 'react';
import { cn } from '../../utils/cn.ts';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button.tsx';
import { normalizarErro } from '../../lib/erros/index.ts';

export interface ErrorDisplayProps {
  erro: unknown;
  onRetry?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  erro,
  onRetry,
  className,
}) => {
  const normalizado = normalizarErro(erro);

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-rose-500/30 bg-rose-950/15 p-6 text-center',
        className
      )}
    >
      <div className="rounded-full bg-rose-500/10 p-3 text-rose-400 mb-3">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h4 className="text-sm font-semibold text-rose-200">Falha na Operação</h4>
      <p className="mt-1 max-w-md text-xs text-slate-300 leading-relaxed">{normalizado.mensagem}</p>
      {normalizado.detalheSeguro && (
        <p className="mt-1 text-[11px] text-slate-400">{normalizado.detalheSeguro}</p>
      )}

      {onRetry && (
        <Button onClick={onRetry} size="sm" variant="secondary" className="mt-4 gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
};
