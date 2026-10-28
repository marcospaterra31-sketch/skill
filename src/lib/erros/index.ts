// ==============================================================================
// SKILL FORGE — SISTEMA DE TRATAMENTO DE ERROS (FASE 0)
// ==============================================================================

export type ErrorCode =
  | 'ERR_API'
  | 'ERR_DATABASE'
  | 'ERR_AUTH'
  | 'ERR_AI'
  | 'ERR_VALIDATION'
  | 'ERR_NOT_FOUND'
  | 'ERR_RATE_LIMIT'
  | 'ERR_INTERNAL';

export interface SerializedError {
  codigo: ErrorCode;
  mensagem: string;
  detalheSeguro?: string;
  dataHora: string;
}

/**
 * Classe base para todos os erros da aplicação
 */
export abstract class AppError extends Error {
  public abstract readonly codigo: ErrorCode;
  public readonly statusHttp: number;
  public readonly detalheSeguro?: string;

  constructor(mensagem: string, statusHttp: number = 400, detalheSeguro?: string) {
    super(mensagem);
    this.name = this.constructor.name;
    this.statusHttp = statusHttp;
    this.detalheSeguro = detalheSeguro;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public toJSON(): SerializedError {
    return {
      codigo: this.codigo,
      mensagem: this.message,
      detalheSeguro: this.detalheSeguro,
      dataHora: new Date().toISOString(),
    };
  }
}

/**
 * Erro de comunicação com APIs externas ou serviços de backend
 */
export class ApiError extends AppError {
  public readonly codigo: ErrorCode = 'ERR_API';

  constructor(mensagem: string = 'Falha na comunicação com o serviço remoto. Tente novamente em instantes.', statusHttp: number = 502, detalheSeguro?: string) {
    super(mensagem, statusHttp, detalheSeguro);
  }
}

/**
 * Erro de persistência ou consulta no banco de dados
 */
export class DatabaseError extends AppError {
  public readonly codigo: ErrorCode = 'ERR_DATABASE';

  constructor(mensagem: string = 'Não foi possível completar a operação no banco de dados. Os dados permanecem íntegros.', statusHttp: number = 500, detalheSeguro?: string) {
    super(mensagem, statusHttp, detalheSeguro);
  }
}

/**
 * Erro de autenticação, sessão ou permissões de acesso
 */
export class AuthError extends AppError {
  public readonly codigo: ErrorCode = 'ERR_AUTH';

  constructor(mensagem: string = 'Sua sessão expirou ou você não possui permissão para acessar este recurso.', statusHttp: number = 401, detalheSeguro?: string) {
    super(mensagem, statusHttp, detalheSeguro);
  }
}

/**
 * Erro nos provedores de Inteligência Artificial (Gemini, Claude, OpenAI)
 */
export class AiError extends AppError {
  public readonly codigo: ErrorCode = 'ERR_AI';
  public readonly provedor?: string;

  constructor(mensagem: string = 'O provedor de IA não conseguiu processar a requisição no momento.', statusHttp: number = 503, provedor?: string, detalheSeguro?: string) {
    super(mensagem, statusHttp, detalheSeguro);
    this.provedor = provedor;
  }
}

/**
 * Erro de validação de dados de entrada, formulários ou esquema de Skill
 */
export class ValidationError extends AppError {
  public readonly codigo: ErrorCode = 'ERR_VALIDATION';
  public readonly camposInvalidos?: Record<string, string>;

  constructor(mensagem: string = 'Os dados informados contêm inconsistências. Por favor, revise os campos.', camposInvalidos?: Record<string, string>) {
    super(mensagem, 422, 'Verifique os dados preenchidos.');
    this.camposInvalidos = camposInvalidos;
  }
}

/**
 * Converte qualquer exceção não tratada em uma mensagem amigável e segura em Português do Brasil
 */
export function normalizarErro(erro: unknown): SerializedError {
  if (erro instanceof AppError) {
    return erro.toJSON();
  }

  // Erro nativo ou desconhecido: nunca vaza stack trace ou detalhes de infraestrutura
  const mensagem = erro instanceof Error ? erro.message : 'Ocorreu um imprevisto na operação.';
  
  // Detecção de erros comuns
  if (mensagem.toLowerCase().includes('network') || mensagem.toLowerCase().includes('fetch')) {
    return new ApiError('Sem conexão com a internet ou serviço indisponível.').toJSON();
  }
  if (mensagem.toLowerCase().includes('prisma') || mensagem.toLowerCase().includes('postgres')) {
    return new DatabaseError().toJSON();
  }
  if (mensagem.toLowerCase().includes('api key') || mensagem.toLowerCase().includes('unauthorized')) {
    return new AuthError('Credenciais inválidas ou chave de API não configurada.').toJSON();
  }

  return {
    codigo: 'ERR_INTERNAL',
    mensagem: 'Não foi possível concluir a ação. Nossa equipe já registrou a ocorrência.',
    detalheSeguro: 'Tente recarregar a página ou refazer a solicitação.',
    dataHora: new Date().toISOString(),
  };
}
