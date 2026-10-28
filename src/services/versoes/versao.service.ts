import { SkillVersion, VersaoComSkill } from '../../types/index.ts';
import { db } from '../../lib/banco/index.ts';
import { validarSemver } from '../../lib/validacao/index.ts';
import { ValidationError } from '../../lib/erros/index.ts';
import { authService } from '../../lib/autenticacao/index.ts';

export class VersaoService {
  async listarVersoes(skillId: string): Promise<SkillVersion[]> {
    return db.listarVersoes(skillId);
  }

  async listarTodasVersoes(): Promise<VersaoComSkill[]> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/versions');
        if (res.ok) {
          const dados = await res.json();
          if (Array.isArray(dados)) return dados;
        }
      } catch {
        // Fallback para mock/local
      }
    }
    const skills = await db.listarSkills(authService.obterWorkspaceAtivo().id);
    const resultado: VersaoComSkill[] = [];
    for (const s of skills) {
      const vers = await db.listarVersoes(s.id);
      for (const v of vers) {
        resultado.push({
          id: v.id,
          skillId: v.skillId,
          versionNumber: v.versionNumber,
          changelog: v.changelog || null,
          systemPrompt: v.systemPrompt,
          userInstructions: v.userInstructions || null,
          toolsConfig: v.toolsConfig,
          metadata: v.metadata,
          authorId: v.authorId,
          createdAt: v.createdAt,
          skillTitle: s.title,
          skillSlug: s.slug,
          skillCategory: s.category,
          currentSkillVersion: s.currentVersion,
          skillStatus: s.status,
        });
      }
    }
    return resultado.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async gerarChangelogComIA(promptAntigo: string, promptNovo: string, versionNumber: string): Promise<string> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/versions/generate-changelog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promptAntigo, promptNovo, versionNumber }),
        });
        if (res.ok) {
          const dados = await res.json();
          return dados.changelog;
        }
      } catch {
        // Fallback
      }
    }
    return `- Ajustes estruturais no System Prompt para a versão v${versionNumber}\n- Refinamento de diretrizes operacionais e restrições negativas\n- Garantia de conformidade sintática e segurança`;
  }

  async reverterVersao(skillId: string, versionId: string): Promise<boolean> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/versions/rollback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skillId, versionId }),
        });
        if (res.ok) return true;
      } catch {
        // Fallback
      }
    }
    return false;
  }

  async criarNovaVersao(
    skillId: string,
    versao: string,
    systemPrompt: string,
    changelog?: string
  ): Promise<SkillVersion> {
    if (!validarSemver(versao)) {
      throw new ValidationError(`Versão inválida: "${versao}". Utilize o padrão SemVer (ex: 1.0.1, 1.1.0, 2.0.0).`);
    }

    const usuario = authService.obterUsuarioAtual();
    const novaVersao = await db.criarVersao({
      skillId,
      versionNumber: versao,
      changelog: changelog || 'Nova iteração registrada.',
      systemPrompt,
      authorId: usuario.id,
    });

    // Atualiza a versão corrente na Skill
    await db.atualizarSkill(skillId, { currentVersion: versao });

    return novaVersao;
  }
}

export const versaoService = new VersaoService();
