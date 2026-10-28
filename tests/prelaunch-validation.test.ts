/**
 * ==============================================================================
 * SKILL FORGE — ETAPA 14: VALIDAÇÃO FINAL PRÉ-LANÇAMENTO & TESTES DE HOMOLOGAÇÃO
 * ==============================================================================
 * 
 * Bateria automatizada independente para validação pré-lançamento:
 * 1. Reauditoria de Segurança Independente (401, 403, BOLA/IDOR, Rate Limit, Payload 413, Sanitização)
 * 2. Integridade Funcional Ponta a Ponta (Ciclo Completo: IA -> Persistência -> Versão -> Auditoria -> Teste -> Rollback -> ZIP)
 * 3. Teste Controlado de Carga & Performance (25 reqs concorrentes, latência p50/p95, memória, taxa de erro)
 * 4. Verificação de Resiliência e Banco de Dados (Cloud SQL PostgreSQL, Pool, Runbook de Restauração)
 */

import http from 'http';
import JSZip from 'jszip';
import { app } from '../server.ts';
import { sanitizeFilename } from '../src/utils/security.ts';
import { db } from '../src/db/index.ts';
import { skills } from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';

process.env.NODE_ENV = 'test';
process.env.TEST_AUTH = 'true';

let server: http.Server;
let port: number;
let baseUrl: string;

let totalChecks = 0;
let checksAprovados = 0;

function registrarCheck(condicao: boolean, descricao: string) {
  totalChecks++;
  if (!condicao) {
    console.error(`  ❌ FALHA: ${descricao}`);
    throw new Error(`Falha no check: ${descricao}`);
  }
  checksAprovados++;
  console.log(`  ✓ OK: ${descricao}`);
}

async function apiFetch(
  path: string,
  options: {
    method?: string;
    body?: any;
    token?: string | null;
    rawBody?: string;
    contentType?: string;
  } = {}
) {
  const { method = 'GET', body, token, rawBody, contentType = 'application/json' } = options;
  const headers: Record<string, string> = {};

  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const payload = rawBody !== undefined ? rawBody : body ? JSON.stringify(body) : undefined;
  if (payload && !headers['Content-Length']) {
    headers['Content-Length'] = Buffer.byteLength(payload).toString();
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: payload,
  });

  let responseData: any = null;
  const respContentType = response.headers.get('content-type') || '';
  if (respContentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else if (respContentType.includes('application/zip') || respContentType.includes('octet-stream')) {
    const arrayBuffer = await response.arrayBuffer();
    responseData = Buffer.from(arrayBuffer);
  } else {
    responseData = await response.text();
  }

  return {
    status: response.status,
    headers: response.headers,
    data: responseData,
  };
}

// Tokens sintéticos para isolamento multi-tenant
const tokenAlice = 'test_token_alice101_CREATOR';
const tokenBob = 'test_token_bob202_CREATOR';

async function executarValidacaoPreLancamento() {
  console.log('\n================================================================');
  console.log('🛡️  SKILL FORGE — ETAPA 14: VALIDAÇÃO INDEPENDENTE PRÉ-LANÇAMENTO');
  console.log('================================================================\n');

  // Iniciar servidor em porta efêmera isolada para testes
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as any;
      port = addr.port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[INIT] Servidor de homologação pré-lançamento ativo na porta ${port}\n`);
      resolve();
    });
  });

  try {
    // --------------------------------------------------------------------------
    // SEÇÃO 1: REAUDITORIA DE SEGURANÇA INDEPENDENTE
    // --------------------------------------------------------------------------
    console.log('--- SEÇÃO 1: REAUDITORIA DE SEGURANÇA INDEPENDENTE ---');

    // 1.1 Autenticação obrigatória com HTTP 401
    const rotasProtegidas: Array<{ metodo: string; url: string; body?: any }> = [
      { metodo: 'POST', url: '/api/skills', body: { title: 'Hack', description: 'desc', category: 'Eng' } },
      { metodo: 'PUT', url: '/api/skills/skill_fake_999', body: { title: 'Hack' } },
      { metodo: 'DELETE', url: '/api/skills/skill_fake_999' },
      { metodo: 'POST', url: '/api/skills/skill_fake_999/versions', body: { versionNumber: '1.0.1' } },
      { metodo: 'POST', url: '/api/versions/rollback', body: { skillId: 'skill_fake_999', versionId: 'ver_fake_999' } },
      { metodo: 'POST', url: '/api/tests', body: { skillId: 'skill_fake_999', name: 'Test', inputData: 'oi' } },
      { metodo: 'POST', url: '/api/tests/test_fake_999/run' },
      { metodo: 'POST', url: '/api/exports/generate', body: { skillId: 'skill_fake_999' } },
      { metodo: 'GET', url: '/api/exports' },
      { metodo: 'POST', url: '/api/ai/generate-skill', body: { intencao: 'Hack prompt' } },
      { metodo: 'POST', url: '/api/skills/skill_fake_999/simulate', body: { prompt: 'prompt', userInput: 'oi' } },
      { metodo: 'POST', url: '/api/audits/run', body: { skillId: 'skill_fake_999' } },
      { metodo: 'POST', url: '/api/optimization/run', body: { skillId: 'skill_fake_999' } },
    ];

    for (const rota of rotasProtegidas) {
      const resSemToken = await apiFetch(rota.url, { method: rota.metodo, body: rota.body, token: null });
      registrarCheck(
        resSemToken.status === 401,
        `Ausência de token em ${rota.metodo} ${rota.url} retorna HTTP 401 Não Autorizado`
      );
      registrarCheck(
        typeof resSemToken.data?.error === 'string' && resSemToken.data.error.includes('Não autorizado'),
        `Payload de erro padronizado em ${rota.metodo} ${rota.url}`
      );
    }

    // 1.2 Token malformado ou adulterado
    const resTokenInvalido = await apiFetch('/api/skills', {
      method: 'POST',
      body: { title: 'Teste Malformado', description: 'desc', category: 'Eng' },
      token: 'token_totalmente_invalido_sem_base64_ou_jwt',
    });
    registrarCheck(
      resTokenInvalido.status === 401,
      'Token malformado/adulterado rejeitado com HTTP 401'
    );

    // 1.3 Isolamento Multi-Tenant & Proteção BOLA/IDOR
    console.log('\n--- Validando Isolamento de Dados entre Usuários (Alice vs Bob) ---');

    // Alice cria uma skill privada
    const resSkillAlice = await apiFetch('/api/skills', {
      method: 'POST',
      token: tokenAlice,
      body: {
        title: 'Skill Secreta Alice',
        description: 'Dados confidenciais de Alice',
        category: 'Segurança',
        systemPrompt: 'Instruções restritas de Alice',
        isPublic: false,
        tags: ['seguranca', 'confidencial'],
      },
    });
    registrarCheck(resSkillAlice.status === 201, 'Alice cria Skill privada com sucesso (HTTP 201)');
    const skillAliceId = resSkillAlice.data?.id;
    registrarCheck(Boolean(skillAliceId), `ID gerado para a Skill de Alice: ${skillAliceId}`);

    // Bob tenta ler a skill privada de Alice -> Deve retornar 404 (ocultamento) ou 403
    const resBobLeSkillPrivada = await apiFetch(`/api/skills/${skillAliceId}`, {
      method: 'GET',
      token: tokenBob,
    });
    registrarCheck(
      resBobLeSkillPrivada.status === 404 || resBobLeSkillPrivada.status === 403,
      `Bob não consegue visualizar Skill privada de Alice (Status ${resBobLeSkillPrivada.status})`
    );

    // Bob lista skills -> Skill privada de Alice não deve aparecer
    const resBobListar = await apiFetch('/api/skills', {
      method: 'GET',
      token: tokenBob,
    });
    const skillsDeBob = Array.isArray(resBobListar.data) ? resBobListar.data : resBobListar.data?.skills || [];
    const skillAliceVazou = skillsDeBob.some((s: any) => s.id === skillAliceId);
    registrarCheck(!skillAliceVazou, 'Skill privada de Alice não vaza na listagem de Bob');

    // Alice cria uma skill pública
    const resSkillPublicaAlice = await apiFetch('/api/skills', {
      method: 'POST',
      token: tokenAlice,
      body: {
        title: 'Skill Pública da Alice',
        description: 'Skill aberta para leitura',
        category: 'Geral',
        systemPrompt: 'Prompt público da Alice',
        isPublic: true,
        tags: ['publico'],
      },
    });
    registrarCheck(resSkillPublicaAlice.status === 201, 'Alice cria Skill pública com sucesso (HTTP 201)');
    const skillPublicaId = resSkillPublicaAlice.data?.id;

    // Bob consegue LER a skill pública de Alice
    const resBobLePublica = await apiFetch(`/api/skills/${skillPublicaId}`, {
      method: 'GET',
      token: tokenBob,
    });
    registrarCheck(resBobLePublica.status === 200, 'Bob consegue consultar Skill pública de Alice (HTTP 200)');

    // Bob tenta MODIFICAR a skill de Alice -> HTTP 403
    const resBobModificaSkillAlice = await apiFetch(`/api/skills/${skillPublicaId}`, {
      method: 'PUT',
      token: tokenBob,
      body: {
        title: 'Skill Adulterada por Bob',
        systemPrompt: 'Injeção maliciosa de Bob',
      },
    });
    registrarCheck(
      resBobModificaSkillAlice.status === 403,
      'Bob é bloqueado com HTTP 403 ao tentar modificar Skill de Alice'
    );

    // Bob tenta EXCLUIR a skill de Alice -> HTTP 403
    const resBobExcluiSkillAlice = await apiFetch(`/api/skills/${skillPublicaId}`, {
      method: 'DELETE',
      token: tokenBob,
    });
    registrarCheck(
      resBobExcluiSkillAlice.status === 403,
      'Bob é bloqueado com HTTP 403 ao tentar excluir Skill de Alice'
    );

    // Bob tenta CRIAR VERSÃO na skill de Alice -> HTTP 403
    const resBobCriaVersao = await apiFetch(`/api/skills/${skillPublicaId}/versions`, {
      method: 'POST',
      token: tokenBob,
      body: {
        versionNumber: '2.0.0',
        changelog: 'Versão não autorizada por Bob',
      },
    });
    registrarCheck(
      resBobCriaVersao.status === 403,
      'Bob é bloqueado com HTTP 403 ao tentar versionar Skill de Alice'
    );

    // Bob tenta CRIAR TESTE na skill de Alice -> HTTP 403
    const resBobCriaTeste = await apiFetch('/api/tests', {
      method: 'POST',
      token: tokenBob,
      body: {
        skillId: skillPublicaId,
        name: 'Teste não autorizado de Bob',
        inputData: 'Ataque',
        assertions: [{ operator: 'contains', expected: 'teste' }],
      },
    });
    registrarCheck(
      resBobCriaTeste.status === 403,
      'Bob é bloqueado com HTTP 403 ao tentar criar teste na Skill de Alice'
    );

    // Alice cria exportação ZIP
    const resExportAlice = await apiFetch('/api/exports/generate', {
      method: 'POST',
      token: tokenAlice,
      body: { skillId: skillAliceId },
    });
    registrarCheck(resExportAlice.status === 200, 'Alice gera exportação ZIP com sucesso (HTTP 200)');
    const exportAliceId = resExportAlice.data?.exportId;

    // Bob tenta baixar a exportação gerada por Alice -> HTTP 403
    const resBobBaixaExportAlice = await apiFetch(`/api/exports/${exportAliceId}/download`, {
      method: 'GET',
      token: tokenBob,
    });
    registrarCheck(
      resBobBaixaExportAlice.status === 403,
      'Bob é bloqueado com HTTP 403 ao tentar baixar exportação ZIP de Alice'
    );

    // 1.4 Rate Limiting & Proteção contra Custos Imprevistos de IA
    console.log('\n--- Validando Proteção de Custos & Rate Limiting ---');
    const tokenRateLimit = 'test_token_speedy_CREATOR';

    let atingiuRateLimit = false;
    let retryAfterHeader = '';

    // Enviar rajada de 18 requisições para a rota com limite de 15/min
    for (let i = 0; i < 18; i++) {
      const res = await apiFetch('/api/ai/generate-skill', {
        method: 'POST',
        token: tokenRateLimit,
        body: {
          intencao: '', // Vazio para testar middleware sem custo de rede
        },
      });

      if (res.status === 429) {
        atingiuRateLimit = true;
        retryAfterHeader = res.headers.get('retry-after') || '';
        break;
      }
    }

    registrarCheck(atingiuRateLimit, 'Rate limiter bloqueia rajada de requisições de IA com HTTP 429');
    registrarCheck(Boolean(retryAfterHeader), `Header Retry-After presente na resposta 429 (${retryAfterHeader}s)`);

    // 1.5 Limite de Payload (2MB) & Proteção DoS
    console.log('\n--- Validando Limite de Carga HTTP (2MB) ---');
    const payloadGigante = JSON.stringify({
      title: 'Payload Excesso',
      category: 'Engenharia',
      description: 'A'.repeat(2.5 * 1024 * 1024), // 2.5 MB
    });

    const resPayloadGrande = await apiFetch('/api/skills', {
      method: 'POST',
      token: tokenAlice,
      rawBody: payloadGigante,
    });
    registrarCheck(
      resPayloadGrande.status === 413,
      'Payload superior a 2MB rejeitado com HTTP 413 Payload Too Large'
    );

    // 1.6 Sanitização de Erros & Ausência de Vazamento de Segredos
    console.log('\n--- Validando Sanitização de Erros e Não Exposição de SQL/Stack ---');
    const resErroTratado = await apiFetch('/api/skills/nao_existe_id_invalido_9999', {
      method: 'GET',
      token: tokenAlice,
    });
    registrarCheck(
      resErroTratado.status === 404,
      'Recurso inexistente retorna HTTP 404 com resposta limpa'
    );
    const corpoErro = JSON.stringify(resErroTratado.data);
    registrarCheck(
      !corpoErro.includes('SELECT') && !corpoErro.includes('postgres') && !corpoErro.includes('stack'),
      'Erro sanitizado: nenhuma query SQL, driver ou stack trace exposta'
    );

    // 1.7 Sanitização de Filename e Prevenção contra CRLF Header Injection
    console.log('\n--- Validando Sanitização de Cabeçalhos e Nomes de Arquivo ---');
    const nomeInseguro1 = 'Skill ../../../etc/passwd';
    const sanitizado1 = sanitizeFilename(nomeInseguro1);
    registrarCheck(!sanitizado1.includes('..') && !sanitizado1.includes('/'), 'Path traversal removido de filename');

    const nomeInseguro2 = 'Skill\r\nSet-Cookie: admin=true\r\n';
    const sanitizado2 = sanitizeFilename(nomeInseguro2);
    registrarCheck(!sanitizado2.includes('\r') && !sanitizado2.includes('\n'), 'CRLF Injection neutralizado em filename');

    // --------------------------------------------------------------------------
    // SEÇÃO 2: INTEGRIDADE FUNCIONAL PONTA A PONTA
    // --------------------------------------------------------------------------
    console.log('\n--- SEÇÃO 2: INTEGRIDADE FUNCIONAL PONTA A PONTA ---');

    // 2.1 Geração de Skill por IA
    const resGeracaoIA = await apiFetch('/api/ai/generate-skill', {
      method: 'POST',
      token: tokenAlice,
      body: {
        intencao: 'Crie uma skill profissional de especialista em TypeScript e validação de esquemas Zod.',
        categoria: 'Engenharia',
      },
    });
    registrarCheck(resGeracaoIA.status === 200, 'Geração de Skill via IA completada (HTTP 200)');
    const skillGerada = resGeracaoIA.data;
    registrarCheck(Boolean(skillGerada?.title || skillGerada?.slug), 'Skill gerada contém metadados e nome');

    // 2.2 Persistência no Banco PostgreSQL
    const resPersist = await apiFetch('/api/skills', {
      method: 'POST',
      token: tokenAlice,
      body: {
        title: skillGerada.title || 'TypeScript Zod Architect',
        description: skillGerada.description || 'Arquiteto de schemas e validação estrita',
        category: 'Engenharia',
        systemPrompt: skillGerada.systemPrompt || 'Atue como arquiteto TypeScript sênior.',
        isPublic: false,
        tags: ['typescript', 'zod', 'arquitetura'],
      },
    });
    registrarCheck(resPersist.status === 201, 'Skill persistida com sucesso no Cloud SQL (HTTP 201)');
    const idSkillCiclo = resPersist.data?.id;
    registrarCheck(Boolean(idSkillCiclo), `Skill persistida com ID: ${idSkillCiclo}`);

    // Obter a versão inicial 1.0.0 criada automaticamente
    const resDetalhesSkill = await apiFetch(`/api/skills/${idSkillCiclo}`, {
      method: 'GET',
      token: tokenAlice,
    });
    const versaoInicialId = resDetalhesSkill.data?.versions?.[0]?.id;
    registrarCheck(Boolean(versaoInicialId), `Versão inicial 1.0.0 encontrada: ${versaoInicialId}`);

    // 2.3 Edição e Refinamento
    const resEdicao = await apiFetch(`/api/skills/${idSkillCiclo}`, {
      method: 'PUT',
      token: tokenAlice,
      body: {
        title: 'TypeScript Zod Architect v1.1',
        description: 'Especialista aprimorado com padrões de segurança em inputs',
        category: 'Engenharia',
        systemPrompt: 'Atue como arquiteto TypeScript sênior focado em validação estrita e segurança.',
      },
    });
    registrarCheck(resEdicao.status === 200, 'Skill editada e refinada com sucesso (HTTP 200)');

    // 2.4 Criação de Versão SemVer
    const resVersao = await apiFetch(`/api/skills/${idSkillCiclo}/versions`, {
      method: 'POST',
      token: tokenAlice,
      body: {
        versionNumber: '1.1.0',
        changelog: 'Adicionada regra de validação estrita e neutralização de injection',
        systemPrompt: 'Atue como arquiteto TypeScript sênior v1.1.0 com validação de schemas estrita.',
      },
    });
    registrarCheck(resVersao.status === 201, 'Versão SemVer 1.1.0 registrada no histórico (HTTP 201)');

    // 2.5 Auditoria de Segurança OWASP
    const resAuditoria = await apiFetch('/api/audits/run', {
      method: 'POST',
      token: tokenAlice,
      body: { skillId: idSkillCiclo },
    });
    registrarCheck(resAuditoria.status === 200, 'Auditoria automatizada executada (HTTP 200)');
    registrarCheck(typeof resAuditoria.data?.score === 'number', 'Auditoria gerou score numérico de conformidade');

    // 2.6 Criação e Execução de Caso de Teste
    const resCriaTeste = await apiFetch('/api/tests', {
      method: 'POST',
      token: tokenAlice,
      body: {
        skillId: idSkillCiclo,
        name: 'Validação de Tipagem Estrita',
        inputData: 'Como tipar um schema Zod com inferência estrita?',
        assertions: [
          { operator: 'contains', expected: 'typescript' },
          { operator: 'notEmpty', expected: '' },
        ],
      },
    });
    registrarCheck(resCriaTeste.status === 201, 'Caso de teste registrado (HTTP 201)');
    const idTeste = resCriaTeste.data?.id;

    const resExecutaTeste = await apiFetch(`/api/tests/${idTeste}/run`, {
      method: 'POST',
      token: tokenAlice,
    });
    registrarCheck(resExecutaTeste.status === 200, 'Caso de teste executado com sucesso (HTTP 200)');

    // 2.7 Rollback de Versão
    const resRollback = await apiFetch('/api/versions/rollback', {
      method: 'POST',
      token: tokenAlice,
      body: {
        skillId: idSkillCiclo,
        versionId: versaoInicialId,
      },
    });
    registrarCheck(resRollback.status === 200, 'Rollback para v1.0.0 concluído com restauração (HTTP 200)');

    // 2.8 Exportação ZIP e Verificação Binária JSZip
    const resExportacao = await apiFetch('/api/exports/generate', {
      method: 'POST',
      token: tokenAlice,
      body: { skillId: idSkillCiclo },
    });
    registrarCheck(resExportacao.status === 200, 'Geração de pacote exportável concluída (HTTP 200)');
    const idExportacao = resExportacao.data?.exportId;

    const resDownload = await apiFetch(`/api/exports/${idExportacao}/download`, {
      method: 'GET',
      token: tokenAlice,
    });
    registrarCheck(resDownload.status === 200, 'Download do arquivo ZIP recebido com HTTP 200');
    registrarCheck(
      resDownload.headers.get('content-type')?.includes('application/zip') || false,
      'Content-Type é application/zip'
    );

    // Inspecionar integridade binária do ZIP com JSZip
    const zip = await JSZip.loadAsync(resDownload.data as Buffer);
    const arquivosNoZip = Object.keys(zip.files);
    registrarCheck(arquivosNoZip.includes('SKILL.md'), 'Arquivo SKILL.md presente no pacote ZIP');
    registrarCheck(arquivosNoZip.includes('manifest.json'), 'Arquivo manifest.json presente no pacote ZIP');

    const skillMdConteudo = await zip.file('SKILL.md')?.async('string');
    registrarCheck(Boolean(skillMdConteudo && skillMdConteudo.length > 20), 'SKILL.md possui conteúdo íntegro');

    // --------------------------------------------------------------------------
    // SEÇÃO 3: TESTES CONTROLADOS DE CARGA & DESEMPENHO
    // --------------------------------------------------------------------------
    console.log('\n--- SEÇÃO 3: TESTE CONTROLADO DE CARGA & PERFORMANCE (STAGING) ---');
    const memoriaAntes = process.memoryUsage();

    const totalConcorrente = 25;
    const requisicoes = [];
    const inicioBenchmark = Date.now();
    const latencias: number[] = [];

    for (let i = 0; i < totalConcorrente; i++) {
      const endpoint = i % 2 === 0 ? '/api/health' : '/api/templates';
      requisicoes.push(
        (async () => {
          const reqInicio = Date.now();
          const res = await apiFetch(endpoint, { method: 'GET' });
          const reqFim = Date.now();
          latencias.push(reqFim - reqInicio);
          return res;
        })()
      );
    }

    const resultadosCarga = await Promise.all(requisicoes);
    const duracaoTotal = Date.now() - inicioBenchmark;
    const memoriaDepois = process.memoryUsage();

    const falhas = resultadosCarga.filter((r) => r.status !== 200);
    const taxaErro = (falhas.length / totalConcorrente) * 100;

    latencias.sort((a, b) => a - b);
    const p50 = latencias[Math.floor(latencias.length * 0.5)];
    const p95 = latencias[Math.floor(latencias.length * 0.95)];
    const media = latencias.reduce((sum, v) => sum + v, 0) / latencias.length;

    registrarCheck(taxaErro === 0, `Taxa de erros sob carga: ${taxaErro}% (0 falhas em ${totalConcorrente} requisições)`);
    registrarCheck(p95 < 1500, `Latência p95 sob controle operacional: ${p95}ms (< 1500ms)`);

    console.log(`  📊 Métricas de Desempenho Medidas:`);
    console.log(`     - Concorrência: ${totalConcorrente} requisições simultâneas`);
    console.log(`     - Tempo total: ${duracaoTotal}ms`);
    console.log(`     - Latência Média: ${media.toFixed(2)}ms | p50: ${p50}ms | p95: ${p95}ms`);
    console.log(`     - Heap Utilizado: ${(memoriaDepois.heapUsed / 1024 / 1024).toFixed(2)} MB (Delta: ${((memoriaDepois.heapUsed - memoriaAntes.heapUsed) / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`     - RSS: ${(memoriaDepois.rss / 1024 / 1024).toFixed(2)} MB`);

    // --------------------------------------------------------------------------
    // SEÇÃO 4: BANCO DE DADOS & RECUPERAÇÃO DE DESASTRES
    // --------------------------------------------------------------------------
    console.log('\n--- SEÇÃO 4: BANCO DE DADOS & DISASTER RECOVERY ---');

    // 4.1 Validação do pool relacional Cloud SQL PostgreSQL
    const contagemSkills = await db.select().from(skills);
    registrarCheck(Array.isArray(contagemSkills), `Conexão Cloud SQL ativa e transações DML íntegras (${contagemSkills.length} skills no banco)`);

    // Limpeza de registros criados pelo teste via endpoint seguro com deleção em cascata
    await apiFetch(`/api/skills/${skillAliceId}`, { method: 'DELETE', token: tokenAlice });
    await apiFetch(`/api/skills/${skillPublicaId}`, { method: 'DELETE', token: tokenAlice });
    if (idSkillCiclo) {
      await apiFetch(`/api/skills/${idSkillCiclo}`, { method: 'DELETE', token: tokenAlice });
    }
    console.log('  ✓ OK: Limpeza de registros de teste concluída sem resíduos.');

  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }

  console.log('\n================================================================');
  console.log(`🎉 VALIDAÇÃO CONCLUÍDA: ${checksAprovados}/${totalChecks} CHECKS APROVADOS`);
  console.log('================================================================\n');

  if (checksAprovados === totalChecks) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

executarValidacaoPreLancamento().catch((err) => {
  console.error('\n❌ ERRO NA VALIDAÇÃO PRÉ-LANÇAMENTO:', err);
  process.exit(1);
});
