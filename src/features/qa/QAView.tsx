import React, { useState, useEffect, useCallback } from 'react';
import { RoutePath, QAReport, QACheckItem } from '../../types/index.ts';
import { qaService } from '../../services/qa/qa.service.ts';
import { Button } from '../../components/ui/button.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { useToast } from '../../components/ui/toast.tsx';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCw,
  ShieldCheck,
  Database,
  Cpu,
  Archive,
  GitBranch,
  FlaskConical,
  Activity,
  Download,
  FileCheck2,
  Clock,
  Layers,
  Server,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export interface QAViewProps {
  onNavegar: (caminho: RoutePath, paramSkillId?: string) => void;
}

export const QAView: React.FC<QAViewProps> = ({ onNavegar }) => {
  const { adicionarToast } = useToast();
  const [relatorio, setRelatorio] = useState<QAReport | null>(null);
  const [executando, setExecutando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [filtroSubsystem, setFiltroSubsystem] = useState<string>('todos');

  const carregarRelatorio = useCallback(async () => {
    setCarregando(true);
    try {
      const data = await qaService.obterRelatorioQA();
      setRelatorio(data);
    } catch (e: any) {
      adicionarToast('error', 'Falha ao obter status de QA', e.message);
    } finally {
      setCarregando(false);
    }
  }, [adicionarToast]);

  useEffect(() => {
    carregarRelatorio();
  }, [carregarRelatorio]);

  const executarHomologacao = async () => {
    setExecutando(true);
    try {
      const data = await qaService.executarSuiteQA();
      setRelatorio(data);
      adicionarToast(
        'success',
        'Homologação de QA Concluída!',
        `Score de conformidade: ${data.score}/100. Todos os subsistemas foram validados em ${data.totalLatencyMs}ms.`
      );
    } catch (e: any) {
      adicionarToast('error', 'Falha na execução de QA', e.message);
    } finally {
      setExecutando(false);
    }
  };

  const exportarLaudoJSON = () => {
    if (!relatorio) return;
    const blob = new Blob([JSON.stringify(relatorio, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laudo-qa-skill-forge-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    adicionarToast('success', 'Laudo Exportado', 'Arquivo JSON com evidências de QA baixado.');
  };

  const obterIconeSubsystem = (subsystem: string) => {
    switch (subsystem) {
      case 'database':
        return <Database className="h-4 w-4 text-emerald-400" />;
      case 'ai_engine':
        return <Cpu className="h-4 w-4 text-indigo-400" />;
      case 'security_owasp':
        return <ShieldCheck className="h-4 w-4 text-emerald-400" />;
      case 'zip_packaging':
        return <Archive className="h-4 w-4 text-amber-400" />;
      case 'semver':
        return <GitBranch className="h-4 w-4 text-cyan-400" />;
      case 'assertions':
        return <FlaskConical className="h-4 w-4 text-rose-400" />;
      default:
        return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  const checksFiltrados = relatorio
    ? relatorio.checks.filter(
        (c) => filtroSubsystem === 'todos' || c.subsystem === filtroSubsystem
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileCheck2 className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100 font-sans">
              Central de Homologação & QA
            </h1>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
              Fase 11 Real
            </Badge>
          </div>
          <p className="text-sm text-slate-400">
            Validação holística e testes de integridade ponta a ponta dos 6 subsistemas do ecossistema Skill Forge.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={exportarLaudoJSON}
            disabled={!relatorio || executando}
            className="text-xs h-9 border-slate-700 bg-slate-900 text-slate-300 gap-1.5"
            title="Baixar Laudo Técnico de QA em JSON"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            Exportar Laudo
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={executarHomologacao}
            disabled={executando}
            className="text-xs h-9 font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
          >
            <RotateCw className={`h-3.5 w-3.5 ${executando ? 'animate-spin' : ''}`} />
            {executando ? 'Homologando Sistema...' : 'Executar Bateria QA'}
          </Button>
        </div>
      </div>

      {/* Banner de Homologação Geral */}
      {relatorio && (
        <div
          className={`rounded-xl border p-5 transition-all ${
            relatorio.passed
              ? 'border-emerald-500/30 bg-emerald-950/15'
              : 'border-amber-500/30 bg-amber-950/15'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="mt-1">
                {relatorio.passed ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-amber-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-100">
                    {relatorio.passed
                      ? 'Sistema 100% Homologado para Produção'
                      : 'Homologação Concluída com Alertas'}
                  </h2>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-slate-200">
                    Score: {relatorio.score}/100
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  {relatorio.summary}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Server className="h-3.5 w-3.5 text-slate-500" />
                    {relatorio.environment.database}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Cpu className="h-3.5 w-3.5 text-slate-500" />
                    {relatorio.environment.aiEngine}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    {relatorio.totalLatencyMs}ms latência total
                  </span>
                </div>
              </div>
            </div>

            {/* Badges de Contagem */}
            <div className="flex items-center gap-2 self-start lg:self-center">
              <div className="rounded-lg border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Aprovados</span>
                <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">
                  {relatorio.passedChecks}/{relatorio.totalChecks}
                </span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Alertas</span>
                <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                  {relatorio.warnedChecks}
                </span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Falhas</span>
                <span className="text-base font-bold font-mono text-rose-400 tabular-nums">
                  {relatorio.failedChecks}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cards de Subsistemas Homologados */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="h-4 w-4 text-slate-500" />
            Matriz de Homologação dos Subsistemas
          </h2>

          {/* Filtro por Subsistema */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800/80 overflow-x-auto">
            {[
              { id: 'todos', label: 'Todos (6)' },
              { id: 'database', label: 'Banco' },
              { id: 'ai_engine', label: 'IA' },
              { id: 'security_owasp', label: 'Segurança' },
              { id: 'zip_packaging', label: 'ZIP' },
              { id: 'semver', label: 'SemVer' },
              { id: 'assertions', label: 'Testes' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltroSubsystem(f.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  filtroSubsystem === f.id
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {carregando ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <RotateCw className="h-5 w-5 animate-spin mx-auto mb-2 text-emerald-400" />
            Coletando telemetria e validando subsistemas...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checksFiltrados.map((check) => (
              <div
                key={check.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                        {obterIconeSubsystem(check.subsystem)}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {check.subsystemLabel}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                        check.status === 'PASS'
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                          : check.status === 'WARN'
                          ? 'bg-amber-950/80 text-amber-400 border-amber-800/60'
                          : 'bg-rose-950/80 text-rose-400 border-rose-800/60'
                      }`}
                    >
                      {check.status === 'PASS'
                        ? 'PASS'
                        : check.status === 'WARN'
                        ? 'WARN'
                        : 'FAIL'}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 mb-1.5">{check.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {check.message}
                  </p>

                  {/* Metadados Detalhados */}
                  {check.details && (
                    <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/60 text-[11px] font-mono text-slate-300 space-y-1">
                      {Object.entries(check.details).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-500">{key}:</span>
                          <span className="text-slate-300 truncate max-w-[180px]">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono">Latência: {check.latencyMs}ms</span>
                  <div className="flex items-center gap-1 text-slate-400">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span>Conforme</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ações Rápidas de Navegação para os Módulos do Sistema */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Acesso Direto aos Módulos Homologados
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavegar('/laboratorio')}
            className="text-xs h-9 justify-between border-slate-800 bg-slate-950/60 text-slate-300 hover:text-white"
          >
            <span>Laboratório de Testes</span>
            <FlaskConical className="h-3.5 w-3.5 text-indigo-400" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavegar('/auditor')}
            className="text-xs h-9 justify-between border-slate-800 bg-slate-950/60 text-slate-300 hover:text-white"
          >
            <span>Auditor de Segurança</span>
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavegar('/otimizacao')}
            className="text-xs h-9 justify-between border-slate-800 bg-slate-950/60 text-slate-300 hover:text-white"
          >
            <span>Melhoria Automática</span>
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavegar('/exportacoes')}
            className="text-xs h-9 justify-between border-slate-800 bg-slate-950/60 text-slate-300 hover:text-white"
          >
            <span>Exportador ZIP</span>
            <Archive className="h-3.5 w-3.5 text-cyan-400" />
          </Button>
        </div>
      </div>
    </div>
  );
};
