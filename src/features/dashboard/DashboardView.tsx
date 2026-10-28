import React, { useEffect, useState, useCallback } from 'react';
import { RoutePath, Skill } from '../../types/index.ts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { EmptyState } from '../../components/ui/empty-state.tsx';
import { Skeleton } from '../../components/ui/loading-spinner.tsx';
import { useAuth } from '../../lib/autenticacao/index.ts';
import {
  Plus,
  BookOpen,
  FlaskConical,
  Award,
  GitBranch,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Database,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

export interface DashboardViewProps {
  onNavegar: (caminho: RoutePath, paramSkillId?: string) => void;
}

interface DashboardData {
  metrics: {
    skillsCriadas: number;
    testesExecutados: number;
    pontuacaoMedia: string;
    versaoAtual: string;
    totalVersoes: number;
    totalAuditorias: number;
  };
  recentSkills: Skill[];
  categoryDistribution: Record<string, number>;
  databaseHealth: {
    connected: boolean;
    engine: string;
    region: string;
    tablesCount: number;
  };
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavegar }) => {
  const { usuario, firebaseUser, obterTokenAuth } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [recarregando, setRecarregando] = useState(false);
  const [dados, setDados] = useState<DashboardData>({
    metrics: {
      skillsCriadas: 0,
      testesExecutados: 0,
      pontuacaoMedia: '—',
      versaoAtual: '—',
      totalVersoes: 0,
      totalAuditorias: 0,
    },
    recentSkills: [],
    categoryDistribution: {},
    databaseHealth: {
      connected: true,
      engine: 'PostgreSQL 16 (Google Cloud SQL)',
      region: 'us-west2',
      tablesCount: 10,
    },
  });

  const carregarDados = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      const token = await obterTokenAuth();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/dashboard', { headers });
      if (res.ok) {
        const json = await res.json();
        setDados(json);
      }
    } catch (err) {
      console.error('Falha ao carregar dashboard real:', err);
    } finally {
      setCarregando(false);
      setRecarregando(false);
    }
  }, [obterTokenAuth]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleRecarregar = () => {
    setRecarregando(true);
    carregarDados();
  };

  const formatarData = (isoString?: string) => {
    if (!isoString) return 'Hoje';
    const data = new Date(isoString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const metricas = dados.metrics;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Top Banner & Primary CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
              Painel Geral
            </h1>
            <span className="rounded bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
              Fase 2 Real
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Monitoramento de Skills, infraestrutura Cloud SQL e orquestração de modelos de IA.
          </p>
        </div>

        {/* Primary CTA and Refresh */}
        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleRecarregar}
            disabled={recarregando}
            size="sm"
            variant="secondary"
            className="h-10 px-3 text-slate-300 hover:text-white"
            aria-label="Atualizar dados do painel"
          >
            <RefreshCw className={`h-4 w-4 ${recarregando ? 'animate-spin text-indigo-400' : ''}`} />
          </Button>

          <Button
            onClick={() => onNavegar('/skills/nova')}
            size="lg"
            variant="primary"
            className="font-bold tracking-wide uppercase shadow-lg shadow-indigo-600/25 gap-2 px-6 h-10"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            + Criar Nova Skill
          </Button>
        </div>
      </div>

      {/* 4 Required Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Skills criadas */}
        <Card className="hover:border-slate-700/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-medium text-slate-400">Skills criadas</span>
            <BookOpen className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {carregando ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold font-mono tabular-nums text-white">
                {metricas.skillsCriadas}
              </div>
            )}
            <p className="mt-1 text-[11px] text-slate-400">
              Registradas no PostgreSQL
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Testes executados */}
        <Card className="hover:border-slate-700/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-medium text-slate-400">Testes executados</span>
            <FlaskConical className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {carregando ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold font-mono tabular-nums text-white">
                {metricas.testesExecutados}
              </div>
            )}
            <p className="mt-1 text-[11px] text-slate-400">
              No laboratório automatizado
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Pontuação média */}
        <Card className="hover:border-slate-700/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-medium text-slate-400">Pontuação média</span>
            <Award className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {carregando ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold font-mono tabular-nums text-slate-300">
                {metricas.pontuacaoMedia}
              </div>
            )}
            <p className="mt-1 text-[11px] text-slate-400">
              Conformidade das auditorias
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Versão atual */}
        <Card className="hover:border-slate-700/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-xs font-medium text-slate-400">Versão atual</span>
            <GitBranch className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {carregando ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold font-mono tabular-nums text-slate-300">
                {metricas.versaoAtual}
              </div>
            )}
            <p className="mt-1 text-[11px] text-slate-400">
              SemVer mais recente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure & Pipeline Health Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Cloud SQL Info */}
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3.5 py-2.5 text-xs">
          <div className="flex items-center gap-2.5">
            <Database className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <span className="block font-medium text-slate-200">PostgreSQL Relacional</span>
              <span className="block text-[10px] text-slate-400 font-mono">
                {dados.databaseHealth.region} · 10 tabelas
              </span>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Conectado
          </span>
        </div>

        {/* Firebase Auth Info */}
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3.5 py-2.5 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0" />
            <div>
              <span className="block font-medium text-slate-200">Autenticação Federada</span>
              <span className="block text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                {firebaseUser?.email || usuario?.email || 'Sessão Arquiteto'}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-indigo-300">Ativa</span>
        </div>

        {/* AI Provider Info */}
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3.5 py-2.5 text-xs">
          <div className="flex items-center gap-2.5">
            <Cpu className="h-4 w-4 text-sky-400 shrink-0" />
            <div>
              <span className="block font-medium text-slate-200">Motor de IA Padrão</span>
              <span className="block text-[10px] text-slate-400 font-mono">
                Gemini 2.5 Flash + Claude + OpenAI
              </span>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-sky-400">Multi-IA</span>
        </div>
      </div>

      {/* Atividade Recente Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-100">
              Atividade recente
            </h2>
            {metricas.skillsCriadas > 0 && (
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                ({metricas.skillsCriadas} total)
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">Workspace: Skill Forge Studio</span>
        </div>

        {/* Dynamic Display: Empty State OR Live Skills from PostgreSQL */}
        {carregando ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : dados.recentSkills.length === 0 ? (
          /* Required Empty State */
          <EmptyState
            icon={<Sparkles className="h-8 w-8 text-indigo-400/60" />}
            title="Você ainda não criou nenhuma Skill."
            description="Inicie a criação de uma nova habilidade ou explore os modelos arquitetados para Claude, OpenAI e Gemini."
            actionLabel="Criar minha primeira Skill"
            onAction={() => onNavegar('/skills/nova')}
          />
        ) : (
          /* Real Skills List from PostgreSQL */
          <div className="divide-y divide-slate-800/60 rounded-xl border border-slate-800 bg-slate-900/50">
            {dados.recentSkills.map((skill) => (
              <div
                key={skill.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3 transition-colors hover:bg-slate-850 hover:bg-slate-900/90"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">{skill.title}</h4>
                    <span className="font-mono text-xs text-indigo-300">
                      v{skill.currentVersion}
                    </span>
                    <Badge variant={skill.status === 'PUBLISHED' ? 'success' : 'secondary'}>
                      {skill.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1 max-w-xl">
                    {skill.description}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span>{skill.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatarData(skill.updatedAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    onClick={() => onNavegar('/laboratorio')}
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-slate-400 hover:text-white"
                  >
                    Testar
                  </Button>
                  <Button
                    onClick={() => onNavegar('/skills/editor', skill.id)}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1 text-indigo-300"
                  >
                    Abrir no Editor
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 pt-2">
        <button
          onClick={() => onNavegar('/modelos')}
          className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-5 text-left transition-all hover:border-slate-700 hover:bg-slate-900/90 cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-indigo-400 mb-2">
              <span>Biblioteca</span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Modelos de Início Rápido</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Explore templates padronizados para Claude Code, OpenAI Assistant e extensões Gemini.
            </p>
          </div>
          <span className="mt-4 text-[11px] font-medium text-slate-400 group-hover:text-slate-200">
            Ver 5 modelos no banco &rarr;
          </span>
        </button>

        <button
          onClick={() => onNavegar('/auditor')}
          className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-5 text-left transition-all hover:border-slate-700 hover:bg-slate-900/90 cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-emerald-400 mb-2">
              <span>Segurança</span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Auditor & Verificação</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Regras para detecção de injeção de prompt, validação de schema e conformidade de segurança.
            </p>
          </div>
          <span className="mt-4 text-[11px] font-medium text-slate-400 group-hover:text-slate-200">
            Verificar regras &rarr;
          </span>
        </button>

        <button
          onClick={() => onNavegar('/configuracoes')}
          className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-5 text-left transition-all hover:border-slate-700 hover:bg-slate-900/90 cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-sky-400 mb-2">
              <span>Infraestrutura</span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Cloud SQL & Multi-IA</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Conexão com PostgreSQL, tokens JWT Firebase e motores de IA desacoplados.
            </p>
          </div>
          <span className="mt-4 text-[11px] font-medium text-slate-400 group-hover:text-slate-200">
            Ver configurações &rarr;
          </span>
        </button>
      </div>
    </div>
  );
};
