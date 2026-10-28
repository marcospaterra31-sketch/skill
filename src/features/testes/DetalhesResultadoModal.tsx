import React from 'react';
import { Dialog } from '../../components/ui/dialog.tsx';
import { Button } from '../../components/ui/button.tsx';
import { SkillTestComResultado } from '../../types/index.ts';
import { CheckCircle2, XCircle, Clock, Coins, Play, Copy } from 'lucide-react';

export interface DetalhesResultadoModalProps {
  aberto: boolean;
  onFechar: () => void;
  teste: SkillTestComResultado | null;
  onExecutarNovamente: (testeId: string) => Promise<void>;
  executando: boolean;
}

export const DetalhesResultadoModal: React.FC<DetalhesResultadoModalProps> = ({
  aberto,
  onFechar,
  teste,
  onExecutarNovamente,
  executando,
}) => {
  if (!teste) return null;

  const res = teste.latestResult;
  const isPassed = res?.status === 'PASSED';
  const score = res?.score ?? (isPassed ? 100 : 0);

  const textoSaida =
    typeof res?.output === 'object' && res.output !== null
      ? (res.output as any).texto || JSON.stringify(res.output, null, 2)
      : String(res?.output || 'Nenhum resultado gerado ainda.');

  const entradaStr =
    typeof teste.inputData === 'object' && teste.inputData !== null
      ? (teste.inputData as any).prompt || JSON.stringify(teste.inputData, null, 2)
      : String(teste.inputData);

  return (
    <Dialog
      open={aberto}
      onOpenChange={onFechar}
      title={`Resultado do Teste: ${teste.name}`}
      description={`Skill: ${teste.skillTitle || 'Habilidade'} · Registrado no PostgreSQL`}
      maxWidth="xl"
    >
      <div className="space-y-4 pt-2">
        {/* Banner de Status e Métricas */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border bg-slate-950 border-slate-800">
          <div className="flex items-center gap-3">
            {isPassed ? (
              <div className="h-10 w-10 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-red-950 border border-red-800 flex items-center justify-center text-red-400">
                <XCircle className="h-5 w-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-bold uppercase tracking-wider ${
                    isPassed ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {res?.status || 'PENDENTE'}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="font-mono text-sm font-bold text-white tabular-nums">
                  {score}% de aprovação
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Executado em {res?.createdAt ? new Date(res.createdAt).toLocaleString('pt-BR') : '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              {res?.latencyMs || 0}ms
            </span>
            <span className="flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              {res?.tokensUsed || 0} tokens
            </span>
          </div>
        </div>

        {/* Avaliação Detalhada das Asserções */}
        {res?.assertionResults && res.assertionResults.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-white mb-2">Relatório de Asserções</h4>
            <div className="space-y-1.5">
              {res.assertionResults.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-start justify-between gap-3 p-2.5 rounded-lg border text-xs ${
                    a.passed
                      ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-300'
                      : 'bg-red-950/20 border-red-900/60 text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {a.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                    )}
                    <span className="font-mono font-semibold">{a.rule}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 text-right">{a.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Entrada e Saída do Teste */}
        <div className="space-y-3">
          <div>
            <span className="text-xs font-bold text-white block mb-1">
              Entrada do Usuário (Estímulo)
            </span>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-sans text-slate-300 max-h-28 overflow-y-auto whitespace-pre-wrap">
              {entradaStr}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-white">Resposta Gerada pelo Agente</span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(textoSaida)}
                className="text-[11px] text-indigo-400 hover:text-white flex items-center gap-1"
              >
                <Copy className="h-3 w-3" /> Copiar Saída
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {textoSaida}
            </pre>
          </div>
        </div>

        {/* Ações do Rodapé */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <Button size="sm" variant="secondary" onClick={onFechar} className="text-xs">
            Fechar
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => onExecutarNovamente(teste.id)}
            disabled={executando}
            className="text-xs font-semibold gap-1.5"
          >
            <Play className={`h-3.5 w-3.5 ${executando ? 'animate-pulse text-indigo-300' : ''}`} />
            {executando ? 'Executando Teste...' : 'Reexecutar Teste'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
