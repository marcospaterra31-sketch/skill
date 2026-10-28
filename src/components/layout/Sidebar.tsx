import React from 'react';
import { RoutePath } from '../../types/index.ts';
import { cn } from '../../utils/cn.ts';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  Boxes,
  FlaskConical,
  SearchCheck,
  GitBranch,
  Package,
  Settings,
  Flame,
  FileCode,
  Wand2,
  FileCheck2,
  X,
} from 'lucide-react';

export interface NavItem {
  rotulo: string;
  caminho: RoutePath;
  icone: React.ReactNode;
  badge?: string;
}

export interface SidebarProps {
  rotaAtiva: RoutePath;
  onNavegar: (caminho: RoutePath) => void;
  abertoMobile?: boolean;
  onFecharMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  rotaAtiva,
  onNavegar,
  abertoMobile = false,
  onFecharMobile,
}) => {
  const itensNavegacao: NavItem[] = [
    {
      rotulo: 'Painel',
      caminho: '/dashboard',
      icone: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      rotulo: 'Criar Skill',
      caminho: '/skills/nova',
      icone: <Sparkles className="h-4 w-4 text-indigo-400" />,
    },
    {
      rotulo: 'Minhas Skills',
      caminho: '/skills',
      icone: <BookOpen className="h-4 w-4" />,
    },
    {
      rotulo: 'Editor de Skill',
      caminho: '/skills/editor',
      icone: <FileCode className="h-4 w-4 text-indigo-400" />,
    },
    {
      rotulo: 'Modelos',
      caminho: '/modelos',
      icone: <Boxes className="h-4 w-4" />,
    },
    {
      rotulo: 'Laboratório',
      caminho: '/laboratorio',
      icone: <FlaskConical className="h-4 w-4" />,
    },
    {
      rotulo: 'Auditor',
      caminho: '/auditor',
      icone: <SearchCheck className="h-4 w-4" />,
    },
    {
      rotulo: 'Melhoria IA',
      caminho: '/otimizacao',
      icone: <Wand2 className="h-4 w-4 text-indigo-400" />,
      badge: 'IA',
    },
    {
      rotulo: 'Versões',
      caminho: '/versoes',
      icone: <GitBranch className="h-4 w-4" />,
    },
    {
      rotulo: 'Exportações',
      caminho: '/exportacoes',
      icone: <Package className="h-4 w-4" />,
    },
    {
      rotulo: 'Central QA',
      caminho: '/qa',
      icone: <FileCheck2 className="h-4 w-4 text-emerald-400" />,
      badge: 'QA',
    },
    {
      rotulo: 'Configurações',
      caminho: '/configuracoes',
      icone: <Settings className="h-4 w-4" />,
    },
  ];

  const sidebarContent = (
    <aside className="flex h-full w-64 flex-col border-r border-slate-800/80 bg-slate-950 px-3 py-4 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-3 pb-5 pt-1 border-b border-slate-800/60">
        <button
          onClick={() => onNavegar('/dashboard')}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus-visible:outline-none"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30 group-hover:bg-indigo-500 transition-colors">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <span className="block text-sm font-bold tracking-tight text-white font-sans uppercase">
              Skill Forge
            </span>
            <span className="block text-[10px] text-slate-400 font-medium tracking-wide">
              AI Skill Studio
            </span>
          </div>
        </button>

        {onFecharMobile && (
          <button
            onClick={onFecharMobile}
            className="md:hidden rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fechar navegação"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="mt-4 flex-1 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Navegação
        </div>
        {itensNavegacao.map((item) => {
          const ativo = rotaAtiva === item.caminho;
          return (
            <button
              key={item.caminho}
              onClick={() => {
                onNavegar(item.caminho);
                if (onFecharMobile) onFecharMobile();
              }}
              className={cn(
                'group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all cursor-pointer text-left',
                ativo
                  ? 'bg-indigo-600/20 text-white border border-indigo-500/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              )}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className={cn('transition-colors', ativo ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200')}>
                  {item.icone}
                </span>
                <span className="truncate">{item.rotulo}</span>
              </div>
              {item.badge && (
                <span className="rounded bg-indigo-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-300 border border-indigo-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Workspace Footer Card */}
      <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-3 mt-auto">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Workspace</span>
          <span className="font-semibold text-slate-200 truncate max-w-[120px]">Skill Forge Studio</span>
        </div>
        <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-400">
          <span>Ambiente</span>
          <span className="text-indigo-300 font-mono">Fase 0 Fundação</span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex md:shrink-0">{sidebarContent}</div>

      {/* Mobile Drawer */}
      {abertoMobile && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={onFecharMobile}
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-slate-950">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
