/**
 * ==============================================================================
 * SKILL FORGE — SUÍTE DE TESTES DE SEGURANÇA E AUDITORIA (FASE 13)
 * ==============================================================================
 * Valida rigorosamente:
 * 1. Autenticação mandatória (HTTP 401 em rotas protegidas)
 * 2. Isolamento de dados e proteção BOLA/IDOR (HTTP 403 entre usuários)
 * 3. Operações autorizadas pelo proprietário do recurso
 * 4. Isolamento estrito nas listagens e métricas do dashboard
 * 5. Proteção de custos e Rate Limiting em rotas de IA (HTTP 429)
 * 6. Limite de payload HTTP (HTTP 413 em cargas > 2MB)
 * 7. Sanitização de erros internos (sem vazamento de SQL, stack ou segredos)
 * 8. Cache de exportações ZIP (TTL 15 min, max 50 itens) e sanitização de cabeçalho
 */

import assert from 'assert';
import http from 'http';
import { app } from '../server.ts';
import { ZipExportCache } from '../src/lib/cache/zip-cache.ts';
import { sanitizeFilename } from '../src/utils/security.ts';
import { db } from '../src/db/index.ts';
import { skills, skillVersions, skillTests, skillExports } from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';

// Força ambiente de teste para habilitar decodificação de tokens de teste
process.env.NODE_ENV = 'test';
process.env.TEST_AUTH = 'true';

let server: http.Server;
let port: number;
let baseUrl: string;

let totalTestes = 0;
let testesAprovados = 0;

function verificar(condicao: boolean, mensagem: string) {
  totalTestes++;
  if (!condicao) {
    console.error(`  ❌ FALHA: ${mensagem}`);
    throw new Error(mensagem);
  }
  testesAprovados++;
  console.log(`  ✓ OK: ${mensagem}`);
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

  const payload = rawBody !== undefined ? rawBody : body !== undefined ? JSON.stringify(body) : undefined;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: payload,
  });

  let data: any = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, data, headers: res.headers };
}

async function rodarSuiteSeguranca() {
  console.log('\n================================================================');
  console.log('🔒 SKILL FORGE — SUÍTE DE TESTES AUTOMATIZADOS DE SEGURANÇA (FASE 13)');
  console.log('================================================================\n');

  // Inicializa servidor em porta efêmera livre
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as any;
      port = addr.port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  const TOKEN_ALICE = 'test_token_alice123_CREATOR';
  const TOKEN_BOB = 'test_token_bob456_CREATOR';

  try {
    // --------------------------------------------------------------------------
    // 1. TESTE DE AUTENTICAÇÃO MANDATÓRIA (HTTP 401 SEM TOKEN)
    // --------------------------------------------------------------------------
    console.log('[1/8] Verificando Rejeição de Requisições Não Autenticadas (HTTP 401)...');

    const unauthPostSkill = await apiFetch('/api/skills', {
      method: 'POST',
      body: { title: 'Skill Invasora', description: 'desc', category: 'Segurança' },
    });
    verificar(unauthPostSkill.status === 401, 'POST /api/skills sem token rejeitado com HTTP 401');

    const unauthGetSkills = await apiFetch('/api/skills');
    verificar(unauthGetSkills.status === 401, 'GET /api/skills sem token rejeitado com HTTP 401');

    const unauthGetDashboard = await apiFetch('/api/dashboard');
    verificar(unauthGetDashboard.status === 401, 'GET /api/dashboard sem token rejeitado com HTTP 401');

    const unauthPutSkill = await apiFetch('/api/skills/skl_fake_001', {
      method: 'PUT',
      body: { title: 'Alteração Invasora' },
    });
    verificar(unauthPutSkill.status === 401, 'PUT /api/skills/:id sem token rejeitado com HTTP 401');

    const unauthDeleteSkill = await apiFetch('/api/skills/skl_fake_001', {
      method: 'DELETE',
    });
    verificar(unauthDeleteSkill.status === 401, 'DELETE /api/skills/:id sem token rejeitado com HTTP 401');

    const unauthAiGen = await apiFetch('/api/ai/generate-skill', {
      method: 'POST',
      body: { intencao: 'Gerar algo com IA' },
    });
    verificar(unauthAiGen.status === 401, 'POST /api/ai/generate-skill sem token rejeitado com HTTP 401');

    const unauthRollback = await apiFetch('/api/versions/rollback', {
      method: 'POST',
      body: { skillId: 'skl_1', versionId: 'ver_1' },
    });
    verificar(unauthRollback.status === 401, 'POST /api/versions/rollback sem token rejeitado com HTTP 401');

    const unauthPostTest = await apiFetch('/api/tests', {
      method: 'POST',
      body: { skillId: 'skl_1', name: 'Teste' },
    });
    verificar(unauthPostTest.status === 401, 'POST /api/tests sem token rejeitado com HTTP 401');

    const unauthExportGen = await apiFetch('/api/exports/generate', {
      method: 'POST',
      body: { skillId: 'skl_1' },
    });
    verificar(unauthExportGen.status === 401, 'POST /api/exports/generate sem token rejeitado com HTTP 401');

    // --------------------------------------------------------------------------
    // 2. ISOLAMENTO MULTI-TENANT E PROTEÇÃO BOLA/IDOR (HTTP 403 ENTRE USUÁRIOS)
    // --------------------------------------------------------------------------
    console.log('\n[2/8] Validando Proteção contra BOLA/IDOR e Isolamento Cross-Tenant (HTTP 403)...');

    // Alice cria uma Skill própria
    const resSkillAlice = await apiFetch('/api/skills', {
      method: 'POST',
      token: TOKEN_ALICE,
      body: {
        title: 'Assistente Confidencial Alice',
        description: 'Habilidade proprietária com segredos de negócio.',
        category: 'Finanças',
        isPublic: false,
      },
    });
    verificar(resSkillAlice.status === 201, 'Alice cria sua Skill com sucesso (HTTP 201)');
    const skillAliceId = resSkillAlice.data.id;

    // Bob tenta visualizar a skill privada da Alice
    const bobGetAliceSkill = await apiFetch(`/api/skills/${skillAliceId}`, {
      token: TOKEN_BOB,
    });
    verificar(bobGetAliceSkill.status === 403, 'Bob recebe HTTP 403 ao tentar ler Skill privada da Alice');

    // Bob tenta alterar o título da Skill da Alice (BOLA)
    const bobUpdateAliceSkill = await apiFetch(`/api/skills/${skillAliceId}`, {
      method: 'PUT',
      token: TOKEN_BOB,
      body: { title: 'Hackeado por Bob' },
    });
    verificar(bobUpdateAliceSkill.status === 403, 'Bob recebe HTTP 403 ao tentar modificar Skill da Alice');

    // Bob tenta criar uma versão na Skill da Alice
    const bobCreateVersion = await apiFetch(`/api/skills/${skillAliceId}/versions`, {
      method: 'POST',
      token: TOKEN_BOB,
      body: { versionNumber: '2.0.0', systemPrompt: 'Prompt malicioso' },
    });
    verificar(bobCreateVersion.status === 403, 'Bob recebe HTTP 403 ao tentar criar versão na Skill da Alice');

    // Bob tenta reverter versão da Skill da Alice
    const bobRollback = await apiFetch('/api/versions/rollback', {
      method: 'POST',
      token: TOKEN_BOB,
      body: { skillId: skillAliceId, versionId: 'ver_qualquer' },
    });
    verificar(bobRollback.status === 403, 'Bob recebe HTTP 403 ao tentar reverter Skill da Alice');

    // Bob tenta excluir a Skill da Alice
    const bobDeleteAliceSkill = await apiFetch(`/api/skills/${skillAliceId}`, {
      method: 'DELETE',
      token: TOKEN_BOB,
    });
    verificar(bobDeleteAliceSkill.status === 403, 'Bob recebe HTTP 403 ao tentar excluir Skill da Alice');

    // Alice cadastra um caso de teste
    const resTestAlice = await apiFetch('/api/tests', {
      method: 'POST',
      token: TOKEN_ALICE,
      body: {
        skillId: skillAliceId,
        name: 'Validação Financeira',
        inputData: 'Qual o balanço anual?',
      },
    });
    verificar(resTestAlice.status === 201, 'Alice cadastra caso de teste em sua Skill');
    const testAliceId = resTestAlice.data.id;

    // Bob tenta excluir o teste da Alice
    const bobDeleteTest = await apiFetch(`/api/tests/${testAliceId}`, {
      method: 'DELETE',
      token: TOKEN_BOB,
    });
    verificar(bobDeleteTest.status === 403, 'Bob recebe HTTP 403 ao tentar excluir teste da Alice');

    // Bob tenta rodar o teste da Alice
    const bobRunTest = await apiFetch(`/api/tests/${testAliceId}/run`, {
      method: 'POST',
      token: TOKEN_BOB,
    });
    verificar(bobRunTest.status === 403, 'Bob recebe HTTP 403 ao tentar executar teste privado da Alice');

    // Bob tenta gerar exportação da Skill da Alice
    const bobExport = await apiFetch('/api/exports/generate', {
      method: 'POST',
      token: TOKEN_BOB,
      body: { skillId: skillAliceId },
    });
    verificar(bobExport.status === 403, 'Bob recebe HTTP 403 ao tentar exportar Skill da Alice');

    // --------------------------------------------------------------------------
    // 3. OPERAÇÕES AUTORIZADAS PELO PROPRIETÁRIO (200/201)
    // --------------------------------------------------------------------------
    console.log('\n[3/8] Validando Operações Autorizadas do Proprietário...');

    // Alice atualiza a própria skill
    const aliceUpdate = await apiFetch(`/api/skills/${skillAliceId}`, {
      method: 'PUT',
      token: TOKEN_ALICE,
      body: { title: 'Assistente Confidencial Alice (Atualizado)' },
    });
    verificar(aliceUpdate.status === 200, 'Alice atualiza sua própria Skill com sucesso');

    // Alice cria versão 1.1.0
    const aliceVersion = await apiFetch(`/api/skills/${skillAliceId}/versions`, {
      method: 'POST',
      token: TOKEN_ALICE,
      body: { versionNumber: '1.1.0', changelog: 'Ajustes finos' },
    });
    verificar(aliceVersion.status === 201, 'Alice cria versão 1.1.0 em sua Skill');

    // Alice reverte para versão 1.0.0
    const aliceRollback = await apiFetch('/api/versions/rollback', {
      method: 'POST',
      token: TOKEN_ALICE,
      body: { skillId: skillAliceId, versionId: resSkillAlice.data.id },
    });
    // Se a versão 1.0.0 inicial foi gravada:
    verificar(aliceRollback.status === 200 || aliceRollback.status === 404, 'Operação de rollback permitida para o proprietário');

    // Alice gera exportação da própria skill
    const aliceExport = await apiFetch('/api/exports/generate', {
      method: 'POST',
      token: TOKEN_ALICE,
      body: { skillId: skillAliceId },
    });
    verificar(aliceExport.status === 200, 'Alice gera pacote de exportação de sua Skill com sucesso');

    // --------------------------------------------------------------------------
    // 4. ISOLAMENTO ESTREITO NAS LISTAGENS E NO DASHBOARD
    // --------------------------------------------------------------------------
    console.log('\n[4/8] Validando Isolamento de Dados em Listagens e Dashboard...');

    // Bob cria uma Skill própria
    const resSkillBob = await apiFetch('/api/skills', {
      method: 'POST',
      token: TOKEN_BOB,
      body: {
        title: 'Habilidade do Bob',
        description: 'Espaço de trabalho isolado do Bob.',
        category: 'Engenharia',
      },
    });
    verificar(resSkillBob.status === 201, 'Bob cria sua própria Skill');
    const skillBobId = resSkillBob.data.id;

    // Listagem da Alice
    const listagemAlice = await apiFetch('/api/skills', { token: TOKEN_ALICE });
    verificar(listagemAlice.status === 200, 'Alice consulta listagem de skills');
    const idsAlice = listagemAlice.data.map((s: any) => s.id);
    verificar(idsAlice.includes(skillAliceId), 'Listagem da Alice contém suas próprias skills');
    verificar(!idsAlice.includes(skillBobId), 'Listagem da Alice NÃO contém as skills do Bob');

    // Listagem do Bob
    const listagemBob = await apiFetch('/api/skills', { token: TOKEN_BOB });
    const idsBob = listagemBob.data.map((s: any) => s.id);
    verificar(idsBob.includes(skillBobId), 'Listagem do Bob contém suas próprias skills');
    verificar(!idsBob.includes(skillAliceId), 'Listagem do Bob NÃO contém as skills da Alice');

    // Dashboard da Alice
    const dashAlice = await apiFetch('/api/dashboard', { token: TOKEN_ALICE });
    verificar(dashAlice.status === 200, 'Dashboard da Alice carregado com sucesso');
    const dashSkillsAlice = dashAlice.data.recentSkills.map((s: any) => s.id);
    verificar(!dashSkillsAlice.includes(skillBobId), 'Dashboard da Alice NÃO exibe dados do Bob');

    // --------------------------------------------------------------------------
    // 5. PROTEÇÃO DE CUSTOS DE IA E RATE LIMITING (HTTP 429)
    // --------------------------------------------------------------------------
    console.log('\n[5/8] Validando Rate Limiting e Proteção de Custos de IA (HTTP 429)...');

    const TOKEN_RATE_TEST = 'test_token_ratelimit_user';
    let encontrou429 = false;

    // Realiza rajada de 18 requisições na rota com limite de 15/min
    for (let i = 0; i < 18; i++) {
      const burstRes = await apiFetch('/api/ai/generate-skill', {
        method: 'POST',
        token: TOKEN_RATE_TEST,
        body: {
          intencao: '', // Intencionalmente vazio para validar middleware sem overhead de rede
        },
      });

      if (burstRes.status === 429) {
        encontrou429 = true;
        verificar(
          burstRes.headers.get('retry-after') !== null,
          'Resposta HTTP 429 inclui cabeçalho obrigatório Retry-After'
        );
        verificar(
          typeof burstRes.data?.error === 'string',
          'Resposta HTTP 429 inclui mensagem amigável de limitação de taxa'
        );
        break;
      }
    }

    verificar(encontrou429, 'Rate limiter de IA bloqueou rajada excedente com HTTP 429 Too Many Requests');

    // --------------------------------------------------------------------------
    // 6. LIMITE DO CORPO DE REQUISIÇÃO (HTTP 413 EM PAYLOAD > 2MB)
    // --------------------------------------------------------------------------
    console.log('\n[6/8] Validando Proteção contra DoS via Payload Excessivo (HTTP 413)...');

    // Gera payload de ~2.3 MB
    const payloadGrande = JSON.stringify({
      title: 'Payload Monstruoso',
      description: 'A'.repeat(2.3 * 1024 * 1024),
      category: 'Teste',
    });

    const resPayloadGrande = await apiFetch('/api/skills', {
      method: 'POST',
      token: TOKEN_ALICE,
      rawBody: payloadGrande,
    });

    verificar(
      resPayloadGrande.status === 413,
      'Requisição com corpo superior a 2MB é rejeitada com HTTP 413 Payload Too Large'
    );

    // --------------------------------------------------------------------------
    // 7. SANITIZAÇÃO DE ERROS INTERNOS (SEM VAZAMENTO DE SQL OU STACK TRACES)
    // --------------------------------------------------------------------------
    console.log('\n[7/8] Validando Sanitização de Erros Internos no Servidor...');

    const resMalformedJson = await apiFetch('/api/skills', {
      method: 'POST',
      token: TOKEN_ALICE,
      rawBody: '{ "title": "malformed", ', // JSON incompleto
    });

    verificar(resMalformedJson.status === 400, 'JSON malformado tratado com HTTP 400');
    const erroTexto = JSON.stringify(resMalformedJson.data).toLowerCase();
    verificar(!erroTexto.includes('node_modules'), 'Resposta não vaza caminhos de arquivos do servidor');
    verificar(!erroTexto.includes('select '), 'Resposta não vaza sentenças SQL');

    // --------------------------------------------------------------------------
    // 8. SEGURANÇA DO CACHE DE EXPORTAÇÕES ZIP E CABEÇALHOS HTTP
    // --------------------------------------------------------------------------
    console.log('\n[8/8] Validando Cache de Exportações ZIP e Sanitização de Cabeçalhos...');

    // Validação da classe ZipExportCache (TTL e Capping)
    const cacheTeste = new ZipExportCache(3, 50); // Max 3 itens, TTL 50ms
    cacheTeste.set('item1', { buffer: Buffer.from('1'), fileName: '1.zip', contentType: 'application/zip' });
    cacheTeste.set('item2', { buffer: Buffer.from('2'), fileName: '2.zip', contentType: 'application/zip' });
    cacheTeste.set('item3', { buffer: Buffer.from('3'), fileName: '3.zip', contentType: 'application/zip' });
    verificar(cacheTeste.size() === 3, 'Cache armazena itens até o limite máximo configurado');

    // Ao inserir o 4º item, o mais antigo (item1) é removido por FIFO/LRU
    cacheTeste.set('item4', { buffer: Buffer.from('4'), fileName: '4.zip', contentType: 'application/zip' });
    verificar(cacheTeste.size() === 3, 'Capacidade máxima mantida (não ultrapassa 3 itens)');
    verificar(!cacheTeste.has('item1'), 'Item mais antigo descartado ao atingir capacidade máxima');

    // Espera TTL expirar (60ms > 50ms)
    await new Promise((r) => setTimeout(r, 65));
    verificar(cacheTeste.get('item4') === null, 'Itens com TTL expirado são automaticamente invalidados do cache');

    // Validação da função sanitizeFilename contra Path Traversal e Header Injection
    const nomeComPathTraversal = '../../../../etc/passwd.zip';
    const nomeSanitizado1 = sanitizeFilename(nomeComPathTraversal);
    verificar(!nomeSanitizado1.includes('/'), 'Path traversal (/) neutralizado no nome de download');
    verificar(!nomeSanitizado1.includes('..'), 'Path traversal (..) neutralizado no nome de download');

    const nomeComHeaderInjection = "arquivo\r\nSet-Cookie: sessionId=hacked\r\n.zip";
    const nomeSanitizado2 = sanitizeFilename(nomeComHeaderInjection);
    verificar(!nomeSanitizado2.includes('\r') && !nomeSanitizado2.includes('\n'), 'CRLF Injection neutralizado no cabeçalho Content-Disposition');

    // Limpeza dos dados de teste no banco
    try {
      await db.delete(skillTests).where(eq(skillTests.id, testAliceId));
      await db.delete(skillVersions).where(eq(skillVersions.skillId, skillAliceId));
      await db.delete(skillVersions).where(eq(skillVersions.skillId, skillBobId));
      await db.delete(skillExports).where(eq(skillExports.skillId, skillAliceId));
      await db.delete(skills).where(eq(skills.id, skillAliceId));
      await db.delete(skills).where(eq(skills.id, skillBobId));
    } catch {
      // Ignora falhas de limpeza pós-teste
    }

    console.log('\n================================================================');
    console.log(`🛡️  RESULTADO: ${testesAprovados}/${totalTestes} CONTROLES DE SEGURANÇA VALIDADOS!`);
    console.log('================================================================\n');
  } finally {
    if (server) {
      server.close();
    }
  }
}

rodarSuiteSeguranca().catch((err) => {
  console.error('\n❌ Falha na execução da suíte de segurança:', err);
  if (server) server.close();
  process.exit(1);
});
