// ==============================================================================
// SKILL FORGE — CAMADA DE AUTENTICAÇÃO & RBAC (FASE 0)
// ==============================================================================

import { User, Workspace, UserRole } from '../../types/index.ts';
import { AuthError } from '../erros/index.ts';

export interface SessaoUsuario {
  usuario: User;
  workspaceAtivo: Workspace;
  token?: string;
  autenticado: boolean;
}

// Usuário padrão da Fundação (Sessão inicial do arquiteto)
export const USUARIO_PADRAO: User = {
  id: 'usr_forge_001',
  name: 'Marcos Paterra',
  email: 'marcospaterra31@gmail.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: UserRole.CREATOR,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const WORKSPACE_PADRAO: Workspace = {
  id: 'wsp_forge_master',
  name: 'Skill Forge Studio',
  slug: 'skill-forge-studio',
  description: 'Espaço de trabalho principal para desenvolvimento e auditoria de Skills',
  ownerId: 'usr_forge_001',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export class ServicoAutenticacao {
  private sessaoAtual: SessaoUsuario = {
    usuario: USUARIO_PADRAO,
    workspaceAtivo: WORKSPACE_PADRAO,
    autenticado: true,
  };

  public obterSessao(): SessaoUsuario {
    return this.sessaoAtual;
  }

  public obterUsuarioAtual(): User {
    if (!this.sessaoAtual.autenticado) {
      throw new AuthError('Nenhum usuário autenticado no sistema.');
    }
    return this.sessaoAtual.usuario;
  }

  public obterWorkspaceAtivo(): Workspace {
    return this.sessaoAtual.workspaceAtivo;
  }

  public definirWorkspaceAtivo(workspace: Workspace): void {
    this.sessaoAtual.workspaceAtivo = workspace;
  }

  public verificarPermissao(papelMinimo: UserRole): boolean {
    const hierarquia: Record<UserRole, number> = {
      [UserRole.VIEWER]: 1,
      [UserRole.MEMBER]: 2,
      [UserRole.CREATOR]: 3,
      [UserRole.ADMIN]: 4,
    };

    const nivelUsuario = hierarquia[this.sessaoAtual.usuario.role] || 0;
    const nivelExigido = hierarquia[papelMinimo] || 0;

    return nivelUsuario >= nivelExigido;
  }

  public exigirPermissao(papelMinimo: UserRole): void {
    if (!this.verificarPermissao(papelMinimo)) {
      throw new AuthError(`Permissão insuficiente. Esta ação requer o perfil "${papelMinimo}".`);
    }
  }
}

export const authService = new ServicoAutenticacao();
export * from './AuthContext.tsx';
