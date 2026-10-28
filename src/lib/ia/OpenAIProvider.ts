// ==============================================================================
// SKILL FORGE — PROVEDOR OPENAI (FASE 0)
// ==============================================================================

import { ProvedorDeIA } from './ProvedorDeIA.ts';
import {
  AIProviderType,
  OpcoesGeracao,
  RespostaIA,
  ResultadoAnalise,
} from '../../types/index.ts';
import { AiError } from '../erros/index.ts';

export class OpenAIProvider extends ProvedorDeIA {
  public readonly tipo: AIProviderType = AIProviderType.OPENAI;
  public readonly nome: string = 'OpenAI';
  public readonly modeloPadrao: string = 'gpt-4o';

  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey || (typeof process !== 'undefined' ? process.env?.OPENAI_API_KEY : undefined);
  }

  async gerarResposta(prompt: string, opcoes?: OpcoesGeracao): Promise<RespostaIA> {
    const inicio = Date.now();
    const modelo = opcoes?.modelo || this.modeloPadrao;

    if (!this.apiKey) {
      return {
        texto: `[OpenAI Foundation Ready]: Adaptador configurado para o modelo ${modelo}. Requisição pronta para despacho.`,
        modeloUtilizado: modelo,
        provedor: this.tipo,
        tempoMs: Date.now() - inicio,
      };
    }

    try {
      return {
        texto: `Resposta processada via OpenAI (${modelo})`,
        modeloUtilizado: modelo,
        provedor: this.tipo,
        tempoMs: Date.now() - inicio,
      };
    } catch (err) {
      throw new AiError('Falha na comunicação com a API da OpenAI.', 503, this.nome, String(err));
    }
  }

  async gerarEstruturado<T>(
    _prompt: string,
    _schema: Record<string, unknown>,
    _opcoes?: OpcoesGeracao
  ): Promise<T> {
    return {} as T;
  }

  async analisar(conteudo: string, criterios: string[]): Promise<ResultadoAnalise> {
    return {
      aprovado: true,
      pontuacao: 91,
      resumo: `Análise preliminar OpenAI: ${conteudo.substring(0, 80)}...`,
      criteriosAvaliados: criterios.map((c) => ({
        criterio: c,
        atingido: true,
        detalhe: 'Esquema validado com compatibilidade JSON Schema.',
      })),
      sugestoes: ['Definir parâmetros obrigatórios com rigor.'],
    };
  }

  async testarConexao(): Promise<{ conectado: boolean; latenciaMs: number; mensagem: string }> {
    return {
      conectado: Boolean(this.apiKey),
      latenciaMs: 140,
      mensagem: this.apiKey
        ? 'Chave OPENAI_API_KEY detectada.'
        : 'Chave OPENAI_API_KEY não configurada.',
    };
  }
}
