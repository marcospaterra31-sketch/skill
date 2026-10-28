import React, { useState } from 'react';
import { RoutePath, BreadcrumbItem } from '../../types/index.ts';
import { Sidebar } from './Sidebar.tsx';
import { TopBar } from './TopBar.tsx';

export interface AppLayoutProps {
  rotaAtiva: RoutePath;
  onNavegar: (caminho: RoutePath) => void;
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  rotaAtiva,
  onNavegar,
  breadcrumbs,
  children,
}) => {
  const [mobileMenuAberto, setMobileMenuAberto] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        rotaAtiva={rotaAtiva}
        onNavegar={onNavegar}
        abertoMobile={mobileMenuAberto}
        onFecharMobile={() => setMobileMenuAberto(false)}
      />

      {/* Main Viewport Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          breadcrumbs={breadcrumbs}
          onAbrirMobile={() => setMobileMenuAberto(true)}
          onNavegar={onNavegar}
        />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 focus:outline-none">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
};
