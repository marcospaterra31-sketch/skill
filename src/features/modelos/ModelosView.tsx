import React, { useEffect, useState } from 'react';
import { RoutePath, SkillTemplate } from '../../types/index.ts';
import { db } from '../../lib/banco/index.ts';
import { Button } from '../../components/ui/button.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { useToast } from '../../components/ui/toast.tsx';
import { Boxes, Sparkles, Copy, Check, ArrowRight } from 'lucide-react';

export interface ModelosViewProps {
  onNavegar: (caminho: RoutePath) => void;
}

export const ModelosView: React.FC<ModelosViewProps> = ({ onNavegar }) => {
  const [modelos, setModelos] = useState<SkillTemplate[]>([]);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const { adicionarToast } = useToast();

  useEffect(() => {
    fetch('/api/templates')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setModelos)
      .catch(() => {
        db.listarTemplates().then(setModelos);
      });
  }, []);

  const copiarPrompt = (modelo: SkillTemplate) => {
    navigator.clipboard.writeText(modelo.defaultPrompt);
    setCopiadoId(modelo.id);
    adicionarToast('success', 'Prompt copiado!', `O prompt base do modelo "${modelo.title}" foi copiado.`);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-sans">
            Biblioteca de Modelos
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Templates arquitetados prontos para instanciar com padrões Claude, OpenAI, Gemini e Cursor.
          </p>
        </div>

        <Button
          onClick={() => onNavegar('/skills/nova')}
          size="sm"
          variant="primary"
          className="font-semibold gap-1.5"
        >
          <Sparkles className="h-4 w-4" />
          Nova a Partir do Zero
        </Button>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modelos.map((tmpl) => (
          <div
            key={tmpl.id}
            className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:bg-slate-900/90"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-medium text-slate-400">{tmpl.category}</span>
                <Badge variant={tmpl.isFeatured ? 'default' : 'secondary'}>
                  {tmpl.targetFormat}
                </Badge>
              </div>

              <h3 className="text-sm font-semibold text-white mt-1">{tmpl.title}</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                {tmpl.description}
              </p>

              <div className="mt-4 rounded-lg border border-slate-800/80 bg-slate-950/70 p-3">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Prompt Base
                </span>
                <p className="text-xs text-slate-300 font-mono line-clamp-2 leading-relaxed">
                  "{tmpl.defaultPrompt}"
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {tmpl.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-slate-800/60 px-2 py-0.5 text-[10px] text-slate-400 font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copiarPrompt(tmpl)}
                className="text-xs h-8 text-slate-400 hover:text-white gap-1.5 px-2"
              >
                {copiadoId === tmpl.id ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar Prompt
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavegar('/skills/nova')}
                className="text-xs h-8 gap-1 text-indigo-300 hover:text-white"
              >
                Usar Modelo
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
