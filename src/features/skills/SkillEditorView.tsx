import React, { useState, useEffect, useCallback } from 'react';
import { RoutePath, Skill, SkillVersion, SkillStatus, SkillDetalhada } from '../../types/index.ts';
import { skillService } from '../../services/skills/skill.service.ts';
import { useAuth } from '../../lib/autenticacao/AuthContext.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { useToast } from '../../components/ui/toast.tsx';
import { ReleaseModal } from './ReleaseModal.tsx';
import { DiffViewerModal } from './DiffViewerModal.tsx';
import { SimuladorModal } from './SimuladorModal.tsx';
import {
  ArrowLeft,
  Save,
  GitBranch,
  GitCompare,
  Play,
  FlaskConical,
  SearchCheck,
  Package,
  Copy,
  Trash2,
  Check,
  AlertCircle,
  FileCode,
  Sliders,
  Tag,
  Clock,
  Sparkles,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

export interface SkillEditorViewProps {
  onNavegar: (caminho: RoutePath) => void;
  skillIdInicial?: string | null;
}

export const SkillEditorView: React.FC<SkillEditorViewProps> = ({
  onNavegar,
  skillIdInicial,
}) => {
  const { token } = useAuth();
  const { adicionarToast } = useToast();

  // Estados principais da skill
  const [skillsDisponiveis, setSkillsDisponiveis] = useState<Skill[]>([]);
  const [skillIdAtiva, setSkillIdAtiva] = useState<string>(skillIdInicial || '');
  const [skill, setSkill] = useState<SkillDetalhada | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [temAlteracoesNaoSalvas, setTemAlteracoesNaoSalvas] = useState(false);

  // Aba ativa: 'prompts' | 'ferramentas' | 'identidade' | 'versoes'
  const [abaAtiva, setAbaAtiva] = useState<'prompts' | 'ferramentas' | 'identidade' | 'versoes'>('prompts');

  // Campos de edição
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [novaTag, setNovaTag] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [status, setStatus] = useState<SkillStatus>(SkillStatus.DRAFT);
  const [isPublic, setIsPublic] = useState(false);

  // Prompts e Regras
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userInstructions, setUserInstructions] = useState('');
  const [negativeRules, setNegativeRules] = useState('');
  const [targetFormat, setTargetFormat] = useState('CLAUDE_SKILL');

  // Ferramentas JSON
  const [toolsJson, setToolsJson] = useState('{\n  "functions": []\n}');
  const [erroJson, setErroJson] = useState<string | null>(null);

  // Modais
  const [modalReleaseAberto, setModalReleaseAberto] = useState(false);
  const [modalDiffAberto, setModalDiffAberto] = useState(false);
  const [modalSimuladorAberto, setModalSimuladorAberto] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  // Carrega lista de skills para seletor
  const carregarLista = useCallback(async () => {
    try {
      const lista = await skillService.listarSkills();
      setSkillsDisponiveis(lista);
      if (!skillIdAtiva && lista.length > 0) {
        setSkillIdAtiva(lista[0].id);
      }
    } catch {
      // Ignora erro de lista
    }
  }, [skillIdAtiva]);

  // Carrega detalhes completos da skill ativa
  const carregarDetalhes = useCallback(async (id: string) => {
    if (!id) return;
    setCarregando(true);
    try {
      const dados = await skillService.obterSkillDetalhes(id, token);
      if (dados) {
        setSkill(dados);
        setTitle(dados.title);
        setSlug(dados.slug);
        setDescription(dados.description);
        setCategory(dados.category);
        setTags(dados.tags || []);
        setTargetAudience(dados.targetAudience || '');
        setStatus(dados.status as SkillStatus);
        setIsPublic(dados.isPublic);

        // Preenche com a versão mais recente
        if (dados.versions && dados.versions.length > 0) {
          const ver = dados.versions[0];
          setSystemPrompt(ver.systemPrompt || '');
          setUserInstructions(ver.userInstructions || '');
          const meta = (ver.metadata as Record<string, any>) || {};
          setNegativeRules(meta.negativeRules || '');
          setTargetFormat(meta.targetFormat || 'CLAUDE_SKILL');
          if (ver.toolsConfig) {
            setToolsJson(JSON.stringify(ver.toolsConfig, null, 2));
          }
        }
        setTemAlteracoesNaoSalvas(false);
      }
    } catch (e: any) {
      adicionarToast(
        'error',
        'Erro ao carregar Skill',
        e.message || 'Falha ao buscar dados no banco de dados.'
      );
    } finally {
      setCarregando(false);
    }
  }, [token, adicionarToast]);

  useEffect(() => {
    carregarLista();
  }, [carregarLista]);

  useEffect(() => {
    if (skillIdAtiva) {
      carregarDetalhes(skillIdAtiva);
    }
  }, [skillIdAtiva, carregarDetalhes]);

  // Detector de atalho Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSalvar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Salvar alterações no PostgreSQL
  const handleSalvar = async () => {
    if (!skillIdAtiva) return;

    // Valida JSON de ferramentas se preenchido
    let toolsParsed = null;
    if (toolsJson.trim()) {
      try {
        toolsParsed = JSON.parse(toolsJson);
        setErroJson(null);
      } catch (err: any) {
        setErroJson('JSON de ferramentas inválido.');
        setAbaAtiva('ferramentas');
        adicionarToast(
          'error',
          'Erro de validação',
          'Corrija o JSON de ferramentas antes de salvar.'
        );
        return;
      }
    }

    setSalvando(true);
    try {
      const atualizado = await skillService.salvarSkill(
        skillIdAtiva,
        {
          title,
          slug,
          description,
          category,
          tags,
          targetAudience,
          status,
          isPublic,
          systemPrompt,
          userInstructions,
          negativeRules,
          toolsConfig: toolsParsed,
          targetFormat,
        },
        token
      );

      setSkill(atualizado);
      setTemAlteracoesNaoSalvas(false);
      adicionarToast(
        'success',
        'Alterações Salvas!',
        `Rascunho atualizado com sucesso no PostgreSQL (${new Date().toLocaleTimeString('pt-BR')}).`
      );
    } catch (e: any) {
      adicionarToast(
        'error',
        'Falha ao salvar',
        e.message || 'Erro ao comunicar com o servidor.'
      );
    } finally {
      setSalvando(false);
    }
  };

  // Publicar release SemVer
  const handlePublicarRelease = async (novaVersao: string, changelog: string) => {
    if (!skillIdAtiva) return;
    let toolsParsed = null;
    if (toolsJson.trim()) {
      try {
        toolsParsed = JSON.parse(toolsJson);
      } catch {
        // Ignora
      }
    }

    const ver = await skillService.publicarNovaVersao(
      skillIdAtiva,
      {
        versionNumber: novaVersao,
        changelog,
        systemPrompt,
        userInstructions,
        negativeRules,
        toolsConfig: toolsParsed,
        targetFormat,
      },
      token
    );

    adicionarToast(
      'success',
      `Release v${novaVersao} Publicado!`,
      'Snapshot imutável gravado no histórico de versões.'
    );

    await carregarDetalhes(skillIdAtiva);
  };

  // Duplicar skill
  const handleDuplicar = async () => {
    if (!skillIdAtiva) return;
    try {
      const nova = await skillService.duplicarSkill(skillIdAtiva, token);
      adicionarToast(
        'success',
        'Skill Duplicada',
        `Criada nova cópia: "${nova.title}"`
      );
      await carregarLista();
      setSkillIdAtiva(nova.id);
    } catch (e: any) {
      adicionarToast(
        'error',
        'Erro ao duplicar',
        e.message || 'Falha na operação.'
      );
    }
  };

  // Excluir skill
  const handleExcluir = async () => {
    if (!skillIdAtiva) return;
    try {
      await skillService.excluirSkill(skillIdAtiva, token);
      adicionarToast(
        'success',
        'Skill Excluída',
        'Registro e dependências removidas do banco.'
      );
      setConfirmarExclusao(false);
      const listaAtualizada = skillsDisponiveis.filter((s) => s.id !== skillIdAtiva);
      setSkillsDisponiveis(listaAtualizada);
      if (listaAtualizada.length > 0) {
        setSkillIdAtiva(listaAtualizada[0].id);
      } else {
        onNavegar('/skills');
      }
    } catch (e: any) {
      adicionarToast(
        'error',
        'Erro ao excluir',
        e.message || 'Falha ao remover.'
      );
    }
  };

  // Restaurar prompt de versão anterior
  const handleRestaurarPrompt = (promptRestaurado: string, versaoOrigem: string) => {
    setSystemPrompt(promptRestaurado);
    setTemAlteracoesNaoSalvas(true);
    adicionarToast(
      'info',
      'Prompt Restaurado',
      `Conteúdo da versão ${versaoOrigem} carregado no editor. Clique em Salvar para persistir.`
    );
  };

  // Auxiliares
  const estimarTokens = (texto: string) => Math.ceil(texto.length / 4);

  if (carregando && !skill) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="text-xs text-slate-400">Carregando dados da Skill no Cloud SQL...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Barra de Topo & Navegação Superior */}
      <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavegar('/skills')}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors"
              title="Voltar para lista de Skills"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            {/* Seletor rápido de Skills */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">Skill:</span>
              <select
                value={skillIdAtiva}
                onChange={(e) => setSkillIdAtiva(e.target.value)}
                className="h-8 rounded-md border border-slate-800 bg-slate-900 px-2.5 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 max-w-[240px] truncate"
              >
                {skillsDisponiveis.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} (v{s.currentVersion})
                  </option>
                ))}
              </select>
            </div>

            {/* Badge de status interativo */}
            <div className="flex items-center gap-1.5 ml-2">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as SkillStatus);
                  setTemAlteracoesNaoSalvas(true);
                }}
                className={`h-7 rounded px-2 text-[11px] font-semibold uppercase tracking-wider border focus-visible:outline-none cursor-pointer ${
                  status === SkillStatus.PUBLISHED
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                    : status === SkillStatus.REVIEW
                    ? 'bg-amber-950/40 border-amber-800 text-amber-400'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
              >
                <option value={SkillStatus.DRAFT}>DRAFT (Rascunho)</option>
                <option value={SkillStatus.REVIEW}>REVIEW (Revisão)</option>
                <option value={SkillStatus.PUBLISHED}>PUBLISHED (Publicada)</option>
                <option value={SkillStatus.ARCHIVED}>ARCHIVED (Arquivada)</option>
              </select>

              <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-mono font-bold text-indigo-400 border border-indigo-500/20">
                v{skill?.currentVersion || '1.0.0'}
              </span>

              {temAlteracoesNaoSalvas && (
                <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Não salvo
                </span>
              )}
            </div>
          </div>

          {/* Barra de Ações Principais do Editor */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Salvar */}
            <Button
              onClick={handleSalvar}
              disabled={salvando}
              size="sm"
              variant={temAlteracoesNaoSalvas ? 'primary' : 'secondary'}
              className="h-8 text-xs font-semibold gap-1.5"
              title="Salvar alterações (Ctrl+S)"
            >
              <Save className="h-3.5 w-3.5" />
              {salvando ? 'Salvando...' : 'Salvar (Ctrl+S)'}
            </Button>

            {/* Lançar Release SemVer */}
            <Button
              onClick={() => setModalReleaseAberto(true)}
              size="sm"
              variant="outline"
              className="h-8 text-xs font-semibold gap-1.5 text-emerald-400 border-emerald-800/80 hover:bg-emerald-950/30"
            >
              <GitBranch className="h-3.5 w-3.5" />
              Lançar Release
            </Button>

            {/* Comparar Diffs */}
            <Button
              onClick={() => setModalDiffAberto(true)}
              size="sm"
              variant="outline"
              className="h-8 text-xs font-semibold gap-1.5 text-slate-300 border-slate-800 hover:text-white"
            >
              <GitCompare className="h-3.5 w-3.5" />
              Diffs
            </Button>

            {/* Simulação Rápida */}
            <Button
              onClick={() => setModalSimuladorAberto(true)}
              size="sm"
              variant="outline"
              className="h-8 text-xs font-semibold gap-1.5 text-indigo-300 border-indigo-800/60 hover:bg-indigo-950/30"
            >
              <Play className="h-3.5 w-3.5" />
              Simular IA
            </Button>

            {/* Links rápidos para outras fases */}
            <Button
              onClick={() => onNavegar('/laboratorio')}
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-slate-400 hover:text-white"
              title="Abrir no Laboratório de Testes"
            >
              <FlaskConical className="h-3.5 w-3.5" />
            </Button>

            <Button
              onClick={() => onNavegar('/auditor')}
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-slate-400 hover:text-white"
              title="Executar Auditoria de Segurança"
            >
              <SearchCheck className="h-3.5 w-3.5" />
            </Button>

            <Button
              onClick={() => onNavegar('/exportacoes')}
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-slate-400 hover:text-white"
              title="Exportar Pacotes"
            >
              <Package className="h-3.5 w-3.5" />
            </Button>

            {/* Duplicar */}
            <Button
              onClick={handleDuplicar}
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-slate-400 hover:text-white"
              title="Duplicar Skill"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>

            {/* Excluir */}
            <Button
              onClick={() => setConfirmarExclusao(true)}
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-red-400 hover:bg-red-950/30 hover:text-red-300"
              title="Excluir Skill"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Título inline & Metadados de resumo */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-1">
          <div>
            <h1 className="text-xl font-bold text-white font-sans tracking-tight">
              {title || 'Sem Título'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              <span className="font-mono text-indigo-400">/{slug || 'sem-slug'}</span>
              <span className="mx-2 text-slate-600">·</span>
              <span>{category || 'Sem categoria'}</span>
              <span className="mx-2 text-slate-600">·</span>
              <span>ID: <code className="text-slate-400 font-mono">{skillIdAtiva}</code></span>
            </p>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Última atualização: {new Date(skill?.updatedAt || Date.now()).toLocaleString('pt-BR')}
          </div>
        </div>
      </div>

      {/* Confirmação de Exclusão */}
      {confirmarExclusao && (
        <div className="p-4 rounded-xl border border-red-800 bg-red-950/40 text-red-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Tem certeza que deseja excluir esta Skill?</p>
              <p className="text-[11px] text-red-300">
                Esta ação removerá permanentemente a Skill, suas {skill?.versions?.length || 0} versões e registros de auditoria do Cloud SQL.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmarExclusao(false)}
              className="text-xs text-slate-300 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleExcluir}
              className="text-xs font-semibold"
            >
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      )}

      {/* Navegação por Abas do Editor */}
      <div className="flex items-center gap-1 border-b border-slate-800/80 pb-px">
        <button
          onClick={() => setAbaAtiva('prompts')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            abaAtiva === 'prompts'
              ? 'border-indigo-500 text-white bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <FileCode className="h-4 w-4 text-indigo-400" />
          Prompts & Instruções
        </button>

        <button
          onClick={() => setAbaAtiva('ferramentas')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            abaAtiva === 'ferramentas'
              ? 'border-indigo-500 text-white bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Sliders className="h-4 w-4 text-indigo-400" />
          Parâmetros & Ferramentas (JSON)
        </button>

        <button
          onClick={() => setAbaAtiva('identidade')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            abaAtiva === 'identidade'
              ? 'border-indigo-500 text-white bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Tag className="h-4 w-4 text-indigo-400" />
          Identidade & Metadados
        </button>

        <button
          onClick={() => setAbaAtiva('versoes')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
            abaAtiva === 'versoes'
              ? 'border-indigo-500 text-white bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Clock className="h-4 w-4 text-indigo-400" />
          Histórico de Versões ({skill?.versions?.length || 0})
        </button>
      </div>

      {/* Conteúdo da Aba Ativa */}
      {abaAtiva === 'prompts' && (
        <div className="space-y-6">
          {/* System Prompt (Code Editor IDE-like) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  System Prompt (Instrução Mestra do Agente)
                  <span className="rounded bg-indigo-500/15 px-1.5 py-0.5 text-[10px] text-indigo-300 font-mono lowercase">
                    core instruction
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Define a persona, postura técnica, competências e invariantes que governam as respostas.
                </p>
              </div>

              {/* Estatísticas de Tokens */}
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <span>{systemPrompt.length} caracteres</span>
                <span>·</span>
                <span>~{estimarTokens(systemPrompt)} tokens</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(systemPrompt);
                    adicionarToast('info', 'Copiado!', 'System prompt copiado para o clipboard.');
                  }}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Copiar prompt"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="relative rounded-lg border border-slate-800 bg-slate-950 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
              <textarea
                value={systemPrompt}
                onChange={(e) => {
                  setSystemPrompt(e.target.value);
                  setTemAlteracoesNaoSalvas(true);
                }}
                rows={12}
                className="w-full bg-transparent p-4 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none leading-relaxed resize-y"
                placeholder="Você é um especialista em..."
              />
            </div>
          </div>

          {/* Diretrizes Operacionais (User Instructions) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white uppercase tracking-wider block">
              Diretrizes Operacionais (Passo a Passo de Execução)
            </label>
            <p className="text-[11px] text-slate-400">
              Instruções de workflow sobre como o agente deve decompor tarefas, processar entradas e estruturar saídas.
            </p>
            <div className="rounded-lg border border-slate-800 bg-slate-950 focus-within:border-indigo-500">
              <textarea
                value={userInstructions}
                onChange={(e) => {
                  setUserInstructions(e.target.value);
                  setTemAlteracoesNaoSalvas(true);
                }}
                rows={5}
                className="w-full bg-transparent p-3 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none resize-y"
                placeholder="1. Analisar requisitos...\n2. Executar validação..."
              />
            </div>
          </div>

          {/* Guardrails de Segurança & Diretrizes Negativas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                Diretrizes Negativas (Guardrails Estritos)
                <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] text-red-300 font-mono">
                  negative constraints
                </span>
              </label>
            </div>
            <p className="text-[11px] text-slate-400">
              Comportamentos estritamente proibidos (ex: não vazar chaves de API, não inventar premissas, não retornar código não formatado).
            </p>
            <div className="rounded-lg border border-slate-800 bg-slate-950 focus-within:border-red-500">
              <textarea
                value={negativeRules}
                onChange={(e) => {
                  setNegativeRules(e.target.value);
                  setTemAlteracoesNaoSalvas(true);
                }}
                rows={4}
                className="w-full bg-transparent p-3 font-mono text-xs text-red-200/90 placeholder:text-slate-600 focus:outline-none resize-y"
                placeholder="- Nunca expor credenciais ou segredos.\n- Nunca responder sem antes verificar os esquemas."
              />
            </div>
          </div>
        </div>
      )}

      {abaAtiva === 'ferramentas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">
                Formato Alvo de Exportação
              </label>
              <select
                value={targetFormat}
                onChange={(e) => {
                  setTargetFormat(e.target.value);
                  setTemAlteracoesNaoSalvas(true);
                }}
                className="w-full h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 font-mono"
              >
                <option value="CLAUDE_SKILL">Claude Skill / Code Config (.claude/skills)</option>
                <option value="OPENAI_ASSISTANT">OpenAI Assistant & Functions (GPT-4o)</option>
                <option value="GEMINI_EXTENSION">Gemini Extension / System Instructions</option>
                <option value="CURSOR_RULE">Cursor Rule (.cursorrules)</option>
                <option value="ZIP">Pacote Completo ZIP Multi-Plataforma</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-white uppercase tracking-wider block mb-1">
                Visibilidade Pública
              </label>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="chkPublic"
                  checked={isPublic}
                  onChange={(e) => {
                    setIsPublic(e.target.checked);
                    setTemAlteracoesNaoSalvas(true);
                  }}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="chkPublic" className="text-xs text-slate-300 cursor-pointer">
                  Disponível publicamente no catálogo de Skills do workspace
                </label>
              </div>
            </div>
          </div>

          {/* Editor JSON de Ferramentas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider block">
                Definição de Ferramentas / Function Calling (JSON Schema)
              </label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  try {
                    const formatado = JSON.stringify(JSON.parse(toolsJson), null, 2);
                    setToolsJson(formatado);
                    setErroJson(null);
                  } catch {
                    setErroJson('JSON inválido para formatação.');
                  }
                }}
                className="h-7 text-[11px] text-indigo-400 hover:text-white"
              >
                Formatar JSON
              </Button>
            </div>

            {erroJson && (
              <div className="p-2.5 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-lg">
                {erroJson}
              </div>
            )}

            <div className="rounded-lg border border-slate-800 bg-slate-950 focus-within:border-indigo-500">
              <textarea
                value={toolsJson}
                onChange={(e) => {
                  setToolsJson(e.target.value);
                  setTemAlteracoesNaoSalvas(true);
                }}
                rows={12}
                className="w-full bg-transparent p-4 font-mono text-xs text-emerald-300/90 placeholder:text-slate-600 focus:outline-none resize-y"
              />
            </div>
          </div>
        </div>
      )}

      {abaAtiva === 'identidade' && (
        <div className="space-y-5 max-w-2xl">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Título da Skill</label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTemAlteracoesNaoSalvas(true);
              }}
              className="w-full h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Identificador Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setTemAlteracoesNaoSalvas(true);
              }}
              className="w-full h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs text-white font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Categoria de Atuação</label>
            <input
              type="text"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setTemAlteracoesNaoSalvas(true);
              }}
              className="w-full h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Descrição Detalhada</label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setTemAlteracoesNaoSalvas(true);
              }}
              rows={3}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Público-Alvo Recomendado</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => {
                setTargetAudience(e.target.value);
                setTemAlteracoesNaoSalvas(true);
              }}
              placeholder="Ex: Desenvolvedores Sênior, Agentes de CI/CD"
              className="w-full h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Tags de Indexação</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={novaTag}
                onChange={(e) => setNovaTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (novaTag.trim() && !tags.includes(novaTag.trim())) {
                      setTags([...tags, novaTag.trim().toLowerCase()]);
                      setNovaTag('');
                      setTemAlteracoesNaoSalvas(true);
                    }
                  }
                }}
                placeholder="Pressione Enter para adicionar tag..."
                className="w-full h-8 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px] font-mono"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => {
                      setTags(tags.filter((t) => t !== tag));
                      setTemAlteracoesNaoSalvas(true);
                    }}
                    className="hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {abaAtiva === 'versoes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div>
              <h2 className="text-sm font-bold text-white">Linha do Tempo de Versões (PostgreSQL)</h2>
              <p className="text-xs text-slate-400">
                Snapshots imutáveis registrados com SemVer e notas de alteração.
              </p>
            </div>
            <Button
              onClick={() => setModalReleaseAberto(true)}
              size="sm"
              variant="primary"
              className="text-xs font-semibold gap-1.5"
            >
              <GitBranch className="h-3.5 w-3.5" />
              Lançar Nova Versão
            </Button>
          </div>

          <div className="space-y-3">
            {skill?.versions?.map((ver, idx) => (
              <div
                key={ver.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      v{ver.versionNumber}
                    </span>
                    {idx === 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                        VERSÃO ATIVA
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 font-mono">
                      · {new Date(ver.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {ver.changelog || 'Sem notas de versão registradas.'}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-400">
                    <span>{ver.systemPrompt.length} chars</span>
                    <span>·</span>
                    <span>~{estimarTokens(ver.systemPrompt)} tokens</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setModalDiffAberto(true);
                    }}
                    className="h-8 text-xs text-slate-300 hover:text-white gap-1"
                  >
                    <GitCompare className="h-3 w-3" />
                    Comparar
                  </Button>

                  {idx !== 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestaurarPrompt(ver.systemPrompt, `v${ver.versionNumber}`)}
                      className="h-8 text-xs text-indigo-400 hover:text-indigo-300 gap-1 border-slate-700"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restaurar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modais Integrados */}
      <ReleaseModal
        aberto={modalReleaseAberto}
        onFechar={() => setModalReleaseAberto(false)}
        versaoAtual={skill?.currentVersion || '1.0.0'}
        onConfirmar={handlePublicarRelease}
      />

      <DiffViewerModal
        aberto={modalDiffAberto}
        onFechar={() => setModalDiffAberto(false)}
        versoes={skill?.versions || []}
        promptAtual={systemPrompt}
        onRestaurarPrompt={handleRestaurarPrompt}
      />

      <SimuladorModal
        aberto={modalSimuladorAberto}
        onFechar={() => setModalSimuladorAberto(false)}
        skillId={skillIdAtiva}
        systemPrompt={systemPrompt}
        skillTitle={title}
      />
    </div>
  );
};
