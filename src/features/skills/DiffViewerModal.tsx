import React, { useState } from 'react';
import { Dialog } from '../../components/ui/dialog.tsx';
import { Button } from '../../components/ui/button.tsx';
import { SkillVersion } from '../../types/index.ts';
import { GitCompare, ArrowLeftRight, Check, RotateCcw } from 'lucide-react';

export interface DiffViewerModalProps {
  aberto: boolean;
  onFechar: () => void;
  versoes: SkillVersion[];
  promptAtual: string;
  onRestaurarPrompt: (promptRestaurado: string, versaoRestaurada: string) => void;
}

interface LinhaDiff {
  tipo: 'igual' | 'adicionado' | 'removido';
  texto: string;
  numOriginal?: number;
  numNovo?: number;
}

function calcularDiffLinhas(antigo: string, novo: string): LinhaDiff[] {
  const linhasAntigas = antigo.split('\n');
  const linhasNovas = novo.split('\n');
  const diff: LinhaDiff[] = [];

  const max = Math.max(linhasAntigas.length, linhasNovas.length);
  let idxA = 0;
  let idxB = 0;

  while (idxA < linhasAntigas.length || idxB < linhasNovas.length) {
    const lA = linhasAntigas[idxA];
    const lB = linhasNovas[idxB];

    if (lA === lB) {
      diff.push({ tipo: 'igual', texto: lA, numOriginal: idxA + 1, numNovo: idxB + 1 });
      idxA++;
      idxB++;
    } else if (lA !== undefined && !linhasNovas.slice(idxB).includes(lA)) {
      diff.push({ tipo: 'removido', texto: lA, numOriginal: idxA + 1 });
      idxA++;
    } else if (lB !== undefined && !linhasAntigas.slice(idxA).includes(lB)) {
      diff.push({ tipo: 'adicionado', texto: lB, numNovo: idxB + 1 });
      idxB++;
    } else {
      if (lA !== undefined) {
        diff.push({ tipo: 'removido', texto: lA, numOriginal: idxA + 1 });
        idxA++;
      }
      if (lB !== undefined) {
        diff.push({ tipo: 'adicionado', texto: lB, numNovo: idxB + 1 });
        idxB++;
      }
    }
  }

  return diff;
}

export const DiffViewerModal: React.FC<DiffViewerModalProps> = ({
  aberto,
  onFechar,
  versoes,
  promptAtual,
  onRestaurarPrompt,
}) => {
  const [versaoBaseId, setVersaoBaseId] = useState<string>(versoes[0]?.id || 'atual');
  const [versaoComparadaId, setVersaoComparadaId] = useState<string>(
    versoes[1]?.id || versoes[0]?.id || 'atual'
  );

  const obterTextoVersao = (id: string): { texto: string; label: string } => {
    if (id === 'atual') {
      return { texto: promptAtual, label: 'Rascunho Ativo do Editor' };
    }
    const ver = versoes.find((v) => v.id === id);
    return ver
      ? { texto: ver.systemPrompt, label: `v${ver.versionNumber}` }
      : { texto: '', label: 'Desconhecido' };
  };

  const base = obterTextoVersao(versaoBaseId);
  const comparada = obterTextoVersao(versaoComparadaId);
  const linhas = calcularDiffLinhas(comparada.texto, base.texto);

  const alteracoesAdicionadas = linhas.filter((l) => l.tipo === 'adicionado').length;
  const alteracoesRemovidas = linhas.filter((l) => l.tipo === 'removido').length;

  return (
    <Dialog
      open={aberto}
      onOpenChange={onFechar}
      title="Comparador de Versões & Diffs de Prompt"
      description="Inspecione alterações granulares linha por linha entre versões e reverta para snapshots anteriores."
      maxWidth="xl"
    >
      <div className="space-y-4 pt-3">
        {/* Barra de Seleção de Versões para Comparação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Versão Alvo (Recebe as alterações / Atual)
            </label>
            <select
              value={versaoBaseId}
              onChange={(e) => setVersaoBaseId(e.target.value)}
              className="w-full h-8 text-xs bg-slate-900 border border-slate-700 rounded px-2 text-white font-mono"
            >
              <option value="atual">Rascunho Ativo (No Editor)</option>
              {versoes.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.versionNumber} ({new Date(v.createdAt).toLocaleDateString('pt-BR')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Versão Base (Ponto de comparação anterior)
            </label>
            <select
              value={versaoComparadaId}
              onChange={(e) => setVersaoComparadaId(e.target.value)}
              className="w-full h-8 text-xs bg-slate-900 border border-slate-700 rounded px-2 text-white font-mono"
            >
              {versoes.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.versionNumber} — {v.changelog || 'Sem changelog'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Estatísticas do Diff */}
        <div className="flex items-center justify-between text-xs px-2 text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400 font-mono">
              +{alteracoesAdicionadas} linhas adicionadas
            </span>
            <span className="flex items-center gap-1 text-red-400 font-mono">
              -{alteracoesRemovidas} linhas removidas
            </span>
          </div>
          {versaoComparadaId !== 'atual' && (
            <button
              onClick={() => {
                onRestaurarPrompt(comparada.texto, comparada.label);
                onFechar();
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar {comparada.label} no Editor
            </button>
          )}
        </div>

        {/* Visualizador de Código com Diffs */}
        <div className="max-h-[380px] overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/90 font-mono text-xs">
          <table className="w-full border-collapse">
            <tbody>
              {linhas.map((linha, i) => (
                <tr
                  key={i}
                  className={`border-b border-slate-900/60 leading-5 ${
                    linha.tipo === 'adicionado'
                      ? 'bg-emerald-950/30 text-emerald-300'
                      : linha.tipo === 'removido'
                      ? 'bg-red-950/30 text-red-400 line-through'
                      : 'text-slate-300 hover:bg-slate-900/40'
                  }`}
                >
                  <td className="w-10 px-2 text-right select-none text-[10px] text-slate-600 border-r border-slate-800/60">
                    {linha.numOriginal || ''}
                  </td>
                  <td className="w-10 px-2 text-right select-none text-[10px] text-slate-600 border-r border-slate-800/60">
                    {linha.numNovo || ''}
                  </td>
                  <td className="w-6 text-center select-none font-bold">
                    {linha.tipo === 'adicionado' ? '+' : linha.tipo === 'removido' ? '-' : ' '}
                  </td>
                  <td className="px-3 py-0.5 whitespace-pre-wrap break-all">{linha.texto || ' '}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="secondary" size="sm" onClick={onFechar} className="text-xs">
            Fechar Visualizador
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
