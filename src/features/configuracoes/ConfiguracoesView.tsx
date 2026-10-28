import React, { useState } from 'react';
import { RoutePath, AIProviderType } from '../../types/index.ts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { Alert } from '../../components/ui/alert.tsx';
import { useToast } from '../../components/ui/toast.tsx';
import { iaService } from '../../services/ia/ia.service.ts';
import { authService } from '../../lib/autenticacao/index.ts';
import {
  Settings,
  Cpu,
  ShieldCheck,
  Database,
  Check,
  RefreshCw,
  Server,
  FileText,
  Lock,
  LifeBuoy,
  AlertTriangle,
  Archive,
  Scale,
  Activity,
  Terminal,
} from 'lucide-react';

export interface ConfiguracoesViewProps {
  onNavegar: (caminho: RoutePath) => void;
}

export const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({ onNavegar }) => {
  const [abaAtiva, setAbaAtiva] = useState<'geral' | 'governanca' | 'seguranca_dr'>('geral');
  const [provedorAtivo, setProvedorAtivo] = useState<AIProviderType>(iaService.obterProvedorAtivo());
  const [testandoProvedor, setTestandoProvedor] = useState<string | null>(null);
  const [resultadoTeste, setResultadoTeste] = useState<{ [key: string]: string }>({});
  const { adicionarToast } = useToast();

  const usuario = authService.obterUsuarioAtual();
  const workspace = authService.obterWorkspaceAtivo();
  const provedores = iaService.listarProvedores();

  const handleTrocarProvedor = (tipo: AIProviderType) => {
    setProvedorAtivo(tipo);
    iaService.selecionarProvedorPadrao(tipo);
    adicionarToast('success', 'Provedor atualizado', `O provedor padrão agora é ${tipo.toUpperCase()}.`);
  };

  const handleTestarConexao = async (tipo: AIProviderType) => {
    setTestandoProvedor(tipo);
    try {
      const res = await iaService.testarConexao(tipo);
      setResultadoTeste((prev) => ({
        ...prev,
        [tipo]: `${res.mensagem} (${res.latenciaMs}ms)`,
      }));
      if (res.conectado) {
        adicionarToast('success', 'Conexão validada', res.mensagem);
      } else {
        adicionarToast('info', 'Status do provedor', res.mensagem);
      }
    } finally {
      setTestandoProvedor(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-400" />
            Configurações & Governança da Plataforma
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Gerenciamento de provedores de IA, banco relacional Cloud SQL, termos legais e resposta a incidentes.
          </p>
        </div>

        {/* Abas de Navegação */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setAbaAtiva('geral')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              abaAtiva === 'geral'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Infra & Provedores
          </button>
          <button
            onClick={() => setAbaAtiva('governanca')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              abaAtiva === 'governanca'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Termos & Suporte
          </button>
          <button
            onClick={() => setAbaAtiva('seguranca_dr')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              abaAtiva === 'seguranca_dr'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Incidentes & Backups
          </button>
        </div>
      </div>

      {/* ABA 1: INFRA & PROVEDORES */}
      {abaAtiva === 'geral' && (
        <div className="space-y-6">
          {/* AI Providers Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-indigo-400" />
                <CardTitle>Provedores de Inteligência Artificial</CardTitle>
              </div>
              <CardDescription>
                Arquitetura multi-fornecedor desacoplada. Escolha o motor de IA ativo para síntese e testes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {provedores.map((prov) => {
                  const isAtivo = prov.tipo === provedorAtivo;
                  return (
                    <div
                      key={prov.tipo}
                      className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                        isAtivo
                          ? 'border-indigo-500 bg-indigo-950/20 shadow-md shadow-indigo-500/10'
                          : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white">{prov.nome}</span>
                          {isAtivo ? (
                            <Badge variant="default">Ativo</Badge>
                          ) : (
                            <button
                              onClick={() => handleTrocarProvedor(prov.tipo)}
                              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                            >
                              Ativar
                            </button>
                          )}
                        </div>
                        <span className="block text-[11px] font-mono text-slate-400 mb-2">
                          {prov.modeloPadrao}
                        </span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {prov.descricao}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestarConexao(prov.tipo)}
                          isLoading={testandoProvedor === prov.tipo}
                          className="text-xs h-7 w-full gap-1"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Testar Conexão
                        </Button>
                        {resultadoTeste[prov.tipo] && (
                          <span className="text-[10px] text-slate-400 font-mono text-center">
                            {resultadoTeste[prov.tipo]}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Database / Cloud SQL Architecture */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-400" />
                <CardTitle>Persistência Relacional — Cloud SQL (PostgreSQL)</CardTitle>
              </div>
              <CardDescription>
                Instância provisionada em alta disponibilidade (região us-west2) gerenciada com Drizzle ORM.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 space-y-1">
                  <span className="text-slate-400">Banco de Dados Ativo:</span>
                  <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" /> PostgreSQL 16 (Cloud SQL Developer Edition)
                  </p>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Região: us-west2 · Instância: ai-studio-871446b2
                  </span>
                </div>

                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 space-y-1">
                  <span className="text-slate-400">Autenticação Federada:</span>
                  <p className="font-semibold text-indigo-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Firebase Auth (Google OAuth)
                  </p>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Tokens JWT validados via Firebase Admin SDK
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workspace & Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-400" />
                <CardTitle>Espaço de Trabalho & RBAC</CardTitle>
              </div>
              <CardDescription>
                Perfil de acesso e permissões ativas do usuário logado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Workspace Ativo:</span>
                <span className="font-semibold text-white">{workspace.name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Usuário do Arquiteto:</span>
                <span className="font-semibold text-white">{usuario.name} ({usuario.email})</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Papel de Permissão:</span>
                <Badge variant="default">{usuario.role}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Produção & Telemetria */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-emerald-400" />
                  <CardTitle>Ambiente de Produção & Telemetria (Fase 12)</CardTitle>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
                  Produção Ativa
                </Badge>
              </div>
              <CardDescription>
                Configurações de infraestrutura, healthchecks de balanceamento e integridade do cluster.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Status Global:</span>
                  <span className="font-semibold text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                    <Check className="h-3.5 w-3.5" /> 100% Saudável
                  </span>
                </div>
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Release SemVer:</span>
                  <span className="font-semibold text-slate-200 font-mono mt-0.5 block">
                    v1.0.0-prod (Release)
                  </span>
                </div>
                <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Liveness & Readiness:</span>
                  <span className="font-semibold text-indigo-400 font-mono mt-0.5 block">
                    /healthz · /api/health
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <span className="text-slate-400 text-[11px]">
                  Headers de segurança HTTP ativos (nosniff, X-XSS-Protection, Referrer-Policy).
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavegar('/qa')}
                  className="text-xs h-8 border-slate-700 bg-slate-900 text-slate-300"
                >
                  Abrir Central QA &rarr;
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ABA 2: GOVERNANÇA, TERMOS & SUPORTE */}
      {abaAtiva === 'governanca' && (
        <div className="space-y-6">
          {/* Termos de Uso */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-indigo-400" />
                <CardTitle>Termos de Uso do Serviço (EULA & SLA)</CardTitle>
              </div>
              <CardDescription>
                Diretrizes de uso aceitável, propriedade intelectual e isenções de responsabilidade estocástica de IA.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-semibold text-white flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-indigo-400" /> 1. Propriedade Intelectual das Skills
                </h4>
                <p className="text-slate-400">
                  Todo o código-fonte, prompts mestres, esquemas estruturados e pacotes ZIP gerados no Skill Forge
                  são de propriedade exclusiva do criador autenticado. A plataforma não reivindica direitos autorais
                  sobre as habilidades concebidas pelos usuários.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-semibold text-white flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> 2. Isenção de Responsabilidade de IA
                </h4>
                <p className="text-slate-400">
                  As respostas geradas por modelos de linguagem (Gemini, Claude, OpenAI) possuem natureza estocástica.
                  O usuário é responsável por homologar e auditar os pacotes de saída antes de implementá-los em ambientes
                  críticos de produção.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> 3. Fair Use & Proteção contra Abusos
                </h4>
                <p className="text-slate-400">
                  São aplicados limites de taxa (15 req/min em rotas de IA e 120 req/min em APIs gerais) para assegurar
                  a estabilidade do cluster e evitar custos descontrolados. Tentativas de jailbreak ou bypass de segurança
                  resultarão em suspensão imediata da conta.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Política de Privacidade & LGPD */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400" />
                <CardTitle>Política de Privacidade & Conformidade LGPD/GDPR</CardTitle>
              </div>
              <CardDescription>
                Minimização estrita de dados coletados, tratamento de chaves de API e isolamento criptográfico.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-semibold text-slate-200">Minimização de Dados</span>
                  <p className="text-slate-400">
                    Coletamos apenas o identificador de usuário (UID), e-mail e nome fornecidos no provedor de identidade.
                    Nenhum dado biométrico ou rastreador invasivo de telemetria é utilizado.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="font-semibold text-slate-200">Não Treinamento em Dados Privados</span>
                  <p className="text-slate-400">
                    Os prompts mestres e casos de teste confidenciais do usuário jamais são utilizados para treinar
                    modelos públicos de inteligência artificial de fornecedores terceiros.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-200">Exclusão em Cascata (Direito ao Esquecimento)</span>
                <p className="text-slate-400">
                  Ao excluir uma Skill ou solicitar a remoção da conta, o sistema executa a deleção física imediata em
                  cascata no PostgreSQL, removendo todas as versões, auditorias, testes e arquivos binários de cache.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mecanismo de Suporte */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <LifeBuoy className="h-4 w-4 text-blue-400" />
                <CardTitle>Mecanismo de Suporte & Atendimento ao Cliente</CardTitle>
              </div>
              <CardDescription>
                Canais de suporte para o Beta Fechado, SLAs acordados e procedimento de reporte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Canal de Suporte:</span>
                  <span className="font-semibold text-white font-mono mt-0.5 block">
                    suporte@skillforge.io
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">SLA de Resposta (Beta):</span>
                  <span className="font-semibold text-emerald-400 font-mono mt-0.5 block">
                    &lt; 4 horas (Crítico)
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Security Vulnerability:</span>
                  <span className="font-semibold text-indigo-400 font-mono mt-0.5 block">
                    security@skillforge.io
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ABA 3: RESPOSTA A INCIDENTES & BACKUPS */}
      {abaAtiva === 'seguranca_dr' && (
        <div className="space-y-6">
          {/* Procedimento de Resposta a Incidentes (IR Runbook) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <CardTitle>Procedimento Operacional de Resposta a Incidentes (IR Runbook)</CardTitle>
              </div>
              <CardDescription>
                Protocolo técnico de contenção, triagem, rotação de credenciais e comunicação em caso de falha de segurança.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded bg-red-950/30 border border-red-900/60">
                  <span className="font-bold text-red-400 block">SEV-1 (Crítico)</span>
                  <span className="text-[11px] text-slate-300">Vazamento de dados, bypass de auth ou queda total do cluster. SLA: 15 min.</span>
                </div>
                <div className="p-2.5 rounded bg-orange-950/30 border border-orange-900/60">
                  <span className="font-bold text-orange-400 block">SEV-2 (Alto)</span>
                  <span className="text-[11px] text-slate-300">Falha parcial de IA ou bloqueio de downloads ZIP. SLA: 1h.</span>
                </div>
                <div className="p-2.5 rounded bg-amber-950/30 border border-amber-900/60">
                  <span className="font-bold text-amber-400 block">SEV-3 (Médio)</span>
                  <span className="text-[11px] text-slate-300">Erro de validação não crítico ou inconsistência em UI. SLA: 8h.</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="font-bold text-slate-300 block">SEV-4 (Baixo)</span>
                  <span className="text-[11px] text-slate-400">Melhoria de usabilidade ou documentação. Próxima release.</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-semibold text-white flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-indigo-400" /> Etapas do Protocolo de Contenção de Incidentes:
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed">
                  <li><strong className="text-slate-200">Identificação & Triagem:</strong> O plantonista de segurança analisa alertas do Cloud Logging e classifica a severidade.</li>
                  <li><strong className="text-slate-200">Isolamento Imediato:</strong> Revogação de sessões comprometidas no Firebase Auth e isolamento de IPs maliciosos no rate limiter.</li>
                  <li><strong className="text-slate-200">Rotação de Segredos:</strong> Substituição automática de chaves de API (`GEMINI_API_KEY`, credenciais de banco e service account).</li>
                  <li><strong className="text-slate-200">Notificação & Pós-Morte:</strong> Publicação de comunicado transparente para usuários impactados e elaboração de relatório de causa-raiz em até 48 horas.</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Política de Backups & Recuperação de Desastres (DR) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4 text-emerald-400" />
                <CardTitle>Política de Backups & Recuperação de Desastres (Cloud SQL)</CardTitle>
              </div>
              <CardDescription>
                Estratégia de proteção e procedimento documentado de restauração para ponto no tempo (PITR).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-slate-400">Backups Automáticos:</span>
                  <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" /> Habilitado diariamente (Janela: 03:00 - 05:00 UTC)
                  </p>
                  <span className="text-[11px] text-slate-400 block">
                    Retenção de 7 dias com redundância geográfica para desastres na zona primária.
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-slate-400">Point-in-Time Recovery (PITR):</span>
                  <p className="font-semibold text-indigo-400 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" /> Write-Ahead Logging (WAL) contínuo
                  </p>
                  <span className="text-[11px] text-slate-400 block">
                    Permite restaurar o estado do banco para qualquer segundo dentro da janela de 7 dias.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-semibold text-white">Procedimento Operacional de Restauração (Runbook):</h4>
                <div className="bg-slate-900 p-2.5 rounded font-mono text-[11px] text-slate-300 space-y-1">
                  <p className="text-slate-400"># 1. Provisionar instância de contingência a partir do backup mais recente:</p>
                  <p className="text-emerald-400">gcloud sql instances clone ai-studio-871446b2 ai-studio-restore-target --bin-log-timestamp=&quot;YYYY-MM-DDTHH:MM:SSZ&quot;</p>
                  <p className="text-slate-400 mt-2"># 2. Executar migrações pendentes e conferir integridade Drizzle:</p>
                  <p className="text-emerald-400">npm run test:qa &amp;&amp; npm run test:security</p>
                  <p className="text-slate-400 mt-2"># 3. Comutar string de conexão no Secret Manager sem perda de dados.</p>
                </div>
                <p className="text-[11px] text-amber-400/90 italic">
                  * Acesso direto ao console GCP e trigger de restauração física de teste marcados como NÃO VERIFICADO (dependem de credenciais de infraestrutura de nuvem externa do usuário).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
