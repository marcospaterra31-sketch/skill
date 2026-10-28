import React, { useEffect, useState, useCallback } from 'react';
import { RoutePath, Skill, SkillAuditDetalhada } from '../../types/index.ts';
import { auditoriaService, RegraAuditoria } from '../../services/auditoria/auditoria.service.ts';
import { skillService } from '../../services/skills/skill.service.ts';
import { Button } from '../../components/ui/button.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { useToast } from '../../components/ui/toast.tsx';
import { AutoFixModal } from './AutoFixModal.tsx';
import {
  ShieldCheck,
  ShieldAlert,
  SearchCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCw,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  Layers,
  Lock,
  FileCheck,
  AlertOctagon,
  ChevronRight,
  Wand2,
} from 'lucide-react';

export interface AuditorViewProps {
  onNavegar: (caminho: RoutePath, paramSkillId?: string) => void;
}

export const AuditorView: React.FC<AuditorViewProps> = ({ onNavegar }) => {
  const { adicionarToast } = useToast();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillSelecionadaId, setSkillSelecionadaId] = useState<string>('');
  const [regras, setRegras] = useState<RegraAuditoria[]>([]);
  const [auditorias, setAuditorias] = useState<SkillAuditDetalhada[]>([]);
  const [auditoriaAtiva, setAuditoriaAtiva] = useState<SkillAuditDetalhada | null>(null);

  const [auditando, setAuditando] = useState(false);
  const [auditandoTodas, setAuditandoTodas] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Auto-Fix Modal
  const [modalAutoFixAberto, setModalAutoFixAberto] = useState(false);
  const [gerandoAutoFix, setGerandoAutoFix] = useState(false);
  const [promptCorrigido, setPromptCorrigido] = useState('');

  // Carrega regras, skills e histórico de auditorias
  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [regrasLista, skillsLista, auditoriasLista] = await Promise.all([
        auditoriaService.obterRegrasAuditoria(),
        skillService.listarSkills(),
        auditoriaService.listarAuditorias(),
      ]);

      setRegras(regrasLista);
      setSkills(skillsLista);
      setAuditorias(auditoriasLista);

      if (skillsLista.length > 0 && !skillSelecionadaId) {
        setSkillSelecionadaId(skillsLista[0].id);
      }

      if (auditoriasLista.length > 0 && !auditoriaAtiva) {
        setAuditoriaAtiva(auditoriasLista[0]);
      }
    } catch (e: any) {
      adicionarToast('error', 'Erro ao carregar auditorias', e.message);
    } finally {
      setCarregando(false);
    }
  }, [skillSelecionadaId, auditoriaAtiva, adicionarToast]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Executar auditoria para a skill selecionada
  const handleAuditarSkill = async () => {
    if (!skillSelecionadaId) return;
    setAuditando(true);
    try {
      const resultado = await auditoriaService.executarAuditoria(skillSelecionadaId);
      setAuditoriaAtiva(resultado);
      adicionarToast(
        resultado.passed ? 'success' : 'error',
        resultado.passed ? 'Auditoria Aprovada!' : 'Atenção Necessária',
        `Score alcançado: ${resultado.score}/100 · ${resultado.findings?.length || 0} apontamentos.`
      );
      await carregarDados();
    } catch (e: any) {
      adicionarToast('error', 'Erro na auditoria', e.message);
    } finally {
      setAuditando(false);
    }
  };

  // Auditar todas as skills em lote
  const handleAuditarTodas = async () => {
    if (skills.length === 0) return;
    setAuditandoTodas(true);
    try {
      const res = await auditoriaService.executarTodasAuditorias();
      adicionarToast(
        'success',
        'Auditoria Completa Concluída!',
        `${res.executados} skills auditadas e persistidas no Cloud SQL.`
      );
      await carregarDados();
    } catch (e: any) {
      adicionarToast('error', 'Erro ao auditar em lote', e.message);
    } finally {
      setAuditandoTodas(false);
    }
  };

  // Disparar Auto-Fix com IA
  const handleDispararAutoFix = async () => {
    if (!auditoriaAtiva) return;
    setGerandoAutoFix(true);
    try {
      // Busca detalhes da skill para pegar o prompt atual
      const skillDetalhes = await skillService.obterSkillDetalhes(auditoriaAtiva.skillId);
      const promptAtual =
        skillDetalhes?.versions?.[0]?.systemPrompt ||
        `Você é ${auditoriaAtiva.skillTitle}. Atue como especialista.`;

      const corrigido = await auditoriaService.autoCorrigirComIA(
        promptAtual,
        (auditoriaAtiva.recommendations as string[]) || []
      );

      setPromptCorrigido(corrigido);
      setModalAutoFixAberto(true);
    } catch (e: any) {
      adicionarToast('error', 'Erro no Auto-Fix', e.message);
    } finally {
      setGerandoAutoFix(false);
    }
  };

  // KPIs
  const totalAuditorias = auditorias.length;
  const scoreMedio =
    totalAuditorias > 0
      ? `${Math.round(auditorias.reduce((acc, a) => acc + (a.score || 0), 0) / totalAuditorias)}%`
      : '—';

  const totalCriticas = auditorias.reduce((acc, a) => {
    const findings = Array.isArray(a.findings) ? a.findings : [];
    return acc + findings.filter((f) => f.severity === 'critical' || f.severity === 'high').length;
  }, 0);

  const aprovadas = auditorias.filter((a) => a.passed).length;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              Auditor de Segurança & Conformidade OWASP
            </h1>
            <span className="rounded bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
              Fase 8 Real
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Varredura estática e semântica com matriz OWASP Top 10 for LLMs, detecção de injeção de prompt e vazamento de segredos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={carregarDados}
            size="sm"
            variant="secondary"
            className="text-xs h-8 text-slate-300 hover:text-white"
            title="Atualizar dados do banco"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>

          <Button
            onClick={handleAuditarTodas}
            disabled={auditandoTodas || skills.length === 0}
            size="sm"
            variant="outline"
            className="text-xs font-semibold gap-1.5 text-slate-200 border-slate-700 hover:text-white"
          >
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            {auditandoTodas ? 'Auditando Workspace...' : 'Auditar Todo o Workspace'}
          </Button>

          <Button
            onClick={handleAuditarSkill}
            disabled={auditando || !skillSelecionadaId}
            size="sm"
            variant="primary"
            className="text-xs font-semibold gap-1.5"
          >
            <SearchCheck className={`h-3.5 w-3.5 ${auditando ? 'animate-spin' : ''}`} />
            {auditando ? 'Auditando...' : 'Auditar Skill'}
          </Button>
        </div>
      </div>

      {/* KPI Cards de Conformidade */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Score Médio</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono tabular-nums">
            {scoreMedio}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Pontuação de segurança consolidada</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Auditorias Executadas</span>
            <FileCheck className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono tabular-nums">
            {totalAuditorias}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {aprovadas} em conformidade · {totalAuditorias - aprovadas} alertas
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Vulnerabilidades Críticas</span>
            <AlertOctagon className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-400 font-mono tabular-nums">
            {totalCriticas}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Apontamentos com severidade alta/crítica</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Matriz de Regras Ativas</span>
            <Lock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono tabular-nums">
            {regras.length} regras
          </div>
          <p className="mt-1 text-[11px] text-slate-400">OWASP Top 10 for LLMs + Invariantes</p>
        </div>
      </div>

      {/* Barra de Seleção de Skill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Selecione a Skill para Auditar:</span>
          <select
            value={skillSelecionadaId}
            onChange={(e) => setSkillSelecionadaId(e.target.value)}
            className="h-8 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
          >
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} (v{s.currentVersion})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Última varredura:</span>
          <span className="font-mono text-white">
            {auditoriaAtiva ? new Date(auditoriaAtiva.createdAt).toLocaleTimeString('pt-BR') : 'Pendente'}
          </span>
        </div>
      </div>

      {/* Relatório Detalhado da Auditoria Recente */}
      {auditoriaAtiva ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center border font-mono text-lg font-bold ${
                  auditoriaAtiva.passed
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                    : 'bg-red-950/40 border-red-800 text-red-400'
                }`}
              >
                {auditoriaAtiva.score}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    {auditoriaAtiva.skillTitle || 'Relatório de Auditoria'}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      auditoriaAtiva.passed
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/15 text-red-400 border-red-500/30'
                    }`}
                  >
                    {auditoriaAtiva.passed ? 'CONFORME' : 'ATENÇÃO NECESSÁRIA'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Versão avaliada: <span className="font-mono text-indigo-400">v{auditoriaAtiva.versionNumber || '1.0.0'}</span> · Tipo: {auditoriaAtiva.auditorType}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => onNavegar('/otimizacao', auditoriaAtiva.skillId)}
                size="sm"
                variant="outline"
                className="text-xs font-semibold gap-1.5 text-amber-300 border-amber-800/60 hover:bg-amber-950/30"
              >
                <Wand2 className="h-3.5 w-3.5 text-amber-400" />
                Melhoria Automática
              </Button>

              <Button
                onClick={handleDispararAutoFix}
                disabled={gerandoAutoFix}
                size="sm"
                variant="outline"
                className="text-xs font-semibold gap-1.5 text-indigo-300 border-indigo-800/60 hover:bg-indigo-950/30"
              >
                <Sparkles className={`h-3.5 w-3.5 ${gerandoAutoFix ? 'animate-spin text-indigo-400' : ''}`} />
                {gerandoAutoFix ? 'Gerando Correções...' : 'Auto-Corrigir com IA'}
              </Button>

              <Button
                onClick={() => onNavegar('/skills/editor', auditoriaAtiva.skillId)}
                size="sm"
                variant="primary"
                className="text-xs font-semibold gap-1.5"
              >
                Abrir no Editor
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Resumo Executivo */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/70 text-xs text-slate-300 leading-relaxed font-sans">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Diagnóstico do Sistema
            </span>
            {auditoriaAtiva.summary}
          </div>

          {/* Lista de Apontamentos (Findings) */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-2">
              Apontamentos Identificados ({auditoriaAtiva.findings?.length || 0})
            </h3>

            {auditoriaAtiva.findings && auditoriaAtiva.findings.length > 0 ? (
              <div className="space-y-2">
                {auditoriaAtiva.findings.map((f, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono tracking-wider shrink-0 border ${
                          f.severity === 'critical'
                            ? 'bg-red-950 text-red-400 border-red-800'
                            : f.severity === 'high'
                            ? 'bg-orange-950 text-orange-400 border-orange-800'
                            : f.severity === 'medium'
                            ? 'bg-amber-950 text-amber-400 border-amber-800'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        {f.severity}
                      </span>
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          {f.category}
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          {f.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-900/60 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Nenhuma vulnerabilidade crítica ou média encontrada. O prompt atende às diretrizes de conformidade.
              </div>
            )}
          </div>

          {/* Recomendações de Remediação */}
          {auditoriaAtiva.recommendations && auditoriaAtiva.recommendations.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                Recomendações de Remediação
              </h3>
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5 font-sans">
                {auditoriaAtiva.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Matriz de Regras de Auditoria OWASP Top 10 for LLMs */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Matriz de Regras Ativas de Conformidade (OWASP Top 10 for LLMs)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Políticas de análise estática e verificação estrutural executadas a cada auditoria.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400">100% Operacional</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {regras.map((regra) => (
            <div
              key={regra.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-indigo-300 font-semibold">
                    {regra.codigo}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 font-mono">
                    <CheckCircle2 className="h-3 w-3" /> ATIVA
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white">{regra.nome}</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {regra.descricao}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Categoria: {regra.categoria}</span>
                <span className="uppercase text-slate-400">Sev: {regra.severidadePadrao}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Auto-Fix */}
      {auditoriaAtiva && (
        <AutoFixModal
          aberto={modalAutoFixAberto}
          onFechar={() => setModalAutoFixAberto(false)}
          skillId={auditoriaAtiva.skillId}
          skillTitle={auditoriaAtiva.skillTitle || 'Skill'}
          promptOriginal=""
          promptSugerido={promptCorrigido}
          recommendations={(auditoriaAtiva.recommendations as string[]) || []}
          onAplicarNoEditor={(id, prompt) => {
            onNavegar('/skills/editor', id);
          }}
        />
      )}
    </div>
  );
};
