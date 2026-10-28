import React, { useState, useEffect, useCallback } from 'react';
import { RoutePath, Skill, OtimizacaoDiagnostico, OtimizacaoResultado } from '../../types/index.ts';
import { skillService } from '../../services/skills/skill.service.ts';
import { otimizacaoService } from '../../services/otimizacao/otimizacao.service.ts';
import { Button } from '../../components/ui/button.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { useToast } from '../../components/ui/toast.tsx';
import {
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ArrowRight,
  Copy,
  Check,
  FileCode,
  Layers,
  Wand2,
  Sliders,
  ChevronRight,
  GitBranch,
  Shield,
  HelpCircle,
  FileCheck,
} from 'lucide-react';

export interface MelhoriaAutomaticaViewProps {
  onNavegar: (caminho: RoutePath, paramSkillId?: string) => void;
}

export const MelhoriaAutomaticaView: React.FC<MelhoriaAutomaticaViewProps> = ({ onNavegar }) => {
  const { adicionarToast } = useToast();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillSelecionadaId, setSkillSelecionadaId] = useState<string>('');
  const [carregandoSkills, setCarregandoSkills] = useState(true);

  // Diagnóstico
  const [diagnostico, setDiagnostico] = useState<OtimizacaoDiagnostico | null>(null);
  const [carregandoDiagnostico, setCarregandoDiagnostico] = useState(false);

  // Configurações de Otimização
  const [corrigirTestes, setCorrigirTestes] = useState(true);
  const [reforcarSeguranca, setReforcarSeguranca] = useState(true);
  const [reduzirTokens, setReduzirTokens] = useState(true);
  const [reforcarJsonSchema, setReforcarJsonSchema] = useState(false);
  const [instrucoesAdicionais, setInstrucoesAdicionais] = useState('');

  // Execução & Resultados
  const [otimizando, setOtimizando] = useState(false);
  const [etapaOtimizacao, setEtapaOtimizacao] = useState<string>('');
  const [resultado, setResultado] = useState<OtimizacaoResultado | null>(null);
  const [abaVisualizacao, setAbaVisualizacao] = useState<'otimizado' | 'original' | 'lado-a-lado'>('otimizado');
  const [copiado, setCopiado] = useState(false);

  // Publicação de Versão
  const [publicandoVersao, setPublicandoVersao] = useState(false);

  // Carregar lista de skills
  const carregarSkills = useCallback(async () => {
    setCarregandoSkills(true);
    try {
      const lista = await skillService.listarSkills();
      setSkills(lista);
      if (lista.length > 0 && !skillSelecionadaId) {
        setSkillSelecionadaId(lista[0].id);
      }
    } catch (e: any) {
      adicionarToast('error', 'Falha ao buscar skills', e.message);
    } finally {
      setCarregandoSkills(false);
    }
  }, [skillSelecionadaId, adicionarToast]);

  useEffect(() => {
    carregarSkills();
  }, [carregarSkills]);

  // Carregar diagnóstico ao mudar a skill selecionada
  const carregarDiagnostico = useCallback(async (id: string) => {
    if (!id) return;
    setCarregandoDiagnostico(true);
    try {
      const diag = await otimizacaoService.diagnosticarSkill(id);
      setDiagnostico(diag);
      setResultado(null);
    } catch (e: any) {
      adicionarToast('error', 'Erro no diagnóstico', e.message);
    } finally {
      setCarregandoDiagnostico(false);
    }
  }, [adicionarToast]);

  useEffect(() => {
    if (skillSelecionadaId) {
      carregarDiagnostico(skillSelecionadaId);
    }
  }, [skillSelecionadaId, carregarDiagnostico]);

  // Executar otimização
  const executarMelhoria = async () => {
    if (!skillSelecionadaId) return;

    setOtimizando(true);
    setEtapaOtimizacao('1/4 Analisando falhas de asserção e brechas OWASP...');

    const timer1 = setTimeout(() => {
      setEtapaOtimizacao('2/4 Refatorando System Prompt com técnicas avançadas de IA...');
    }, 900);

    const timer2 = setTimeout(() => {
      setEtapaOtimizacao('3/4 Executando benchmark comparativo de robustez...');
    }, 1800);

    const timer3 = setTimeout(() => {
      setEtapaOtimizacao('4/4 Sintetizando relatório de ganhos e changelog SemVer...');
    }, 2500);

    try {
      const res = await otimizacaoService.executarOtimizacao({
        skillId: skillSelecionadaId,
        corrigirTestes,
        reforcarSeguranca,
        reduzirTokens,
        reforcarJsonSchema,
        instrucoesAdicionais: instrucoesAdicionais.trim() || undefined,
      });

      setResultado(res);
      adicionarToast(
        'success',
        'Prompt Otimizado com Sucesso!',
        `Ganhos obtidos: +${res.deltas.auditScoreDelta} pts de segurança e 100% de conformidade nos testes.`
      );
    } catch (e: any) {
      adicionarToast('error', 'Erro na otimização', e.message);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setOtimizando(false);
      setEtapaOtimizacao('');
    }
  };

  // Copiar prompt otimizado
  const copiarPrompt = () => {
    if (!resultado?.promptOtimizado) return;
    navigator.clipboard.writeText(resultado.promptOtimizado);
    setCopiado(true);
    adicionarToast('success', 'Copiado', 'Prompt otimizado copiado para a área de transferência.');
    setTimeout(() => setCopiado(false), 2000);
  };

  // Aplicar como nova versão SemVer
  const publicarNovaVersao = async () => {
    if (!resultado) return;
    setPublicandoVersao(true);
    try {
      const res = await otimizacaoService.aplicarVersaoOtimizada({
        skillId: resultado.skillId,
        newVersionNumber: resultado.sugestaoVersao,
        changelog: `${resultado.sugestaoChangelog} (Otimização Automática Skill Forge)`,
        systemPrompt: resultado.promptOtimizado,
      });

      adicionarToast('success', 'Nova Versão Publicada!', res.message);
      // Redireciona para o painel de versões
      onNavegar('/versoes', resultado.skillId);
    } catch (e: any) {
      adicionarToast('error', 'Falha ao publicar versão', e.message);
    } finally {
      setPublicandoVersao(false);
    }
  };

  const skillAtual = skills.find((s) => s.id === skillSelecionadaId);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">Melhoria Automática de Skills</h1>
            <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs">
              IA Flash 2.5
            </Badge>
          </div>
          <p className="text-sm text-slate-400">
            Otimização contínua de prompts guiada por falhas de testes, auditoria OWASP e compressão semântica de tokens.
          </p>
        </div>

        {/* Seletor de Skill */}
        <div className="flex items-center gap-3">
          <label htmlFor="skill-selector" className="text-xs font-medium text-slate-400">
            Skill Ativa:
          </label>
          <select
            id="skill-selector"
            value={skillSelecionadaId}
            onChange={(e) => setSkillSelecionadaId(e.target.value)}
            disabled={carregandoSkills || otimizando}
            className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs font-medium text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.currentVersion}) · {s.category}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => carregarDiagnostico(skillSelecionadaId)}
            disabled={carregandoDiagnostico || otimizando}
            title="Recarregar diagnóstico"
          >
            <RotateCw className={`h-3.5 w-3.5 ${carregandoDiagnostico ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Grid Principal: Diagnóstico & Configuração */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Esquerdo: Diagnóstico e Gaps Identificados (7 colunas) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="h-4 w-4 text-slate-500" />
              1. Diagnóstico do Prompt Atual
            </h2>
            {skillAtual && (
              <span className="text-xs text-slate-500 font-mono">
                Versão base: {skillAtual.currentVersion}
              </span>
            )}
          </div>

          {/* Cards de Métricas em Tempo Real */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Aprovação em Testes</span>
                <FlaskConical className="h-3.5 w-3.5 text-indigo-400" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-100 tabular-nums">
                {diagnostico?.currentMetrics ? `${diagnostico.currentMetrics.testPassRate}%` : '—'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {diagnostico?.currentMetrics
                  ? `${diagnostico.currentMetrics.testsPassed} de ${diagnostico.currentMetrics.totalTests} testes aprovados`
                  : 'Carregando...'}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Score OWASP</span>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-100 tabular-nums">
                {diagnostico?.currentMetrics ? `${diagnostico.currentMetrics.auditScore}/100` : '—'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {diagnostico?.currentMetrics && diagnostico.currentMetrics.auditScore >= 75
                  ? 'Conformidade aceitável'
                  : 'Vulnerabilidades detectadas'}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Densidade Tokens</span>
                <Zap className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-100 tabular-nums">
                {diagnostico?.currentMetrics ? `~${diagnostico.currentMetrics.tokensCount}` : '—'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Latência média: ~{diagnostico?.currentMetrics?.latencyMs || 340}ms
              </div>
            </div>
          </div>

          {/* Lista de Gaps Detectados */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                Gaps e Pontos de Falha Detectados ({diagnostico?.gapsIdentificados?.length || 0})
              </span>
            </div>

            {carregandoDiagnostico ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <RotateCw className="h-4 w-4 animate-spin mx-auto mb-2 text-indigo-400" />
                Inspecionando asserções e regras de segurança...
              </div>
            ) : diagnostico?.gapsIdentificados && diagnostico.gapsIdentificados.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {diagnostico.gapsIdentificados.map((gap, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-lg border border-slate-800/90 bg-slate-950/60 p-2.5 text-xs"
                  >
                    <div className="mt-0.5">
                      {gap.severidade === 'critical' || gap.severidade === 'high' ? (
                        <div className="h-2 w-2 rounded-full bg-rose-500" />
                      ) : gap.severidade === 'medium' ? (
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-indigo-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-200 truncate">{gap.titulo}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {gap.severidade}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{gap.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                Nenhum gap crítico identificado no momento. A otimização refinará a densidade e blindagem.
              </div>
            )}
          </div>
        </div>

        {/* Painel Direito: Configuração da Otimização (5 colunas) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-slate-500" />
            2. Foco da Otimização
          </h2>

          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-3">
            {/* Opções de Otimização */}
            <div className="space-y-2.5">
              <label
                className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                  corrigirTestes ? 'border-indigo-500/40 bg-indigo-950/20' : 'border-slate-800/80 bg-slate-950/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={corrigirTestes}
                  onChange={(e) => setCorrigirTestes(e.target.checked)}
                  className="mt-1 rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Alinhamento com Casos de Teste</div>
                  <div className="text-[11px] text-slate-400">
                    Ajusta o prompt para passar em 100% das asserções cadastradas no Laboratório.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                  reforcarSeguranca ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-slate-800/80 bg-slate-950/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={reforcarSeguranca}
                  onChange={(e) => setReforcarSeguranca(e.target.checked)}
                  className="mt-1 rounded border-slate-700 text-emerald-600 focus:ring-0"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Blindagem de Segurança OWASP</div>
                  <div className="text-[11px] text-slate-400">
                    Insere delimitadores herméticos contra Prompt Injection (LLM01) e segredos (LLM02).
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                  reduzirTokens ? 'border-amber-500/40 bg-amber-950/20' : 'border-slate-800/80 bg-slate-950/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={reduzirTokens}
                  onChange={(e) => setReduzirTokens(e.target.checked)}
                  className="mt-1 rounded border-slate-700 text-amber-600 focus:ring-0"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Compressão Semântica & Tokens</div>
                  <div className="text-[11px] text-slate-400">
                    Remove preâmbulos prolixos, economizando tokens e reduzindo a latência da resposta.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                  reforcarJsonSchema ? 'border-cyan-500/40 bg-cyan-950/20' : 'border-slate-800/80 bg-slate-950/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={reforcarJsonSchema}
                  onChange={(e) => setReforcarJsonSchema(e.target.checked)}
                  className="mt-1 rounded border-slate-700 text-cyan-600 focus:ring-0"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Formatação Estruturada Rígida</div>
                  <div className="text-[11px] text-slate-400">
                    Exige output estrito (JSON/Markdown estruturado) sem conversação periférica.
                  </div>
                </div>
              </label>
            </div>

            {/* Instrução Livre */}
            <div className="pt-2">
              <label htmlFor="custom-instructions" className="text-xs font-medium text-slate-400 block mb-1">
                Diretiva personalizada (opcional):
              </label>
              <input
                id="custom-instructions"
                type="text"
                placeholder="Ex: Forçar tom técnico neutro; manter exemplos concisos..."
                value={instrucoesAdicionais}
                onChange={(e) => setInstrucoesAdicionais(e.target.value)}
                className="w-full h-8 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Botão de Ação */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 gap-2 h-10"
                onClick={executarMelhoria}
                disabled={otimizando || !skillSelecionadaId}
              >
                {otimizando ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" />
                    <span>Otimizando Prompt com IA...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span>Executar Otimização Automatizada</span>
                  </>
                )}
              </Button>

              {otimizando && (
                <div className="text-[11px] text-indigo-400 text-center mt-2 animate-pulse font-mono">
                  {etapaOtimizacao}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Relatório de Ganhos Comparativo (Após Execução) */}
      {resultado && (
        <div className="space-y-6 pt-4 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-bold text-slate-100">Resultado da Otimização Semântica</h2>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
                  Sucesso
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparativo de desempenho entre a versão base ({resultado.baseVersion}) e o prompt otimizado.
              </p>
            </div>

            {/* Ações de Aplicação Rápida */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copiarPrompt}
                className="text-xs gap-1.5 h-8 border-slate-700 bg-slate-900"
              >
                {copiado ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copiado ? 'Copiado!' : 'Copiar Prompt'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavegar('/skills/editor', resultado.skillId)}
                className="text-xs gap-1.5 h-8 border-slate-700 bg-slate-900"
              >
                <FileCode className="h-3.5 w-3.5 text-indigo-400" />
                Abrir no Editor
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={publicarNovaVersao}
                disabled={publicandoVersao}
                className="text-xs gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-600/30"
              >
                <GitBranch className="h-3.5 w-3.5" />
                {publicandoVersao ? 'Publicando...' : `Lançar Versão ${resultado.sugestaoVersao}`}
              </Button>
            </div>
          </div>

          {/* Cards de Ganhos / Deltas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Ganho nos Testes */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4">
              <div className="text-xs text-indigo-300 font-medium mb-1">Assertividade nos Testes</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
                  {resultado.metricsAfter.testPassRate}%
                </span>
                <span className="text-xs font-mono text-slate-400 line-through">
                  {resultado.metricsBefore.testPassRate}%
                </span>
                <span className="text-xs font-bold font-mono text-emerald-400">
                  +{resultado.deltas.testRateDelta}%
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {resultado.metricsAfter.testsPassed} de {resultado.metricsAfter.totalTests} asserções satisfeitas.
              </div>
            </div>

            {/* Ganho em Segurança */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
              <div className="text-xs text-emerald-300 font-medium mb-1">Score de Segurança OWASP</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
                  {resultado.metricsAfter.auditScore}
                </span>
                <span className="text-xs font-mono text-slate-400 line-through">
                  {resultado.metricsBefore.auditScore}
                </span>
                <span className="text-xs font-bold font-mono text-emerald-400">
                  +{resultado.deltas.auditScoreDelta} pts
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Conformidade total contra injeção de prompt e vazamento de segredos.
              </div>
            </div>

            {/* Ganho em Eficiência */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
              <div className="text-xs text-amber-300 font-medium mb-1">Estimativa de Tokens</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
                  {resultado.metricsAfter.tokensEst}
                </span>
                <span className="text-xs font-mono text-slate-400 line-through">
                  {resultado.metricsBefore.tokensEst}
                </span>
                <span
                  className={`text-xs font-bold font-mono ${
                    resultado.deltas.tokenDeltaPercent <= 0 ? 'text-emerald-400' : 'text-slate-300'
                  }`}
                >
                  {resultado.deltas.tokenDeltaPercent > 0 ? `+${resultado.deltas.tokenDeltaPercent}%` : `${resultado.deltas.tokenDeltaPercent}%`}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Redução de ambiguidade com maior densidade de regras operacionais.
              </div>
            </div>
          </div>

          {/* Técnicas de Engenharia Aplicadas & Justificativa */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Técnicas de Engenharia de Prompt Aplicadas ({resultado.tecnicasAplicadas.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {resultado.tecnicasAplicadas.map((tec, i) => (
                <div key={i} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">{tec.nome}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                      {tec.categoria}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{tec.detalhe}</p>
                </div>
              ))}
            </div>

            {resultado.justificativa && (
              <div className="pt-2 border-t border-slate-800/60">
                <div className="text-[11px] text-slate-400">
                  <strong className="text-slate-300">Justificativa Técnica:</strong> {resultado.justificativa}
                </div>
              </div>
            )}
          </div>

          {/* Comparador de Prompt (Tabs) */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 bg-slate-900/60">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAbaVisualizacao('otimizado')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    abaVisualizacao === 'otimizado'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Prompt Otimizado (Recomendado)
                </button>
                <button
                  onClick={() => setAbaVisualizacao('original')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    abaVisualizacao === 'original'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Prompt Original ({resultado.baseVersion})
                </button>
                <button
                  onClick={() => setAbaVisualizacao('lado-a-lado')}
                  className={`hidden sm:inline-block px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    abaVisualizacao === 'lado-a-lado'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Comparativo Lado a Lado
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-mono">
                {abaVisualizacao === 'otimizado'
                  ? `~${resultado.metricsAfter.tokensEst} tokens`
                  : `~${resultado.metricsBefore.tokensEst} tokens`}
              </span>
            </div>

            <div className="p-4">
              {abaVisualizacao === 'otimizado' && (
                <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto bg-slate-900/50 p-4 rounded-lg border border-slate-800/80">
                  {resultado.promptOtimizado}
                </pre>
              )}

              {abaVisualizacao === 'original' && (
                <pre className="font-mono text-xs text-slate-400 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto bg-slate-900/50 p-4 rounded-lg border border-slate-800/80">
                  {resultado.promptOriginal}
                </pre>
              )}

              {abaVisualizacao === 'lado-a-lado' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>Original ({resultado.baseVersion})</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {resultado.metricsBefore.tokensEst} tokens
                      </span>
                    </div>
                    <pre className="font-mono text-xs text-slate-400 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                      {resultado.promptOriginal}
                    </pre>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-emerald-400 mb-1.5 flex items-center justify-between">
                      <span>Otimizado (Sugerido v{resultado.sugestaoVersao})</span>
                      <span className="font-mono text-[11px] text-emerald-500">
                        {resultado.metricsAfter.tokensEst} tokens
                      </span>
                    </div>
                    <pre className="font-mono text-xs text-emerald-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto bg-emerald-950/10 p-3 rounded-lg border border-emerald-900/40">
                      {resultado.promptOtimizado}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
