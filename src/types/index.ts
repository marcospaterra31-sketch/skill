// ==============================================================================
// SKILL FORGE — DOMÍNIO & TIPOS (FASE 0)
// ==============================================================================

export enum UserRole {
  ADMIN = 'ADMIN',
  CREATOR = 'CREATOR',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export enum SkillStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum TestResultStatus {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  ERROR = 'ERROR',
  SKIPPED = 'SKIPPED',
}

export enum AuditType {
  AUTOMATED = 'AUTOMATED',
  SECURITY = 'SECURITY',
  EFFICIENCY = 'EFFICIENCY',
  MANUAL = 'MANUAL',
}

export enum ExportFormat {
  ZIP = 'ZIP',
  JSON = 'JSON',
  MARKDOWN = 'MARKDOWN',
  CLAUDE_SKILL = 'CLAUDE_SKILL',
  OPENAI_ASSISTANT = 'OPENAI_ASSISTANT',
  GEMINI_EXTENSION = 'GEMINI_EXTENSION',
}

export enum AIProviderType {
  GEMINI = 'gemini',
  OPENAI = 'openai',
  CLAUDE = 'claude',
}

// ------------------------------------------------------------------------------
// Modelos Principais
// ------------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  targetAudience?: string;
  currentVersion: string;
  isPublic: boolean;
  status: SkillStatus;
  workspaceId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  // Campos derivados / estatísticas
  testsCount?: number;
  lastScore?: number | null;
}

export interface SkillVersion {
  id: string;
  skillId: string;
  versionNumber: string;
  changelog?: string;
  systemPrompt: string;
  userInstructions?: string;
  toolsConfig?: Record<string, unknown>;
  schemaConfig?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VersaoComSkill {
  id: string;
  skillId: string;
  versionNumber: string;
  changelog: string | null;
  systemPrompt: string;
  userInstructions: string | null;
  toolsConfig: any;
  metadata: any;
  authorId: string;
  createdAt: string;
  skillTitle: string | null;
  skillSlug: string | null;
  skillCategory: string | null;
  currentSkillVersion: string | null;
  skillStatus: string | null;
}

export interface SkillTest {
  id: string;
  skillId: string;
  name: string;
  description?: string;
  inputData: Record<string, unknown> | string;
  expectedOutput?: Record<string, unknown> | string;
  assertions?: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'not_contains' | 'regex' | 'notEmpty' | 'max_latency';
    expected: unknown;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SkillTestResult {
  id: string;
  testId: string;
  versionId: string;
  status: TestResultStatus;
  score?: number;
  latencyMs?: number;
  tokensUsed?: number;
  output?: Record<string, unknown> | string;
  assertionResults?: Array<{
    rule: string;
    passed: boolean;
    message: string;
  }>;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillTestComResultado extends SkillTest {
  latestResult?: SkillTestResult;
  skillTitle?: string;
  skillCategory?: string;
}

export interface SkillAudit {
  id: string;
  skillId: string;
  versionId: string;
  auditorType: AuditType;
  score: number;
  passed: boolean;
  summary: string;
  findings?: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    message: string;
    line?: number;
  }>;
  recommendations?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SkillAuditDetalhada extends SkillAudit {
  skillTitle?: string;
  skillSlug?: string;
  skillCategory?: string;
  versionNumber?: string;
}

export interface SkillExport {
  id: string;
  skillId: string;
  versionId: string;
  format: ExportFormat;
  fileName: string;
  fileSizeBytes?: number;
  downloadUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SkillTemplate {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  icon?: string;
  targetFormat: ExportFormat;
  defaultPrompt: string;
  defaultInstructions?: string;
  toolsSample?: Record<string, unknown>;
  tags: string[];
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocument {
  id: string;
  skillId: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  contentSnippet?: string;
  storagePath: string;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------------------------
// Abstração de Provedor de IA
// ------------------------------------------------------------------------------

export interface OpcoesGeracao {
  temperatura?: number;
  maxTokens?: number;
  modelo?: string;
  topP?: number;
  stopSequences?: string[];
  systemInstruction?: string;
}

export interface RespostaIA {
  texto: string;
  modeloUtilizado: string;
  provedor: AIProviderType;
  tokensGastos?: {
    prompt: number;
    resposta: number;
    total: number;
  };
  tempoMs: number;
}

export interface ResultadoAnalise {
  aprovado: boolean;
  pontuacao: number; // 0 a 100
  resumo: string;
  criteriosAvaliados: Array<{
    criterio: string;
    atingido: boolean;
    detalhe: string;
  }>;
  sugestoes: string[];
}

export interface SkillGeradaComIA {
  title: string;
  slug: string;
  category: string;
  description: string;
  targetAudience: string;
  systemPrompt: string;
  userInstructions: string;
  negativeRules: string;
  tags: string[];
  targetFormat: ExportFormat;
  toolsConfig?: {
    enabled: boolean;
    functions?: Array<{
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    }>;
  };
  outputFormat: 'markdown' | 'json' | 'texto';
  schemaConfig?: Record<string, unknown>;
  testCases?: Array<{
    nome: string;
    entrada: Record<string, unknown>;
    esperado: Record<string, unknown>;
  }>;
}

// ------------------------------------------------------------------------------
// FASE 9: Melhoria Automática & Otimização Contínua
// ------------------------------------------------------------------------------

export interface OtimizacaoDiagnostico {
  skillId: string;
  skillTitle: string;
  currentVersion: string;
  systemPromptAtual: string;
  currentMetrics: {
    testPassRate: number;
    totalTests: number;
    testsPassed: number;
    auditScore: number;
    tokensCount: number;
    latencyMs: number;
  };
  gapsIdentificados: Array<{
    tipo: 'test_failure' | 'security_flaw' | 'efficiency' | 'clarity';
    titulo: string;
    descricao: string;
    severidade: 'critical' | 'high' | 'medium' | 'low';
  }>;
  estrategiasSugeridas: Array<{
    id: string;
    nome: string;
    descricao: string;
    impactoEsperado: string;
  }>;
}

export interface OtimizacaoConfig {
  skillId: string;
  corrigirTestes: boolean;
  reforcarSeguranca: boolean;
  reduzirTokens: boolean;
  reforcarJsonSchema: boolean;
  instrucoesAdicionais?: string;
}

export interface OtimizacaoResultado {
  id: string;
  skillId: string;
  skillTitle: string;
  baseVersion: string;
  promptOriginal: string;
  promptOtimizado: string;
  tecnicasAplicadas: Array<{
    nome: string;
    detalhe: string;
    categoria: string;
  }>;
  justificativa: string;
  metricsBefore: {
    testPassRate: number;
    testsPassed: number;
    totalTests: number;
    auditScore: number;
    tokensEst: number;
  };
  metricsAfter: {
    testPassRate: number;
    testsPassed: number;
    totalTests: number;
    auditScore: number;
    tokensEst: number;
  };
  deltas: {
    testRateDelta: number;
    auditScoreDelta: number;
    tokenDeltaPercent: number;
  };
  sugestaoVersao: string;
  sugestaoChangelog: string;
  timestamp: string;
}

// ------------------------------------------------------------------------------
// FASE 11: QA & Homologação de Qualidade do Sistema
// ------------------------------------------------------------------------------

export type QASubsystemStatus = 'PASS' | 'WARN' | 'FAIL';

export interface QACheckItem {
  id: string;
  name: string;
  subsystem: 'database' | 'ai_engine' | 'security_owasp' | 'zip_packaging' | 'semver' | 'assertions';
  subsystemLabel: string;
  status: QASubsystemStatus;
  latencyMs: number;
  message: string;
  details?: Record<string, any>;
}

export interface QAReport {
  score: number; // 0 a 100
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  warnedChecks: number;
  failedChecks: number;
  totalLatencyMs: number;
  executedAt: string;
  environment: {
    database: string;
    aiEngine: string;
    nodeVersion: string;
    activeSkillsCount: number;
  };
  checks: QACheckItem[];
  summary: string;
}

// ------------------------------------------------------------------------------
// Navegação do App
// ------------------------------------------------------------------------------

export interface SkillDetalhada extends Skill {
  versions: SkillVersion[];
}

export type RoutePath =
  | '/'
  | '/dashboard'
  | '/skills'
  | '/skills/nova'
  | '/skills/editor'
  | '/modelos'
  | '/laboratorio'
  | '/auditor'
  | '/otimizacao'
  | '/versoes'
  | '/exportacoes'
  | '/qa'
  | '/configuracoes';

export interface BreadcrumbItem {
  label: string;
  path?: RoutePath;
}
