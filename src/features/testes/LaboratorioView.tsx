import React, { useState, useEffect, useCallback } from 'react';
import { RoutePath, Skill, SkillTestComResultado } from '../../types/index.ts';
import { testeService } from '../../services/testes/teste.service.ts';
import { skillService } from '../../services/skills/skill.service.ts';
import { Button } from '../../components/ui/button.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { useToast } from '../../components/ui/toast.tsx';
import { NovoTesteModal } from './NovoTesteModal.tsx';
import { DetalhesResultadoModal } from './DetalhesResultadoModal.tsx';
import {
  FlaskConical,
  Play,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Layers,
  Search,
  Check,
  RotateCw,
  Trash2,
  Eye,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Wand2,
} from 'lucide-react';

export interface LaboratorioViewProps {
  onNavegar: (caminho: RoutePath, paramSkillId?: string) => void;
}

export const LaboratorioView: React.FC<LaboratorioViewProps> = ({ onNavegar }) => {
  const { adicionarToast } = useToast();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [testes, setTestes] = useState<SkillTestComResultado[]>([]);
  const [skillFiltro, setSkillFiltro] = useState<string>('todas');
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  // Execução
  const [executandoId, setExecutandoId] = useState<string | null>(null);
  const [executandoTodos, setExecutandoTodos] = useState(false);

  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [testeInspecionado, setTesteInspecionado] = useState<SkillTestComResultado | null>(null);

  // Carrega dados iniciais
  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [listaSkills, listaTestes] = await Promise.all([
        skillService.listarSkills(),
        testeService.listarTestes(skillFiltro),
      ]);
      setSkills(listaSkills);
      setTestes(listaTestes);
    } catch (e: any) {
      adicionarToast('error', 'Erro ao carregar testes', e.message);
    } finally {
      setCarregando(false);
    }
  }, [skillFiltro, adicionarToast]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Executar teste individual
  const handleExecutarTeste = async (testeId: string) => {
    setExecutandoId(testeId);
    try {
      const resultado = await testeService.executarTeste(testeId);
      adicionarToast(
        resultado.status === 'PASSED' ? 'success' : 'error',
        resultado.status === 'PASSED' ? 'Teste Aprovado!' : 'Falha no Teste',
        `Score: ${resultado.score}% · Latência: ${resultado.latencyMs}ms`
      );
      await carregarDados();
      if (testeInspecionado?.id === testeId) {
        const atualizado = testes.find((t) => t.id === testeId);
        if (atualizado) setTesteInspecionado({ ...atualizado, latestResult: resultado });
      }
    } catch (e: any) {
      adicionarToast('error', 'Erro na execução', e.message);
    } finally {
      setExecutandoId(null);
    }
  };

  // Executar bateria completa de testes
  const handleExecutarTodos = async () => {
    if (skills.length === 0) return;
    setExecutandoTodos(true);
    try {
      const skillIdAlvo = skillFiltro === 'todas' ? skills[0]?.id : skillFiltro;
      if (!skillIdAlvo) return;

      const res = await testeService.executarTodosTestes(skillIdAlvo);
      adicionarToast(
        'success',
        'Bateria de Testes Finalizada!',
        `${res.passed} aprovados de ${res.total} executados (${res.passRate}% taxa de sucesso).`
      );
      await carregarDados();
    } catch (e: any) {
      adicionarToast('error', 'Erro no pipeline', e.message);
    } finally {
      setExecutandoTodos(false);
    }
  };

  // Criar caso de teste
  const handleCriarTeste = async (dados: any) => {
    try {
      await testeService.criarTeste(dados);
      adicionarToast('success', 'Caso de Teste Criado', 'Novo teste persistido no Cloud SQL.');
      await carregarDados();
    } catch (e: any) {
      adicionarToast('error', 'Erro ao salvar', e.message);
    }
  };

  // Excluir teste
  const handleExcluirTeste = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Deseja realmente excluir este caso de teste?')) return;
    try {
      await testeService.excluirTeste(id);
      adicionarToast('success', 'Teste Removido', 'Caso de teste excluído com sucesso.');
      await carregarDados();
    } catch (err: any) {
      adicionarToast('error', 'Erro ao excluir', err.message);
    }
  };

  // Filtragem
  const testesFiltrados = testes.filter((t) => {
    const correspondeSkill = skillFiltro === 'todas' || t.skillId === skillFiltro;

    let correspondeStatus = true;
    if (statusFiltro === 'passed') correspondeStatus = t.latestResult?.status === 'PASSED';
    if (statusFiltro === 'failed') correspondeStatus = t.latestResult?.status === 'FAILED';
    if (statusFiltro === 'pending') correspondeStatus = !t.latestResult;

    const termo = busca.toLowerCase();
    const correspondeBusca =
      !busca ||
      t.name.toLowerCase().includes(termo) ||
      (t.skillTitle || '').toLowerCase().includes(termo) ||
      (t.description || '').toLowerCase().includes(termo);

    return correspondeSkill && correspondeStatus && correspondeBusca;
  });

  // Estatísticas calculadas
  const total = testes.length;
  const executados = testes.filter((t) => t.latestResult).length;
  const aprovados = testes.filter((t) => t.latestResult?.status === 'PASSED').length;
  const taxaAprovacao = executados > 0 ? Math.round((aprovados / executados) * 100) : 100;

  const latencias = testes
    .map((t) => t.latestResult?.latencyMs)
    .filter((l): l is number => typeof l === 'number' && l > 0);
  const mediaLatencia =
    latencias.length > 0 ? Math.round(latencias.reduce((a, b) => a + b, 0) / latencias.length) : 340;

  const tokens = testes
    .map((t) => t.latestResult?.tokensUsed)
    .filter((tok): tok is number => typeof tok === 'number' && tok > 0);
  const mediaTokens =
    tokens.length > 0 ? Math.round(tokens.reduce((a, b) => a + b, 0) / tokens.length) : 420;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              Laboratório de Testes & Asserções
            </h1>
            <span className="rounded bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
              Fase 7 Real
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Validação automatizada de prompts, asserções de saída, verificação de guardrails e telemetria de latência.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={carregarDados}
            size="sm"
            variant="secondary"
            className="text-xs h-8 text-slate-300 hover:text-white"
            title="Atualizar resultados do banco"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>

          <Button
            onClick={() => setModalNovoAberto(true)}
            size="sm"
            variant="outline"
            className="text-xs font-semibold gap-1.5 text-slate-200 border-slate-700 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5 text-indigo-400" />
            Novo Caso de Teste
          </Button>

          <Button
            onClick={() => onNavegar('/otimizacao', skillFiltro !== 'todas' ? skillFiltro : undefined)}
            size="sm"
            variant="outline"
            className="text-xs font-semibold gap-1.5 text-amber-300 border-amber-800/60 hover:bg-amber-950/30"
          >
            <Wand2 className="h-3.5 w-3.5 text-amber-400" />
            Melhoria Automática
          </Button>

          <Button
            onClick={handleExecutarTodos}
            disabled={executandoTodos || testes.length === 0}
            size="sm"
            variant="primary"
            className="text-xs font-semibold gap-1.5"
          >
            <Play className={`h-3.5 w-3.5 ${executandoTodos ? 'animate-spin' : ''}`} />
            {executandoTodos ? 'Executando Bateria...' : 'Executar Todos os Testes'}
          </Button>
        </div>
      </div>

      {/* Cards de Métricas do Laboratório */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Casos de Teste</span>
            <FlaskConical className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono tabular-nums">
            {total}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {executados} executados · {total - executados} pendentes
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Taxa de Aprovação</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {taxaAprovacao}%
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {aprovados} de {executados || total} em conformidade
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Latência Média</span>
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono tabular-nums">
            {mediaLatencia}ms
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Tempo de inferência real (@google/genai)</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Consumo de Tokens</span>
            <Cpu className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono tabular-nums">
            ~{mediaTokens}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Média por execução de caso de teste</p>
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

          {/* Filtro por status do teste */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {['todos', 'passed', 'failed', 'pending'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFiltro(st)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded uppercase tracking-wider transition-colors ${
                  statusFiltro === st
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'todos' ? 'Todos' : st === 'passed' ? 'Aprovados' : st === 'failed' ? 'Falhos' : 'Pendentes'}
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
            placeholder="Buscar por caso de teste..."
            className="h-8 w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Lista de Casos de Teste */}
      {carregando ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-xs text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <span>Consultando banco de dados no Cloud SQL...</span>
          </div>
        </div>
      ) : testesFiltrados.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-slate-800 bg-slate-900/40">
          <FlaskConical className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">Nenhum caso de teste encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {busca
              ? 'Nenhum teste corresponde à sua pesquisa.'
              : 'Cadastre casos de teste automatizados com asserções para validar suas skills.'}
          </p>
          <Button
            onClick={() => setModalNovoAberto(true)}
            size="sm"
            variant="primary"
            className="mt-4 text-xs font-semibold gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Criar Primeiro Caso de Teste
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {testesFiltrados.map((teste) => {
            const res = teste.latestResult;
            const isExecutandoEste = executandoId === teste.id;
            const isPassed = res?.status === 'PASSED';
            const assertsCount = Array.isArray(teste.assertions) ? teste.assertions.length : 0;

            return (
              <div
                key={teste.id}
                onClick={() => {
                  setTesteInspecionado(teste);
                  setModalDetalhesAberto(true);
                }}
                className="group p-4 rounded-xl border border-slate-800 bg-slate-900/60 transition-all hover:border-slate-700 hover:bg-slate-900/90 cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                {/* Lado Esquerdo: Identidade do Teste */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {res ? (
                      isPassed ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" /> PASSED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/15 text-red-400 text-[10px] font-bold border border-red-500/30">
                          <XCircle className="h-3 w-3" /> FAILED
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">
                        NÃO EXECUTADO
                      </span>
                    )}

                    <h3 className="text-sm font-semibold text-white truncate">{teste.name}</h3>

                    <span className="text-slate-600">·</span>

                    <span className="text-xs text-indigo-400 font-medium">
                      {teste.skillTitle || 'Skill'}
                    </span>
                  </div>

                  {teste.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {teste.description}
                    </p>
                  )}

                  {/* Asserções configuradas */}
                  {Array.isArray(teste.assertions) && teste.assertions.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-slate-500 font-medium">Asserções:</span>
                      {teste.assertions.slice(0, 3).map((a, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300"
                        >
                          {a.operator}: {String(a.expected).substring(0, 20)}
                        </span>
                      ))}
                      {teste.assertions.length > 3 && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          +{teste.assertions.length - 3} mais
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Lado Direito: Métricas e Ações */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                  {res && (
                    <div className="text-right font-mono text-xs text-slate-400 hidden sm:block">
                      <div className="text-white font-bold">{res.score}% score</div>
                      <div className="text-[11px] text-slate-500">
                        {res.latencyMs}ms · {res.tokensUsed} tokens
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleExecutarTeste(teste.id)}
                      disabled={isExecutandoEste}
                      className="h-8 text-xs font-semibold gap-1"
                    >
                      <Play className={`h-3 w-3 ${isExecutandoEste ? 'animate-spin' : ''}`} />
                      {isExecutandoEste ? 'Rodando...' : 'Executar'}
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setTesteInspecionado(teste);
                        setModalDetalhesAberto(true);
                      }}
                      className="h-8 text-xs text-slate-300 hover:text-white"
                      title="Ver detalhes da asserção"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleExcluirTeste(teste.id, e)}
                      className="h-8 text-xs text-slate-500 hover:text-red-400"
                      title="Excluir caso de teste"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modais Integrados */}
      <NovoTesteModal
        aberto={modalNovoAberto}
        onFechar={() => setModalNovoAberto(false)}
        skills={skills}
        skillIdPadrao={skillFiltro !== 'todas' ? skillFiltro : undefined}
        onCriarTeste={handleCriarTeste}
      />

      <DetalhesResultadoModal
        aberto={modalDetalhesAberto}
        onFechar={() => setModalDetalhesAberto(false)}
        teste={testeInspecionado}
        onExecutarNovamente={handleExecutarTeste}
        executando={executandoId === testeInspecionado?.id}
      />
    </div>
  );
};
