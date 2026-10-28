import React from 'react';
import { BreadcrumbItem, RoutePath } from '../../types/index.ts';
import { Menu, ChevronRight, User as UserIcon, Plus, LogIn, LogOut } from 'lucide-react';
import { Button } from '../ui/button.tsx';
import { DropdownMenu } from '../ui/dropdown-menu.tsx';
import { useAuth } from '../../lib/autenticacao/index.ts';

export interface TopBarProps {
  breadcrumbs?: BreadcrumbItem[];
  onAbrirMobile: () => void;
  onNavegar: (caminho: RoutePath) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  breadcrumbs = [{ label: 'Painel', path: '/dashboard' }],
  onAbrirMobile,
  onNavegar,
}) => {
  const { usuario, firebaseUser, loginComGoogle, logout, estaAutenticado, carregando } = useAuth();

  const nomeExibicao = usuario?.name || firebaseUser?.displayName || 'Marcos Paterra';
  const emailExibicao = usuario?.email || firebaseUser?.email || 'marcospaterra31@gmail.com';
  const inicial = nomeExibicao.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/90 px-4 md:px-6 backdrop-blur-md">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onAbrirMobile}
          className="md:hidden rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400">
          <button
            onClick={() => onNavegar('/dashboard')}
            className="hover:text-slate-200 transition-colors font-medium cursor-pointer"
          >
            Skill Forge
          </button>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.label}>
              <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />
              {crumb.path && idx < breadcrumbs.length - 1 ? (
                <button
                  onClick={() => onNavegar(crumb.path!)}
                  className="hover:text-slate-200 transition-colors font-medium cursor-pointer"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Actions & User Menu */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => onNavegar('/skills/nova')}
          size="sm"
          variant="primary"
          className="text-xs h-8 px-3 font-semibold gap-1.5 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Nova Skill</span>
        </Button>

        {/* User Auth Profile or Sign-In button */}
        {estaAutenticado ? (
          <DropdownMenu
            trigger={
              <div className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-900 transition-colors cursor-pointer border border-transparent hover:border-slate-800">
                {firebaseUser?.photoURL ? (
                  <img
                    src={firebaseUser.photoURL}
                    alt={nomeExibicao}
                    referrerPolicy="no-referrer"
                    className="h-7 w-7 rounded-full object-cover border border-indigo-500/40"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-900/60 text-indigo-200 border border-indigo-700/50 text-xs font-semibold">
                    {inicial}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <span className="block text-xs font-medium text-slate-200 leading-tight">
                    {nomeExibicao}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                    {emailExibicao}
                  </span>
                </div>
              </div>
            }
            items={[
              {
                id: 'perfil',
                label: 'Configurações',
                icon: <UserIcon className="h-3.5 w-3.5" />,
                onClick: () => onNavegar('/configuracoes'),
              },
              {
                id: 'logout',
                label: 'Encerrar Sessão',
                icon: <LogOut className="h-3.5 w-3.5 text-rose-400" />,
                destructive: true,
                onClick: () => logout(),
              },
            ]}
          />
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={loginComGoogle}
            isLoading={carregando}
            className="text-xs h-8 px-3 gap-1.5 text-slate-200"
          >
            <LogIn className="h-3.5 w-3.5 text-indigo-400" />
            Entrar com Google
          </Button>
        )}
      </div>
    </header>
  );
};
