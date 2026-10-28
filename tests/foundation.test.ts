// ==============================================================================
// SKILL FORGE — SUÍTE DE TESTES DA FUNDAÇÃO TÉCNICA (FASE 0)
// ==============================================================================

import { validarNovaSkill, validarSemver, validarFormatoExportacao } from '../src/lib/validacao/index.ts';
import { AppError, ValidationError, normalizarErro } from '../src/lib/erros/index.ts';
import { authService } from '../src/lib/autenticacao/index.ts';
import { db } from '../src/lib/banco/index.ts';
import { FabricaProvedorIA } from '../src/lib/ia/index.ts';
import { skillService } from '../src/services/skills/skill.service.ts';
import { exportacaoService } from '../src/services/exportacoes/exportacao.service.ts';
import { auditoriaService } from '../src/services/auditoria/auditoria.service.ts';
import { AIProviderType, ExportFormat, UserRole } from '../src/types/index.ts';

let totalTestes = 0;
let testesAprovados = 0;

function assert(condicao: boolean, mensagem: string) {
  totalTestes++;
  if (!condicao) {
    console.error(`❌ FALHA: ${mensagem}`);
    throw new Error(mensagem);
  }
  testesAprovados++;
  console.log(`✓ OK: ${mensagem}`);
}

async function executarTestes() {
  console.log('\n--- INICIANDO TESTES DA FUNDAÇÃO TÉCNICA (FASE 0) ---\n');

  // 1. Teste de Validação de Skills
  console.log('[1/6] Testando Validações');
  const skillValida = validarNovaSkill({
    title: 'Engenheiro de Prompts Seguro',
    category: 'Segurança & Auditoria',
    description: 'Validador e sanitizador de entradas para modelos de linguagem.',
  });
  assert(skillValida.title === 'Engenheiro de Prompts Seguro', 'Título sanitizado');
  assert(skillValida.slug === 'engenheiro-de-prompts-seguro', 'Slug gerado automaticamente');

  // Teste de semver
  assert(validarSemver('1.0.0'), 'SemVer 1.0.0 válido');
  assert(validarSemver('2.1.4-beta.1'), 'SemVer com pre-release válido');
  assert(!validarSemver('v1'), 'Versão sem formato SemVer rejeitada');

  // Teste de formato de exportação
  assert(validarFormatoExportacao('ZIP') === ExportFormat.ZIP, 'Formato ZIP aceito');

  // 2. Teste de Hierarquia de Erros
  console.log('\n[2/6] Testando Tratamento de Erros');
  try {
    validarNovaSkill({ title: 'A' });
    assert(false, 'Deveria lançar ValidationError');
  } catch (err) {
    assert(err instanceof ValidationError, 'Exceção é instância de ValidationError');
    const normalizado = normalizarErro(err);
    assert(normalizado.codigo === 'ERR_VALIDATION', 'Código de erro normalizado correto');
  }

  // 3. Teste de Autenticação e RBAC
  console.log('\n[3/6] Testando Autenticação e RBAC');
  const sessao = authService.obterSessao();
  assert(sessao.autenticado, 'Sessão ativa detectada');
  assert(authService.verificarPermissao(UserRole.CREATOR), 'Permissão CREATOR validada');

  // 4. Teste da Arquitetura Multi-Provedor de IA
  console.log('\n[4/6] Testando Fábrica de Provedores de IA');
  const provedorGemini = FabricaProvedorIA.obterProvedor(AIProviderType.GEMINI);
  assert(provedorGemini.tipo === AIProviderType.GEMINI, 'Provedor Gemini instanciado');
  
  const provedorClaude = FabricaProvedorIA.obterProvedor(AIProviderType.CLAUDE);
  assert(provedorClaude.tipo === AIProviderType.CLAUDE, 'Provedor Claude instanciado');

  const provedorOpenAI = FabricaProvedorIA.obterProvedor(AIProviderType.OPENAI);
  assert(provedorOpenAI.tipo === AIProviderType.OPENAI, 'Provedor OpenAI instanciado');

  const respostaTeste = await provedorClaude.gerarResposta('Olá mundo');
  assert(respostaTeste.provedor === AIProviderType.CLAUDE, 'Execução desacoplada via ProvedorDeIA');

  // 5. Teste do Banco de Dados e Serviços
  console.log('\n[5/6] Testando Banco de Dados e Serviços');
  const templates = await db.listarTemplates();
  assert(templates.length >= 5, 'Modelos pré-fabricados carregados no repositório');

  const metricasIniciais = await skillService.obterMetricasDashboard();
  assert(metricasIniciais.skillsCriadas === 0, 'Dashboard inicial com 0 skills criadas conforme especificação');
  assert(metricasIniciais.versaoAtual === '—', 'Versão atual inicial é "—"');
  assert(metricasIniciais.pontuacaoMedia === '—', 'Pontuação média inicial é "—"');

  // Criar uma skill pelo serviço
  const novaSkill = await skillService.criarSkill({
    title: 'Skill de Teste Automatizado',
    category: 'Engenharia de Software',
    description: 'Skill criada para validação do pipeline de testes da Fase 0.',
  });
  assert(novaSkill.currentVersion === '1.0.0', 'Primeira versão 1.0.0 criada automaticamente');

  const metricasAposCriacao = await skillService.obterMetricasDashboard();
  assert(metricasAposCriacao.skillsCriadas === 1, 'Métrica de skills incrementada para 1');
  assert(metricasAposCriacao.versaoAtual === '1.0.0', 'Versão atual reflete a skill criada');

  // 6. Teste de Exportações e Auditoria
  console.log('\n[6/6] Testando Exportações e Auditorias');
  const formatos = exportacaoService.obterFormatosDisponiveis();
  assert(formatos.length === 5, '5 formatos de exportação disponíveis');

  const auditoria = await auditoriaService.simularAuditoria(novaSkill.id, '1.0.0');
  assert(auditoria.passed, 'Auditoria de conformidade executada');

  console.log(`\n========================================`);
  console.log(`✓ TODOS OS ${testesAprovados}/${totalTestes} TESTES DA FUNDAÇÃO PASSARAM COM SUCESSO!`);
  console.log(`========================================\n`);
}

executarTestes().catch((err) => {
  console.error('\n❌ Falha na execução da suíte de testes:', err);
  process.exit(1);
});
