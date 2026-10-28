import { OtimizacaoDiagnostico, OtimizacaoConfig, OtimizacaoResultado } from '../../types/index.ts';

export class OtimizacaoService {
  /**
   * Obtém o diagnóstico da skill baseado nos testes cadastrados e auditorias anteriores.
   */
  async diagnosticarSkill(skillId: string): Promise<OtimizacaoDiagnostico> {
    const res = await fetch('/api/optimization/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha no diagnóstico' }));
      throw new Error(err.error || 'Não foi possível analisar a skill.');
    }

    return res.json();
  }

  /**
   * Executa o ciclo de otimização automatizada via IA.
   */
  async executarOtimizacao(config: OtimizacaoConfig): Promise<OtimizacaoResultado> {
    const res = await fetch('/api/optimization/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha na otimização' }));
      throw new Error(err.error || 'Não foi possível otimizar a skill.');
    }

    return res.json();
  }

  /**
   * Aplica a versão otimizada diretamente como uma nova versão SemVer da Skill.
   */
  async aplicarVersaoOtimizada(params: {
    skillId: string;
    newVersionNumber: string;
    changelog: string;
    systemPrompt: string;
  }): Promise<{ success: boolean; message: string; version: any }> {
    const res = await fetch('/api/optimization/apply-version', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha ao aplicar versão' }));
      throw new Error(err.error || 'Não foi possível aplicar a versão.');
    }

    return res.json();
  }
}

export const otimizacaoService = new OtimizacaoService();
