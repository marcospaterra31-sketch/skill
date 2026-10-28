import React, { useState } from 'react';
import { Dialog } from '../../components/ui/dialog.tsx';
import { Button } from '../../components/ui/button.tsx';
import { GitBranch, Tag, Check, Sparkles } from 'lucide-react';

export interface ReleaseModalProps {
  aberto: boolean;
  onFechar: () => void;
  versaoAtual: string;
  onConfirmar: (novaVersao: string, changelog: string) => Promise<void>;
}

export const ReleaseModal: React.FC<ReleaseModalProps> = ({
  aberto,
  onFechar,
  versaoAtual,
  onConfirmar,
}) => {
  // Parse semver básico
  const partes = versaoAtual.split('.').map((p) => parseInt(p, 10) || 0);
  const major = partes[0] || 1;
  const minor = partes[1] || 0;
  const patch = partes[2] || 0;

  const proximoPatch = `${major}.${minor}.${patch + 1}`;
  const proximoMinor = `${major}.${minor + 1}.0`;
  const proximoMajor = `${major + 1}.0.0`;

  const [tipo, setTipo] = useState<'patch' | 'minor' | 'major' | 'custom'>('patch');
  const [versaoCustom, setVersaoCustom] = useState('');
  const [changelog, setChangelog] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const versaoFinal =
    tipo === 'patch'
      ? proximoPatch
      : tipo === 'minor'
      ? proximoMinor
      : tipo === 'major'
      ? proximoMajor
      : versaoCustom.trim();

  const handleSalvar = async () => {
    if (!versaoFinal) {
      setErro('Informe um número de versão SemVer válido.');
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      await onConfirmar(versaoFinal, changelog || `Release v${versaoFinal}`);
      onFechar();
    } catch (e: any) {
      setErro(e.message || 'Falha ao publicar versão.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog
      open={aberto}
      onOpenChange={(op) => !salvando && onFechar()}
      title="Lançar Nova Versão (SemVer Release)"
      description={`Crie um snapshot imutável para esta Skill. Versão atual ativa: v${versaoAtual}`}
      maxWidth="lg"
    >
      <div className="space-y-5 pt-3">
        {erro && (
          <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-lg">
            {erro}
          </div>
        )}

        {/* Seletor de Incremento SemVer */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-2">
            Tipo de Incremento SemVer
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setTipo('patch')}
              className={`p-3 rounded-lg border text-left transition-all ${
                tipo === 'patch'
                  ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>PATCH</span>
                <span className="font-mono text-indigo-400">v{proximoPatch}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Correções de bugs e ajustes finos.</p>
            </button>

            <button
              type="button"
              onClick={() => setTipo('minor')}
              className={`p-3 rounded-lg border text-left transition-all ${
                tipo === 'minor'
                  ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>MINOR</span>
                <span className="font-mono text-indigo-400">v{proximoMinor}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Novas ferramentas e capacidades.</p>
            </button>

            <button
              type="button"
              onClick={() => setTipo('major')}
              className={`p-3 rounded-lg border text-left transition-all ${
                tipo === 'major'
                  ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>MAJOR</span>
                <span className="font-mono text-indigo-400">v{proximoMajor}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Alterações profundas de compatibilidade.</p>
            </button>
          </div>
        </div>

        {/* Versão Alvo Confirmada */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-indigo-400" />
            <span className="text-xs text-slate-300 font-medium">Tag da Versão a ser gerada:</span>
          </div>
          <span className="font-mono text-sm font-bold text-emerald-400">
            v{versaoFinal || '0.0.0'}
          </span>
        </div>

        {/* Changelog / Notas de Atualização */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1.5">
            Registro de Alterações (Changelog)
          </label>
          <textarea
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
            rows={4}
            placeholder="- Otimização do prompt de sistema&#10;- Adição de novas regras de restrição de segurança&#10;- Melhora no tratamento de exceções"
            className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 font-mono"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Essas notas serão incluídas no manifesto exportado e no histórico de auditoria.
          </p>
        </div>

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800/80">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onFechar}
            disabled={salvando}
            className="text-xs text-slate-400 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSalvar}
            disabled={salvando || !versaoFinal}
            className="text-xs font-semibold gap-1.5"
          >
            <GitBranch className="h-3.5 w-3.5" />
            {salvando ? 'Gravando no PostgreSQL...' : `Publicar Release v${versaoFinal}`}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
