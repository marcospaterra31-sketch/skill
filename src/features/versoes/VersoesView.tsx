import React, { useState, useEffect, useCallback } from 'react';
import { RoutePath, VersaoComSkill, Skill } from '../../types/index.ts';
import { versaoService } from '../../services/versoes/versao.service.ts';
import { skillService } from '../../services/skills/skill.service.ts';
import { Button } from '../../components/ui/button.tsx';
import { Input } from '../../components/ui/input.tsx';
import { Card, CardContent } from '../../components/ui/card.tsx';
import { Dialog } from '../../components/ui/dialog.tsx';
import { useToast } from '../../components/ui/toast.tsx';
import { validarSemver } from '../../lib/validacao/index.ts';
import {
  GitBranch,
  GitCommit,
  GitCompare,
  History,
  RotateCcw,
  Sparkles,
  Search,
  Tag,
  Check,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  ExternalLink,
  Copy,
  Layers,
  FileCode,
  AlertCircle,
} from 'lucide-react';

export interface VersoesViewProps {
  onNavegar: (caminho: RoutePath, paramSkillId?: string) => void;
}

export const VersoesView: React.FC<VersoesViewProps> = ({ onNavegar }) => {
  const { adicionarToast } = useToast();

  const [versoes, setVersoes] = useState<VersaoComSkill[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Filtros
  const [skillFiltro, setSkillFiltro] = useState<string>('todas');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [busca, setBusca] = useState('');

  // Validador SemVer
  const [versaoTeste, setVersaoTeste] = useState('1.2.0');
  const [semverValido, setSemverValido] = useState<boolean>(true);

  // Modais
  const [modalDiffAberto, setModalDiffAberto] = useState(false);
  const [versaoDiffA, setVersaoDiffA] = useState<VersaoComSkill | null>(null);
  const [versaoDiffB, setVersaoDiffB] = useState<VersaoComSkill | null>(null);

  const [modalInspecionarAberto, setModalInspecionarAberto] = useState(false);
  const [versaoInspecionada, setVersaoInspecionada] = useState<VersaoComSkill | null>(null);

  const [modalGerarChangelogAberto, setModalGerarChangelogAberto] = useState(false);
  const [gerandoChangelog, setGerandoChangelog] = useState(false);
  const [changelogGerado, setChangelogGerado] = useState('');
  const [promptAntigoChangelog, setPromptAntigoChangelog] = useState('');
  const [promptNovoChangelog, setPromptNovoChangelog] = useState('');
  const [versaoChangelogTag, setVersaoChangelogTag] = useState('1.1.0');

  // Carrega versões e skills
  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [listaVersoes, listaSkills] = await Promise.all([
        versaoService.listarTodasVersoes(),
        skillService.listarSkills(),
      ]);
      setVersoes(listaVersoes);
      setSkills(listaSkills);
    } catch (e: any) {
      adicionarToast('error', 'Falha ao carregar versões', e.message || 'Erro ao consultar banco de dados.');
    } finally {
      setCarregando(false);
    }
  }, [adicionarToast]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const checarSemver = (val: string) => {
    setVersaoTeste(val);
    setSemverValido(validarSemver(val));
  };

  // Reversão de versão
  const handleReverter = async (versao: VersaoComSkill) => {
    if (!window.confirm(`Deseja realmente reverter a Skill "${versao.skillTitle}" para a versão v${versao.versionNumber}?`)) {
      return;
    }
    try {
      const sucesso = await versaoService.reverterVersao(versao.skillId, versao.id);
      if (sucesso) {
        adicionarToast('success', 'Versão Restaurada!', `A Skill agora está ativa na versão v${versao.versionNumber}.`);
        await carregarDados();
      } else {
        adicionarToast('error', 'Erro na reversão', 'Não foi possível reverter para a versão selecionada.');
      }
    } catch (e: any) {
      adicionarToast('error', 'Erro ao reverter', e.message);
    }
  };

  // Gerar Changelog com IA
  const handleGerarChangelogIA = async () => {
    if (!promptNovoChangelog.trim()) return;
    setGerandoChangelog(true);
    try {
      const changelog = await versaoService.gerarChangelogComIA(
        promptAntigoChangelog,
        promptNovoChangelog,
        versaoChangelogTag
      );
      setChangelogGerado(changelog);
      adicionarToast('success', 'Changelog Gerado!', 'Notas de lançamento sintetizadas com IA.');
    } catch (e: any) {
      adicionarToast('error', 'Falha no Changelog', e.message);
    } finally {
      setGerandoChangelog(false);
    }
  };

  // Abrir comparador entre duas versões
  const abrirComparador = (vA: VersaoComSkill, vB?: VersaoComSkill) => {
    setVersaoDiffA(vA);
    if (vB) {
      setVersaoDiffB(vB);
    } else {
      // Procura a versão anterior da mesma skill
      const daMesmaSkill = versoes.filter((v) => v.skillId === vA.skillId);
      const indexAtual = daMesmaSkill.findIndex((v) => v.id === vA.id);
      const anterior = daMesmaSkill[indexAtual + 1] || vA;
      setVersaoDiffB(anterior);
    }
    setModalDiffAberto(true);
  };

  // Filtragem de versões
  const versoesFiltradas = versoes.filter((v) => {
    const correspondeSkill = skillFiltro === 'todas' || v.skillId === skillFiltro;

    let correspondeTipo = true;
    if (tipoFiltro === 'major') correspondeTipo = v.versionNumber.endsWith('.0.0');
    if (tipoFiltro === 'minor') correspondeTipo = !v.versionNumber.endsWith('.0.0') && v.versionNumber.endsWith('.0');
    if (tipoFiltro === 'patch') correspondeTipo = !v.versionNumber.endsWith('.0');

    const termo = busca.toLowerCase();
    const correspondeBusca =
      !busca ||
      v.versionNumber.toLowerCase().includes(termo) ||
      (v.changelog || '').toLowerCase().includes(termo) ||
      (v.skillTitle || '').toLowerCase().includes(termo);

    return correspondeSkill && correspondeTipo && correspondeBusca;
  });

  const totalVersoes = versoes.length;
  const ultimoRelease = versoes[0];
  const skillsComMultiplasVersoes = skills.filter((s) => {
    const qtd = versoes.filter((v) => v.skillId === s.id).length;
    return qtd > 1;
  }).length;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              Histórico & Versionamento SemVer
            </h1>
            <span className="rounded bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
              Fase 6
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Linha do tempo de releases imutáveis, rastreabilidade de prompts, comparador de diffs e reversão de versões.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => {
              if (versoes.length > 0) {
                setPromptNovoChangelog(versoes[0].systemPrompt);
                setPromptAntigoChangelog(versoes[1]?.systemPrompt || '');
                setVersaoChangelogTag(versoes[0].versionNumber);
              }
              setModalGerarChangelogAberto(true);
            }}
            size="sm"
            variant="outline"
            className="text-xs font-semibold gap-1.5 text-indigo-300 border-indigo-800/60 hover:bg-indigo-950/30"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Gerar Changelog com IA
          </Button>

          <Button
            onClick={() => onNavegar('/skills/editor')}
            size="sm"
            variant="primary"
            className="text-xs font-semibold gap-1.5"
          >
            <GitBranch className="h-3.5 w-3.5" />
            Lançar Novo Release
          </Button>
        </div>
      </div>

      {/* Telemetria de Versões */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total de Releases</span>
            <GitCommit className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono tabular-nums">
            {totalVersoes}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Snapshots registrados no Cloud SQL</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Skills Versionadas</span>
            <Layers className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono tabular-nums">
            {skills.length}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {skillsComMultiplasVersoes} com múltiplos releases
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Último Release</span>
            <Tag className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">
            {ultimoRelease ? `v${ultimoRelease.versionNumber}` : '—'}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 truncate">
            {ultimoRelease?.skillTitle || 'Nenhuma versão criada'}
          </p>
        </div>

        {/* Validador SemVer Inline */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium">Validador SemVer 2.0</span>
              <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${semverValido ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                {semverValido ? 'VÁLIDO' : 'INVÁLIDO'}
              </span>
            </div>
            <input
              type="text"
              value={versaoTeste}
              onChange={(e) => checarSemver(e.target.value)}
              placeholder="ex: 1.0.0"
              className="w-full h-7 rounded border border-slate-800 bg-slate-950 px-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Regra estrita: Major.Minor.Patch</span>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Skill */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Skill:</span>
            <select
              value={skillFiltro}
              onChange={(e) => setSkillFiltro(e.target.value)}
              className="h-8 rounded-lg border border-slate-800 bg-slate-900 px-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[200px] truncate"
            >
              <option value="todas">Todas as Skills ({skills.length})</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} (v{s.currentVersion})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por tipo SemVer */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {['todos', 'major', 'minor', 'patch'].map((tipo) => (
              <button
                key={tipo}
                onClick={() => setTipoFiltro(tipo)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded uppercase tracking-wider transition-colors ${
                  tipoFiltro === tipo
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>

        {/* Input de Busca */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por versão ou changelog..."
            className="h-8 w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Linha do Tempo de Versões (Git-like Timeline) */}
      {carregando ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-xs text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <span>Consultando histórico de versões no Cloud SQL...</span>
          </div>
        </div>
      ) : versoesFiltradas.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-slate-800 bg-slate-900/40">
          <History className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">Nenhum release encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Nenhuma versão corresponde aos filtros selecionados. Tente ajustar os filtros ou crie um novo release no Editor.
          </p>
          <Button
            onClick={() => onNavegar('/skills/editor')}
            size="sm"
            variant="primary"
            className="mt-4 text-xs font-semibold"
          >
            Ir para o Editor de Skills
          </Button>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
          {versoesFiltradas.map((ver, idx) => {
            const isVersaoAtiva = ver.currentSkillVersion === ver.versionNumber;
            const anterior = versoes.find(
              (v) => v.skillId === ver.skillId && v.id !== ver.id && new Date(v.createdAt) < new Date(ver.createdAt)
            );

            return (
              <div key={ver.id} className="relative group">
                {/* Marcador do nó da timeline */}
                <div
                  className={`absolute -left-[1.85rem] top-4 h-4 w-4 rounded-full border-2 transition-all ${
                    isVersaoAtiva
                      ? 'border-emerald-500 bg-emerald-950 ring-4 ring-emerald-500/20'
                      : 'border-indigo-500 bg-slate-950 group-hover:border-indigo-400'
                  }`}
                />

                <div className="rounded-xl border border-slate-800/90 bg-slate-900/70 p-5 shadow-lg transition-all hover:border-slate-700 hover:bg-slate-900/90">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-base font-bold text-emerald-400">
                        v{ver.versionNumber}
                      </span>

                      {isVersaoAtiva && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                          PRODUÇÃO / ATIVA
                        </span>
                      )}

                      <span className="text-xs font-semibold text-white">
                        {ver.skillTitle || 'Skill'}
                      </span>

                      <span className="text-slate-600">·</span>

                      <span className="text-[11px] text-slate-400 font-sans">
                        {ver.skillCategory}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {new Date(ver.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>·</span>
                      <span className="text-slate-500 text-[11px]">ID: {ver.id.substring(0, 10)}</span>
                    </div>
                  </div>

                  {/* Changelog */}
                  <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800/70">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Registro de Alterações (Changelog)
                    </span>
                    <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                      {ver.changelog || 'Release inicial do sistema sem notas de versão detalhadas.'}
                    </p>
                  </div>

                  {/* Resumo do Snapshot */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/50">
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span>{ver.systemPrompt.length} chars</span>
                      <span>·</span>
                      <span>~{Math.ceil(ver.systemPrompt.length / 4)} tokens</span>
                      {ver.toolsConfig && (
                        <>
                          <span>·</span>
                          <span className="text-indigo-400">Ferramentas JSON Ativas</span>
                        </>
                      )}
                    </div>

                    {/* Botões de Ação por Versão */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setVersaoInspecionada(ver);
                          setModalInspecionarAberto(true);
                        }}
                        className="h-7 text-xs text-slate-300 hover:text-white"
                      >
                        <FileCode className="h-3 w-3 mr-1" />
                        Ver Snapshot
                      </Button>

                      {anterior && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => abrirComparador(ver, anterior)}
                          className="h-7 text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          <GitCompare className="h-3 w-3 mr-1" />
                          Comparar Diff
                        </Button>
                      )}

                      {!isVersaoAtiva && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReverter(ver)}
                          className="h-7 text-xs text-amber-400 border-amber-800/60 hover:bg-amber-950/30"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Reverter para esta
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onNavegar('/skills/editor', ver.skillId)}
                        className="h-7 text-xs gap-1"
                      >
                        Abrir Editor
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Inspecionar Snapshot Completo */}
      {versaoInspecionada && (
        <Dialog
          open={modalInspecionarAberto}
          onOpenChange={() => setModalInspecionarAberto(false)}
          title={`Snapshot v${versaoInspecionada.versionNumber} — ${versaoInspecionada.skillTitle}`}
          description={`Registrado em ${new Date(versaoInspecionada.createdAt).toLocaleString('pt-BR')}`}
          maxWidth="xl"
        >
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white">System Prompt Completo</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(versaoInspecionada.systemPrompt);
                    adicionarToast('info', 'Copiado!', 'Prompt copiado para a área de transferência.');
                  }}
                  className="text-[11px] text-indigo-400 hover:text-white flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" /> Copiar
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {versaoInspecionada.systemPrompt}
              </pre>
            </div>

            {versaoInspecionada.userInstructions && (
              <div>
                <span className="text-xs font-bold text-white block mb-1">Diretrizes Operacionais</span>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {versaoInspecionada.userInstructions}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="secondary" onClick={() => setModalInspecionarAberto(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Modal: Comparador Granular de Diffs */}
      {modalDiffAberto && versaoDiffA && versaoDiffB && (
        <Dialog
          open={modalDiffAberto}
          onOpenChange={() => setModalDiffAberto(false)}
          title={`Comparação: v${versaoDiffA.versionNumber} vs v${versaoDiffB.versionNumber}`}
          description={`Comparando snapshots da Skill "${versaoDiffA.skillTitle}"`}
          maxWidth="xl"
        >
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 block">
                  Versão Recente: v{versaoDiffA.versionNumber}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {new Date(versaoDiffA.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-300 block">
                  Versão Base: v{versaoDiffB.versionNumber}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {new Date(versaoDiffB.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Diffs visuais */}
            <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs leading-5">
              {versaoDiffA.systemPrompt.split('\n').map((linha, i) => {
                const linhasAntigas = versaoDiffB.systemPrompt.split('\n');
                const existiaAntes = linhasAntigas.includes(linha);
                return (
                  <div
                    key={i}
                    className={`px-2 py-0.5 rounded ${
                      !existiaAntes ? 'bg-emerald-950/40 text-emerald-300 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <span className="select-none text-slate-600 mr-3">{i + 1}</span>
                    <span className="mr-2 font-bold">{!existiaAntes ? '+' : ' '}</span>
                    {linha || ' '}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="secondary" onClick={() => setModalDiffAberto(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Modal: Gerador de Changelog com IA */}
      <Dialog
        open={modalGerarChangelogAberto}
        onOpenChange={() => setModalGerarChangelogAberto(false)}
        title="Gerador Inteligente de Changelog com IA"
        description="Analise as diferenças estruturais entre duas iterações e gere notas de release automaticamente."
        maxWidth="lg"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Tag da Versão Alvo
            </label>
            <input
              type="text"
              value={versaoChangelogTag}
              onChange={(e) => setVersaoChangelogTag(e.target.value)}
              className="w-full h-8 rounded border border-slate-800 bg-slate-950 px-3 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              System Prompt Anterior
            </label>
            <textarea
              value={promptAntigoChangelog}
              onChange={(e) => setPromptAntigoChangelog(e.target.value)}
              rows={3}
              placeholder="Cole o prompt anterior ou selecione uma versão..."
              className="w-full rounded border border-slate-800 bg-slate-950 p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Novo System Prompt Atualizado
            </label>
            <textarea
              value={promptNovoChangelog}
              onChange={(e) => setPromptNovoChangelog(e.target.value)}
              rows={4}
              placeholder="Cole o novo prompt com as alterações..."
              className="w-full rounded border border-slate-800 bg-slate-950 p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              variant="primary"
              onClick={handleGerarChangelogIA}
              disabled={gerandoChangelog || !promptNovoChangelog.trim()}
              className="text-xs font-semibold gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {gerandoChangelog ? 'Sintetizando Notas com IA...' : 'Sintetizar Changelog'}
            </Button>
          </div>

          {changelogGerado && (
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-white">Changelog Gerado</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(changelogGerado);
                    adicionarToast('info', 'Copiado!', 'Changelog copiado para a área de transferência.');
                  }}
                  className="text-indigo-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  <Copy className="h-3 w-3" /> Copiar Markdown
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
                {changelogGerado}
              </pre>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
};
