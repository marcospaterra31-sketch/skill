import React, { useState } from 'react';
import { Dialog } from '../../components/ui/dialog.tsx';
import { Button } from '../../components/ui/button.tsx';
import { RoutePath } from '../../types/index.ts';
import { Sparkles, Check, ArrowRight, ShieldCheck, Copy } from 'lucide-react';

export interface AutoFixModalProps {
  aberto: boolean;
  onFechar: () => void;
  skillId: string;
  skillTitle: string;
  promptOriginal: string;
  promptSugerido: string;
  recommendations: string[];
  onAplicarNoEditor: (skillId: string, promptCorrigido: string) => void;
}

export const AutoFixModal: React.FC<AutoFixModalProps> = ({
  aberto,
  onFechar,
  skillId,
  skillTitle,
  promptOriginal,
  promptSugerido,
  recommendations,
  onAplicarNoEditor,
}) => {
  const [copiado, setCopiado] = useState(false);

  const copiarPrompt = () => {
    navigator.clipboard.writeText(promptSugerido);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <Dialog
      open={aberto}
      onOpenChange={onFechar}
      title="Correções de Segurança com IA (Auto-Fix OWASP)"
      description={`Prompt aprimorado para "${skillTitle}" com salvaguardas contra jailbreaks e vazamentos.`}
      maxWidth="xl"
    >
      <div className="space-y-4 pt-2">
        {/* Recomendações Aplicadas */}
        <div className="p-3 bg-indigo-950/30 border border-indigo-800/60 rounded-xl space-y-1.5">
          <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            Recomendações Integradas pelo Motor de IA:
          </span>
          <ul className="text-xs text-slate-300 space-y-1 pl-4 list-disc font-sans">
            {recommendations.slice(0, 4).map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>

        {/* Pré-visualização do Prompt Corrigido */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-white">Prompt de Sistema com Guardrails Aplicados</span>
            <button
              onClick={copiarPrompt}
              className="text-xs text-indigo-400 hover:text-white flex items-center gap-1 font-mono"
            >
              <Copy className="h-3 w-3" />
              {copiado ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {promptSugerido}
          </pre>
        </div>

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <Button size="sm" variant="ghost" onClick={onFechar} className="text-xs text-slate-400 hover:text-white">
            Fechar
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              onAplicarNoEditor(skillId, promptSugerido);
              onFechar();
            }}
            className="text-xs font-semibold gap-1.5"
          >
            Abrir no Editor com Correções
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
