// ==============================================================================
// SKILL FORGE — CAMADA DE BANCO DE DADOS & REPOSITÓRIO (FASE 0)
// ==============================================================================

import {
  Skill,
  SkillVersion,
  SkillTest,
  SkillTestResult,
  SkillAudit,
  SkillExport,
  SkillTemplate,
  Workspace,
  User,
  SkillStatus,
  ExportFormat,
  UserRole,
} from '../../types/index.ts';
import { DatabaseError } from '../erros/index.ts';
import { USUARIO_PADRAO, WORKSPACE_PADRAO } from '../autenticacao/index.ts';

// Modelos pré-fabricados para a biblioteca de templates (/modelos)
export const MODELOS_INICIAIS: SkillTemplate[] = [
  {
    id: 'tmpl_claude_architect',
    title: 'Arquiteto de Software Claude',
    slug: 'arquiteto-software-claude',
    description: 'Especialista em análise estrutural de repositórios, padrões de projeto DDD e refatoração segura de código legado.',
    category: 'Engenharia de Software',
    icon: 'Layers',
    targetFormat: ExportFormat.CLAUDE_SKILL,
    defaultPrompt: 'Você é um Arquiteto de Software Sênior especializado em microsserviços, TypeScript e arquitetura limpa.',
    tags: ['Arquitetura', 'Clean Code', 'TypeScript', 'Claude'],
    isFeatured: true,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'tmpl_gemini_vision_auditor',
    title: 'Auditor de Design & Acessibilidade Gemini',
    slug: 'auditor-design-acessibilidade-gemini',
    description: 'Avalia interfaces visuais contra diretrizes WCAG AA, hierarquia tipográfica e contraste ótico.',
    category: 'Design & Acessibilidade',
    icon: 'Eye',
    targetFormat: ExportFormat.GEMINI_EXTENSION,
    defaultPrompt: 'Você é um auditor sênior de acessibilidade e design frontend (WCAG 2.2 AA).',
    tags: ['WCAG', 'Acessibilidade', 'UI/UX', 'Gemini'],
    isFeatured: true,
    createdAt: '2026-01-18T10:00:00.000Z',
    updatedAt: '2026-01-18T10:00:00.000Z',
  },
  {
    id: 'tmpl_openai_function_bot',
    title: 'Agente de Function Calling OpenAI',
    slug: 'agente-function-calling-openai',
    description: 'Estruturado para roteamento preciso de ferramentas, esquemas JSON Schema rígidos e validação de parâmetros.',
    category: 'Automação & Integrações',
    icon: 'Cpu',
    targetFormat: ExportFormat.OPENAI_ASSISTANT,
    defaultPrompt: 'Você é um orquestrador de chamadas de função com rigorosa validação tipada.',
    tags: ['Function Calling', 'JSON Schema', 'OpenAI'],
    isFeatured: true,
    createdAt: '2026-01-20T10:00:00.000Z',
    updatedAt: '2026-01-20T10:00:00.000Z',
  },
  {
    id: 'tmpl_security_sentinel',
    title: 'Sentinela de Segurança e OWASP',
    slug: 'sentinela-seguranca-owasp',
    description: 'Detecta injeções de prompt, vazamento de credenciais, dependências vulneráveis e configurações inseguras.',
    category: 'Segurança & Auditoria',
    icon: 'ShieldCheck',
    targetFormat: ExportFormat.ZIP,
    defaultPrompt: 'Você é um auditor de cibersegurança focado em IA generativa e OWASP Top 10 for LLMs.',
    tags: ['Segurança', 'OWASP', 'Prompt Injection', 'Auditoria'],
    isFeatured: false,
    createdAt: '2026-01-22T10:00:00.000Z',
    updatedAt: '2026-01-22T10:00:00.000Z',
  },
  {
    id: 'tmpl_cursor_rules_master',
    title: 'Especialista em Cursor Rules & Contexto',
    slug: 'especialista-cursor-rules',
    description: 'Padroniza regras de estilo de código, convenções de commits e documentação contínua para times.',
    category: 'Produtividade de Dev',
    icon: 'Code2',
    targetFormat: ExportFormat.MARKDOWN,
    defaultPrompt: 'Gere regras contextuais (.cursorrules) concisas, com regras negativas e padrões arquiteturais.',
    tags: ['Cursor', 'DevTools', 'Rules'],
    isFeatured: false,
    createdAt: '2026-01-25T10:00:00.000Z',
    updatedAt: '2026-01-25T10:00:00.000Z',
  },
];

/**
 * Repositório Unificado do Banco de Dados
 * Fornece operações atômicas e seguras para a Fase 0
 */
class BancoDeDados {
  private users: Map<string, User> = new Map([[USUARIO_PADRAO.id, USUARIO_PADRAO]]);
  private workspaces: Map<string, Workspace> = new Map([[WORKSPACE_PADRAO.id, WORKSPACE_PADRAO]]);
  private skills: Map<string, Skill> = new Map();
  private versions: Map<string, SkillVersion> = new Map();
  private tests: Map<string, SkillTest> = new Map();
  private testResults: Map<string, SkillTestResult> = new Map();
  private audits: Map<string, SkillAudit> = new Map();
  private exports: Map<string, SkillExport> = new Map();
  private templates: Map<string, SkillTemplate> = new Map(
    MODELOS_INICIAIS.map((t) => [t.id, t])
  );

  // ----------------------------------------------------------------------------
  // Skills
  // ----------------------------------------------------------------------------
  async listarSkills(workspaceId: string): Promise<Skill[]> {
    try {
      return Array.from(this.skills.values())
        .filter((s) => s.workspaceId === workspaceId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch {
      throw new DatabaseError('Falha ao listar Skills do workspace.');
    }
  }

  async obterSkillPorId(id: string): Promise<Skill | null> {
    return this.skills.get(id) || null;
  }

  async criarSkill(dados: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Skill> {
    try {
      const now = new Date().toISOString();
      const id = `skl_${Math.random().toString(36).substring(2, 11)}`;
      const novaSkill: Skill = {
        ...dados,
        id,
        createdAt: now,
        updatedAt: now,
      };
      this.skills.set(id, novaSkill);
      return novaSkill;
    } catch {
      throw new DatabaseError('Não foi possível gravar a nova Skill.');
    }
  }

  async atualizarSkill(id: string, atualizacao: Partial<Skill>): Promise<Skill> {
    const existente = this.skills.get(id);
    if (!existente) throw new DatabaseError('Skill não encontrada para atualização.');
    const atualizada: Skill = {
      ...existente,
      ...atualizacao,
      updatedAt: new Date().toISOString(),
    };
    this.skills.set(id, atualizada);
    return atualizada;
  }

  async excluirSkill(id: string): Promise<boolean> {
    return this.skills.delete(id);
  }

  // ----------------------------------------------------------------------------
  // Versões
  // ----------------------------------------------------------------------------
  async criarVersao(dados: Omit<SkillVersion, 'id' | 'createdAt' | 'updatedAt'>): Promise<SkillVersion> {
    const now = new Date().toISOString();
    const id = `ver_${Math.random().toString(36).substring(2, 11)}`;
    const novaVersao: SkillVersion = {
      ...dados,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.versions.set(id, novaVersao);
    return novaVersao;
  }

  async listarVersoes(skillId: string): Promise<SkillVersion[]> {
    return Array.from(this.versions.values())
      .filter((v) => v.skillId === skillId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ----------------------------------------------------------------------------
  // Estatísticas do Dashboard
  // ----------------------------------------------------------------------------
  async obterMetricasDashboard(workspaceId: string): Promise<{
    skillsCriadas: number;
    testesExecutados: number;
    pontuacaoMedia: string;
    versaoAtual: string;
  }> {
    const skills = await this.listarSkills(workspaceId);
    const testes = Array.from(this.testResults.values());
    const pontuacoes = Array.from(this.audits.values()).map((a) => a.score);

    const pontuacaoMedia =
      pontuacoes.length > 0
        ? `${Math.round(pontuacoes.reduce((acc, v) => acc + v, 0) / pontuacoes.length)}%`
        : '—';

    const versaoMaisRecente = skills.length > 0 ? skills[0].currentVersion : '—';

    return {
      skillsCriadas: skills.length,
      testesExecutados: testes.length,
      pontuacaoMedia,
      versaoAtual: versaoMaisRecente,
    };
  }

  // ----------------------------------------------------------------------------
  // Modelos / Templates
  // ----------------------------------------------------------------------------
  async listarTemplates(): Promise<SkillTemplate[]> {
    return Array.from(this.templates.values());
  }

  async obterTemplatePorSlug(slug: string): Promise<SkillTemplate | null> {
    for (const t of this.templates.values()) {
      if (t.slug === slug) return t;
    }
    return null;
  }
}

export const db = new BancoDeDados();
