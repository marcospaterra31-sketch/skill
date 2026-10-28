/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RoutePath, BreadcrumbItem } from './types/index.ts';
import { ToastProvider } from './components/ui/toast.tsx';
import { AuthProvider } from './lib/autenticacao/AuthContext.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';
import { DashboardView } from './features/dashboard/DashboardView.tsx';
import { SkillsListView } from './features/skills/SkillsListView.tsx';
import { SkillCreateView } from './features/skills/SkillCreateView.tsx';
import { SkillEditorView } from './features/skills/SkillEditorView.tsx';
import { ModelosView } from './features/modelos/ModelosView.tsx';
import { LaboratorioView } from './features/testes/LaboratorioView.tsx';
import { AuditorView } from './features/auditoria/AuditorView.tsx';
import { MelhoriaAutomaticaView } from './features/otimizacao/MelhoriaAutomaticaView.tsx';
import { VersoesView } from './features/versoes/VersoesView.tsx';
import { ExportacoesView } from './features/exportacoes/ExportacoesView.tsx';
import { QAView } from './features/qa/QAView.tsx';
import { ConfiguracoesView } from './features/configuracoes/ConfiguracoesView.tsx';
import { LandingView } from './features/landing/LandingView.tsx';

export default function App() {
  const [skillEmEdicaoId, setSkillEmEdicaoId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.hash.match(/[?&]id=([^&]+)/);
      if (match) return match[1];
    }
    return null;
  });

  // Inicializa a rota a partir do hash da URL ou default para '/dashboard'
  const [rotaAtual, setRotaAtual] = useState<RoutePath>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').split('?')[0] as RoutePath;
      const rotasValidas: RoutePath[] = [
        '/',
        '/dashboard',
        '/skills',
        '/skills/nova',
        '/skills/editor',
        '/modelos',
        '/laboratorio',
        '/auditor',
        '/otimizacao',
        '/versoes',
        '/exportacoes',
        '/qa',
        '/configuracoes',
      ];
      if (rotasValidas.includes(hash)) {
        return hash;
      }
    }
    return '/dashboard';
  });

  const navegarPara = (novaRota: RoutePath, paramSkillId?: string) => {
    if (paramSkillId) {
      setSkillEmEdicaoId(paramSkillId);
    }
    setRotaAtual(novaRota);
    if (typeof window !== 'undefined') {
      const urlHash = paramSkillId ? `${novaRota}?id=${paramSkillId}` : novaRota;
      window.location.hash = urlHash;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const partes = window.location.hash.replace('#', '').split('?');
      const hash = partes[0] as RoutePath;
      if (partes[1]) {
        const match = partes[1].match(/id=([^&]+)/);
        if (match) setSkillEmEdicaoId(match[1]);
      }
      if (hash) {
        setRotaAtual(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Mapeamento dinâmico de Breadcrumbs
  const obterBreadcrumbs = (): BreadcrumbItem[] => {
    switch (rotaAtual) {
      case '/dashboard':
        return [{ label: 'Painel Geral' }];
      case '/skills':
        return [{ label: 'Minhas Skills' }];
      case '/skills/nova':
        return [{ label: 'Minhas Skills', path: '/skills' }, { label: 'Nova Skill' }];
      case '/skills/editor':
        return [{ label: 'Minhas Skills', path: '/skills' }, { label: 'Editor de Skills' }];
      case '/modelos':
        return [{ label: 'Biblioteca de Modelos' }];
      case '/laboratorio':
        return [{ label: 'Laboratório de Testes' }];
      case '/auditor':
        return [{ label: 'Auditor de Segurança' }];
      case '/otimizacao':
        return [{ label: 'Melhoria Automática' }];
      case '/versoes':
        return [{ label: 'Versionamento' }];
      case '/exportacoes':
        return [{ label: 'Exportações' }];
      case '/qa':
        return [{ label: 'Central de Homologação QA' }];
      case '/configuracoes':
        return [{ label: 'Configurações' }];
      default:
        return [{ label: 'Início' }];
    }
  };

  const renderizarConteudo = () => {
    switch (rotaAtual) {
      case '/':
        return <LandingView onNavegar={navegarPara} />;
      case '/dashboard':
        return <DashboardView onNavegar={navegarPara} />;
      case '/skills':
        return <SkillsListView onNavegar={navegarPara} />;
      case '/skills/nova':
        return <SkillCreateView onNavegar={navegarPara} />;
      case '/skills/editor':
        return <SkillEditorView onNavegar={navegarPara} skillIdInicial={skillEmEdicaoId} />;
      case '/modelos':
        return <ModelosView onNavegar={navegarPara} />;
      case '/laboratorio':
        return <LaboratorioView onNavegar={navegarPara} />;
      case '/auditor':
        return <AuditorView onNavegar={navegarPara} />;
      case '/otimizacao':
        return <MelhoriaAutomaticaView onNavegar={navegarPara} />;
      case '/versoes':
        return <VersoesView onNavegar={navegarPara} />;
      case '/exportacoes':
        return <ExportacoesView onNavegar={navegarPara} />;
      case '/qa':
        return <QAView onNavegar={navegarPara} />;
      case '/configuracoes':
        return <ConfiguracoesView onNavegar={navegarPara} />;
      default:
        return <DashboardView onNavegar={navegarPara} />;
    }
  };

  return (
    <AuthProvider>
      <ToastProvider>
        {rotaAtual === '/' ? (
          renderizarConteudo()
        ) : (
          <AppLayout
            rotaAtiva={rotaAtual}
            onNavegar={navegarPara}
            breadcrumbs={obterBreadcrumbs()}
          >
            {renderizarConteudo()}
          </AppLayout>
        )}
      </ToastProvider>
    </AuthProvider>
  );
}
