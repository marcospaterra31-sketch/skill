import React from 'react';
import { RoutePath } from '../../types/index.ts';
import { Button } from '../../components/ui/button.tsx';
import { Flame, ArrowRight, Shield, Cpu, Layers, Sparkles, Terminal, CheckCircle2, ChevronRight } from 'lucide-react';

export interface LandingViewProps {
  onNavegar: (caminho: RoutePath) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavegar }) => {
  const recursos = [
    {
      icone: <Cpu className="h-5 w-5 text-indigo-400" />,
      titulo: 'Arquitetura Multi-Provedor',
      descricao: 'Desacoplamento de ponta para Claude, OpenAI e Gemini. Alterne modelos sem quebrar contratos de execução.',
    },
    {
      icone: <Shield className="h-5 w-5 text-emerald-400" />,
      titulo: 'Auditoria de Segurança',
      descricao: 'Varreduras proativas contra injeções de prompt, alucinações de parâmetros e vazamentos em conformidade com OWASP.',
    },
    {
      icone: <Terminal className="h-5 w-5 text-sky-400" />,
      titulo: 'Laboratório de Testes Automatizado',
      descricao: 'Benchmarking de latência, medição de consumo de tokens e asserções estritas em cada nova versão.',
    },
    {
      icone: <Layers className="h-5 w-5 text-violet-400" />,
      titulo: 'Exportação Multi-Plataforma',
      descricao: 'Empacotamento com um clique para formato Claude Skill, OpenAI Assistant, extensões Gemini ou ZIP universal.',
    },
  ];

  const fasesDoProduto = [
    { num: '00', nome: 'Fundação Técnica', status: 'Concluída' },
    { num: '01', nome: 'Autenticação & RBAC', status: 'Próxima' },
    { num: '02', nome: 'Dashboard Avançado', status: 'Planejada' },
    { num: '03', nome: 'Criador de Skills', status: 'Planejada' },
    { num: '04', nome: 'Gerador com IA', status: 'Planejada' },
    { num: '05', nome: 'Editor de Prompts', status: 'Planejada' },
    { num: '06', nome: 'Versionamento SemVer', status: 'Planejada' },
    { num: '07', nome: 'Laboratório de Testes', status: 'Planejada' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      {/* Top Navigation Bar adhering to Top Bar Contract */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-8 border-b border-slate-800/80 bg-slate-950/90 px-6 py-4 backdrop-blur-md">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <Flame className="h-4 w-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-white font-sans uppercase">
            Skill Forge
          </span>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
          <a href="#arquitetura" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Arquitetura
          </a>
          <a href="#recursos" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Recursos
          </a>
          <a href="#fases" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Fases do Projeto
          </a>
          <button
            onClick={() => onNavegar('/modelos')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Biblioteca de Modelos
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => onNavegar('/dashboard')}
            size="sm"
            variant="primary"
            className="font-semibold text-xs whitespace-nowrap shrink-0"
          >
            Acessar Painel
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20 md:pt-24 md:pb-28 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/30 px-3 py-1 text-xs text-indigo-300 mb-8 backdrop-blur-xs">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Fase 0 Concluída — Fundação Técnica Estabelecida</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white font-sans leading-[1.1] text-balance">
          A Forja Profissional de <span className="text-indigo-400">Skills para IA</span>
        </h1>

        <p className="mt-6 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Plataforma de alta precisão para arquitetar, testar, auditar, versionar e exportar habilidades completas para agentes inteligentes.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => onNavegar('/dashboard')}
            size="lg"
            variant="primary"
            className="w-full sm:w-auto font-bold uppercase tracking-wider text-xs px-8 shadow-xl shadow-indigo-600/25 gap-2"
          >
            Abrir Painel do Arquiteto
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => onNavegar('/modelos')}
            size="lg"
            variant="outline"
            className="w-full sm:w-auto font-semibold text-xs px-6"
          >
            Explorar Modelos Prontos
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section id="recursos" className="px-6 py-16 border-t border-slate-800/80 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Fundação de Engenharia Desacoplada
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            Projetado de ponta a ponta sem dependência de um único fornecedor de inteligência artificial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recursos.map((rec, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between transition-colors hover:border-slate-700 hover:bg-slate-900/80"
            >
              <div>
                <div className="rounded-lg bg-slate-800/80 p-2.5 w-fit mb-4">
                  {rec.icone}
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{rec.titulo}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{rec.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Roadmap & Phases Section */}
      <section id="fases" className="px-6 py-16 border-t border-slate-800/80 bg-slate-900/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Evolução Arquitetural Planejada
            </h2>
            <p className="mt-2 text-xs text-slate-400">
              Cada fase expande um módulo independente da fundação já estabelecida na Fase 0.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {fasesDoProduto.map((fase) => (
              <div
                key={fase.num}
                className={`rounded-lg border p-3.5 transition-all ${
                  fase.status === 'Concluída'
                    ? 'border-emerald-500/40 bg-emerald-950/20'
                    : fase.status === 'Próxima'
                    ? 'border-indigo-500/40 bg-indigo-950/20'
                    : 'border-slate-800 bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-mono text-slate-400">FASE {fase.num}</span>
                  <span
                    className={`font-semibold ${
                      fase.status === 'Concluída'
                        ? 'text-emerald-400'
                        : fase.status === 'Próxima'
                        ? 'text-indigo-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {fase.status}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-white mt-1">{fase.nome}</h4>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button
              onClick={() => onNavegar('/dashboard')}
              size="md"
              variant="primary"
              className="font-semibold text-xs gap-2"
            >
              Iniciar Trabalho na Fundação
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-8 text-center text-xs text-slate-400">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-indigo-400" />
            <span className="font-bold text-slate-200">SKILL FORGE</span>
            <span>— Fundação Técnica (Fase 0)</span>
          </div>
          <div className="text-slate-400">
            Projetado para Claude, OpenAI e Gemini.
          </div>
        </div>
      </footer>
    </div>
  );
};
