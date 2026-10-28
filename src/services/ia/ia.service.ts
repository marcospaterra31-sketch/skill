// ==============================================================================
// SKILL FORGE — SERVIÇO DE IA (FASE 0)
// ==============================================================================

import {
  AIProviderType,
  OpcoesGeracao,
  RespostaIA,
  ResultadoAnalise,
} from '../../types/index.ts';
import { FabricaProvedorIA, InfoProvedor } from '../../lib/ia/index.ts';

export class IaService {
  async gerarResposta(
    prompt: string,
    opcoes?: OpcoesGeracao,
    tipoProvedor?: AIProviderType
  ): Promise<RespostaIA> {
    const provedor = FabricaProvedorIA.obterProvedor(tipoProvedor);
    return provedor.gerarResposta(prompt, opcoes);
  }

  async analisarSkill(
    conteudo: string,
    criterios: string[],
    tipoProvedor?: AIProviderType
  ): Promise<ResultadoAnalise> {
    const provedor = FabricaProvedorIA.obterProvedor(tipoProvedor);
    return provedor.analisar(conteudo, criterios);
  }

  listarProvedores(): InfoProvedor[] {
    return FabricaProvedorIA.listarProvedoresDisponiveis();
  }

  selecionarProvedorPadrao(tipo: AIProviderType): void {
    FabricaProvedorIA.definirProvedorPadrao(tipo);
  }

  obterProvedorAtivo(): AIProviderType {
    return FabricaProvedorIA.obterProvedorPadraoTipo();
  }

  async gerarSkillComIA(
    intencao: string,
    preferencias?: { categoria?: string; formato?: any },
    tipoProvedor?: AIProviderType
  ) {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/ai/generate-skill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intencao,
            categoria: preferencias?.categoria,
            formato: preferencias?.formato,
            provedor: tipoProvedor,
          }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // Fallback para execução direta
      }
    }

    const provedor = FabricaProvedorIA.obterProvedor(tipoProvedor) as any;
    if (typeof provedor.gerarSkillCompleta === 'function') {
      return provedor.gerarSkillCompleta(intencao, preferencias);
    }

    // Fallback genérico
    return {
      title: intencao.substring(0, 30),
      slug: 'skill-' + Date.now(),
      category: preferencias?.categoria || 'Engenharia de Software',
      description: intencao,
      targetAudience: 'Desenvolvedores',
      systemPrompt: `Você é um agente especialista em: ${intencao}`,
      userInstructions: 'Instruções de execução.',
      negativeRules: '- Nunca vazar segredos.',
      tags: ['ia', 'skills'],
      targetFormat: 'CLAUDE_SKILL',
      outputFormat: 'markdown',
    };
  }

  async testarConexao(tipo: AIProviderType) {
    const provedor = FabricaProvedorIA.obterProvedor(tipo);
    return provedor.testarConexao();
  }
}

export const iaService = new IaService();
