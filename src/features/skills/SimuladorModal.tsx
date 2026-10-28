import React, { useState } from 'react';
import { Dialog } from '../../components/ui/dialog.tsx';
import { Button } from '../../components/ui/button.tsx';
import { skillService } from '../../services/skills/skill.service.ts';
import { Play, Sparkles, Clock, Coins, CheckCircle, AlertTriangle } from 'lucide-react';

export interface SimuladorModalProps {
  aberto: boolean;
  onFechar: () => void;
  skillId: string;
  systemPrompt: string;
  skillTitle: string;
}

export const SimuladorModal: React.FC<SimuladorModalProps> = ({
  aberto,
  onFechar,
  skillId,
  systemPrompt,
  skillTitle,
}) => {
  const [entradaUsuario, setEntradaUsuario] = useState(
    'Olá! Preciso que você analise este código e aponte possíveis melhorias de segurança e performance.'
  );
  const [provedor, setProvedor] = useState('gemini');
  const [temperatura, setTemperatura] = useState(0.7);
  const [executando, setExecutando] = useState(false);
  const [resultado, setResultado] = useState<{
    resposta: string;
    modelo: string;
    provedor: string;
    tokens?: { prompt: number; resposta: number; total: number };
    latenciaMs: number;
  } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleExecutar = async () => {
    if (!entradaUsuario.trim()) return;
    setExecutando(true);
    setErro(null);
    try {
      const res = await skillService.simularExecucao(
        skillId,
        systemPrompt,
        entradaUsuario,
        provedor,
        temperatura
      );
      setResultado(res);
    } catch (e: any) {
      setErro(e.message || 'Falha ao executar simulação.');
    } finally {
      setExecutando(false);
    }
  };

  return (
    <Dialog
      open={aberto}
      onOpenChange={onFechar}
      title={`Simulador em Tempo Real: ${skillTitle}`}
      description="Execute uma inferência de teste com o prompt ativo do editor e meça tokens e latência."
      maxWidth="xl"
    >
      <div className="space-y-4 pt-2">
        {/* Parâmetros de Inferência */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Motor / Modelo de Inferência
            </label>
            <select
              value={provedor}
              onChange={(e) => setProvedor(e.target.value)}
              className="w-full h-8 text-xs bg-slate-900 border border-slate-700 rounded px-2 text-white font-mono"
            >
              <option value="gemini">Google Gemini 2.5 Flash (Oficial @google/genai)</option>
              <option value="claude">Anthropic Claude 3.5 Sonnet</option>
              <option value="openai">OpenAI GPT-4o</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-400">Temperatura</label>
              <span className="text-[11px] font-mono text-indigo-400">{temperatura}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={temperatura}
              onChange={(e) => setTemperatura(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Entrada de Teste */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            Mensagem / Entrada de Teste do Usuário
          </label>
          <textarea
            value={entradaUsuario}
            onChange={(e) => setEntradaUsuario(e.target.value)}
            rows={3}
            placeholder="Digite a mensagem simulada para o agente..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 font-sans"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            O System Prompt ativo do editor será injetado automaticamente como instrução mestra.
          </span>
          <Button
            size="sm"
            variant="primary"
            onClick={handleExecutar}
            disabled={executando || !entradaUsuario.trim()}
            className="text-xs font-semibold gap-1.5"
          >
            <Play className={`h-3.5 w-3.5 ${executando ? 'animate-pulse text-indigo-300' : ''}`} />
            {executando ? 'Processando com IA...' : 'Simular Resposta'}
          </Button>
        </div>

        {/* Erro */}
        {erro && (
          <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{erro}</span>
          </div>
        )}

        {/* Resultado */}
        {resultado && (
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                Resposta Gerada pelo Agente
              </span>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="h-3 w-3 text-indigo-400" />
                  {resultado.latenciaMs}ms
                </span>
                {resultado.tokens && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Coins className="h-3 w-3 text-amber-400" />
                    {resultado.tokens.total} tokens
                  </span>
                )}
                <span className="text-slate-500">[{resultado.modelo}]</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap max-h-[260px] overflow-y-auto leading-relaxed">
              {resultado.resposta}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
