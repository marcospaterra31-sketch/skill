import { Skill, SkillStatus, SkillDetalhada, SkillVersion } from '../../types/index.ts';
import { db } from '../../lib/banco/index.ts';
import { validarNovaSkill, NovaSkillInput } from '../../lib/validacao/index.ts';
import { authService } from '../../lib/autenticacao/index.ts';
import { UserRole } from '../../types/index.ts';

export class SkillService {
  async listarSkills(workspaceId?: string, tokenAuth?: string | null): Promise<Skill[]> {
    if (typeof window !== 'undefined') {
      try {
        const headers: Record<string, string> = {};
        if (tokenAuth) {
          headers['Authorization'] = `Bearer ${tokenAuth}`;
        }
        const res = await fetch('/api/skills', { headers });
        if (res.ok) {
          const dados = await res.json();
          if (Array.isArray(dados)) return dados;
        }
      } catch {
        // Fallback para repositório
      }
    }
    const wsId = workspaceId || authService.obterWorkspaceAtivo().id;
    return db.listarSkills(wsId);
  }

  async obterSkillPorId(id: string): Promise<Skill | null> {
    return db.obterSkillPorId(id);
  }

  async obterSkillDetalhes(id: string, tokenAuth?: string | null): Promise<SkillDetalhada | null> {
    if (typeof window !== 'undefined') {
      try {
        const headers: Record<string, string> = {};
        if (tokenAuth) headers['Authorization'] = `Bearer ${tokenAuth}`;
        const res = await fetch(`/api/skills/${id}`, { headers });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // Continua para fallback local
      }
    }
    const skill = await db.obterSkillPorId(id);
    if (!skill) return null;
    const versions = await db.listarVersoes(id);
    return {
      ...skill,
      versions,
    };
  }

  async criarSkill(input: Partial<NovaSkillInput>, tokenAuth?: string | null): Promise<Skill> {
    const validado = validarNovaSkill(input);

    if (typeof window !== 'undefined') {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (tokenAuth) {
          headers['Authorization'] = `Bearer ${tokenAuth}`;
        }
        const res = await fetch('/api/skills', {
          method: 'POST',
          headers,
          body: JSON.stringify(validado),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // Continua para criação no db local
      }
    }

    const usuario = authService.obterUsuarioAtual();
    const workspace = authService.obterWorkspaceAtivo();

    const novaSkill = await db.criarSkill({
      title: validado.title,
      slug: validado.slug,
      description: validado.description,
      category: validado.category,
      tags: validado.tags,
      targetAudience: validado.targetAudience,
      currentVersion: '1.0.0',
      isPublic: false,
      status: SkillStatus.DRAFT,
      workspaceId: workspace.id,
      authorId: usuario.id,
    });

    // Cria a primeira versão base (1.0.0)
    await db.criarVersao({
      skillId: novaSkill.id,
      versionNumber: '1.0.0',
      changelog: 'Versão inicial gerada pela fundação técnica do Skill Forge.',
      systemPrompt: validado.systemPrompt || `Você é ${validado.title}. Especialista em ${validado.category}.`,
      userInstructions: 'Diretrizes iniciais da Skill.',
      authorId: usuario.id,
    });

    return novaSkill;
  }

  async salvarSkill(id: string, dados: any, tokenAuth?: string | null): Promise<SkillDetalhada> {
    if (typeof window !== 'undefined') {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (tokenAuth) headers['Authorization'] = `Bearer ${tokenAuth}`;
        const res = await fetch(`/api/skills/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(dados),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // Fallback local
      }
    }

    const atualizada = await db.atualizarSkill(id, dados);
    const versoes = await db.listarVersoes(id);
    return {
      ...atualizada,
      versions: versoes,
    };
  }

  async publicarNovaVersao(
    skillId: string,
    payload: {
      versionNumber: string;
      changelog: string;
      systemPrompt: string;
      userInstructions?: string;
      negativeRules?: string;
      toolsConfig?: any;
      schemaConfig?: any;
      targetFormat?: string;
    },
    tokenAuth?: string | null
  ): Promise<SkillVersion> {
    if (typeof window !== 'undefined') {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (tokenAuth) headers['Authorization'] = `Bearer ${tokenAuth}`;
        const res = await fetch(`/api/skills/${skillId}/versions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // Fallback
      }
    }

    const usuario = authService.obterUsuarioAtual();
    const ver = await db.criarVersao({
      skillId,
      versionNumber: payload.versionNumber,
      changelog: payload.changelog,
      systemPrompt: payload.systemPrompt,
      userInstructions: payload.userInstructions || '',
      authorId: usuario.id,
    });
    await db.atualizarSkill(skillId, { currentVersion: payload.versionNumber });
    return ver;
  }

  async duplicarSkill(id: string, tokenAuth?: string | null): Promise<Skill> {
    if (typeof window !== 'undefined') {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (tokenAuth) headers['Authorization'] = `Bearer ${tokenAuth}`;
        const res = await fetch(`/api/skills/${id}/duplicate`, {
          method: 'POST',
          headers,
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // Fallback
      }
    }
    const skill = await db.obterSkillPorId(id);
    if (!skill) throw new Error('Skill não encontrada.');
    const usuario = authService.obterUsuarioAtual();
    const nova = await db.criarSkill({
      ...skill,
      title: `${skill.title} (Cópia)`,
      slug: `${skill.slug}-copia`,
      status: SkillStatus.DRAFT,
      authorId: usuario.id,
    });
    return nova;
  }

  async excluirSkill(id: string, tokenAuth?: string | null): Promise<boolean> {
    if (typeof window !== 'undefined') {
      try {
        const headers: Record<string, string> = {};
        if (tokenAuth) headers['Authorization'] = `Bearer ${tokenAuth}`;
        const res = await fetch(`/api/skills/${id}`, {
          method: 'DELETE',
          headers,
        });
        if (res.ok) return true;
      } catch {
        // Fallback
      }
    }
    return db.excluirSkill(id);
  }

  async simularExecucao(
    id: string,
    prompt: string,
    userInput: string,
    provider: string = 'gemini',
    temperature: number = 0.7
  ): Promise<{
    resposta: string;
    modelo: string;
    provedor: string;
    tokens?: { prompt: number; resposta: number; total: number };
    latenciaMs: number;
  }> {
    const res = await fetch(`/api/skills/${id}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, userInput, provider, temperature }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao executar simulação.' }));
      throw new Error(err.error || 'Falha na simulação.');
    }
    return await res.json();
  }

  async obterMetricasDashboard() {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/metrics');
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // Fallback
      }
    }
    const workspace = authService.obterWorkspaceAtivo();
    return db.obterMetricasDashboard(workspace.id);
  }
}

export const skillService = new SkillService();
