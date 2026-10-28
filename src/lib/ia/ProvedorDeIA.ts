// ==============================================================================
// SKILL FORGE — ABSTRAÇÃO MULTI-PROVEDOR DE IA (FASE 0)
// ==============================================================================

import {
  AIProviderType,
  OpcoesGeracao,
  RespostaIA,
  ResultadoAnalise,
} from '../../types/index.ts';

/**
 * Interface base que todos os provedores de IA (Gemini, Claude, OpenAI) devem implementar.
 * Garante desacoplamento total da regra de negócio das APIs proprietárias.
 */
export abstract class ProvedorDeIA {
  public abstract readonly tipo: AIProviderType;
  public abstract readonly nome: string;
  public abstract readonly modeloPadrao: string;

  /**
   * Gera uma resposta em texto livre a partir de um prompt e opções
   */
  public abstract gerarResposta(
    prompt: string,
    opcoes?: OpcoesGeracao
  ): Promise<RespostaIA>;

  /**
   * Gera uma resposta estritamente estruturada validada contra um JSON Schema
   */
  public abstract gerarEstruturado<T>(
    prompt: string,
    schema: Record<string, unknown>,
    opcoes?: OpcoesGeracao
  ): Promise<T>;

  /**
   * Analisa um conteúdo de Skill ou prompt contra um conjunto de critérios
   */
  public abstract analisar(
    conteudo: string,
    criterios: string[]
  ): Promise<ResultadoAnalise>;

  /**
   * Verifica se as credenciais do provedor estão válidas e configuradas
   */
  public abstract testarConexao(): Promise<{
    conectado: boolean;
    latenciaMs: number;
    mensagem: string;
  }>;
}
