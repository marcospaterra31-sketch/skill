// ==============================================================================
// SKILL FORGE — FÁBRICA DE PROVEDORES DE IA (FASE 0)
// ==============================================================================

import { AIProviderType } from '../../types/index.ts';
import { ProvedorDeIA } from './ProvedorDeIA.ts';
import { GeminiProvider } from './GeminiProvider.ts';
import { OpenAIProvider } from './OpenAIProvider.ts';
import { ClaudeProvider } from './ClaudeProvider.ts';
import { AiError } from '../erros/index.ts';

export interface InfoProvedor {
  tipo: AIProviderType;
  nome: string;
  modeloPadrao: string;
  descricao: string;
  ativo: boolean;
}

export class FabricaProvedorIA {
  private static instancias: Map<AIProviderType, ProvedorDeIA> = new Map();
  private static provedorAtivoPadrao: AIProviderType = AIProviderType.GEMINI;

  /**
   * Obtém a instância do provedor solicitado (Singleton por tipo)
   */
  public static obterProvedor(tipo?: AIProviderType): ProvedorDeIA {
    const alvo = tipo || this.provedorAtivoPadrao;

    if (!this.instancias.has(alvo)) {
      switch (alvo) {
        case AIProviderType.GEMINI:
          this.instancias.set(alvo, new GeminiProvider());
          break;
        case AIProviderType.OPENAI:
          this.instancias.set(alvo, new OpenAIProvider());
          break;
        case AIProviderType.CLAUDE:
          this.instancias.set(alvo, new ClaudeProvider());
          break;
        default:
          throw new AiError(`Provedor de IA desconhecido: "${alvo}"`);
      }
    }

    return this.instancias.get(alvo)!;
  }

  /**
   * Define o provedor padrão global do sistema
   */
  public static definirProvedorPadrao(tipo: AIProviderType): void {
    this.provedorAtivoPadrao = tipo;
  }

  /**
   * Retorna o provedor padrão atual
   */
  public static obterProvedorPadraoTipo(): AIProviderType {
    return this.provedorAtivoPadrao;
  }

  /**
   * Lista todos os provedores suportados e suas informações
   */
  public static listarProvedoresDisponiveis(): InfoProvedor[] {
    return [
      {
        tipo: AIProviderType.GEMINI,
        nome: 'Google Gemini',
        modeloPadrao: 'gemini-2.5-flash',
        descricao: 'Excelente para raciocínio multimodal, contexto ultra-longo e latência mínima.',
        ativo: this.provedorAtivoPadrao === AIProviderType.GEMINI,
      },
      {
        tipo: AIProviderType.CLAUDE,
        nome: 'Anthropic Claude',
        modeloPadrao: 'claude-3-7-sonnet',
        descricao: 'Referência em codificação, rigor sintático e seguimento de diretrizes complexas.',
        ativo: this.provedorAtivoPadrao === AIProviderType.CLAUDE,
      },
      {
        tipo: AIProviderType.OPENAI,
        nome: 'OpenAI',
        modeloPadrao: 'gpt-4o',
        descricao: 'Ampla compatibilidade de ecossistema, chamadas de ferramentas e JSON Schema.',
        ativo: this.provedorAtivoPadrao === AIProviderType.OPENAI,
      },
    ];
  }
}
