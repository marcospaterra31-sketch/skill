# SKILL FORGE — Plataforma de Engenharia de Skills para IA

**Skill Forge** é uma plataforma profissional SaaS para arquitetura, criação, teste, auditoria de segurança, versionamento e exportação de Skills para Agentes e Modelos de Inteligência Artificial.

- ✅ **FASE 0 (Fundação Técnica):** Concluída com sucesso.
- ✅ **FASE 1 (Autenticação + Banco Relacional):** Concluída com sucesso.
- ✅ **FASE 2 (Dashboard Real):** Concluída com sucesso.
- ✅ **FASE 3 (Criador de Skills):** Concluída com sucesso.
- ✅ **FASE 4 (Motor de IA & Gerador Estruturado):** Concluída com sucesso.
- ✅ **FASE 5 (Editor de Skills & SemVer IDE):** Concluída com sucesso.
- ✅ **FASE 6 (Versionamento & Linha do Tempo SemVer):** Concluída com sucesso.
- ✅ **FASE 7 (Laboratório de Testes & Asserções Automatizadas):** Concluída com sucesso.

---

## 🗄️ Infraestrutura de Dados & Autenticação (Fase 1)

- **Banco de Dados Relacional:** PostgreSQL 16 provisionado via **Google Cloud SQL** na região `us-west2` (Instância: `ai-studio-871446b2`).
- **ORM & Migrações:** Drizzle ORM (`drizzle-orm` + `drizzle-kit`), gerenciando 10 tabelas relacionais com chaves estrangeiras, índices e pool de conexões com o driver `pg`.
- **Autenticação Federada:** Google Sign-In integrado via **Firebase Authentication** (`firebase` Client SDK no frontend + `firebase-admin` no backend Express).
- **Servidor Full-Stack (`server.ts`):** Express integrado ao Vite com middleware `requireAuth` para validação de tokens JWT Bearer e endpoints REST `/api/auth/sync`, `/api/skills`, `/api/metrics` e `/api/templates`.
- **Sincronização Atômica de Usuários:** Helper `getOrCreateUser` com upsert idempotente para criação e vinculação do perfil do Google com a tabela relacional `users` e `workspaces`.

---

## 🧠 Motor de IA & Síntese Estruturada de Skills (Fase 4)

- **Provedor Primário:** Integração com o SDK oficial `@google/genai` utilizando o modelo `gemini-2.5-flash` para arquitetura de prompts e extração com schema JSON estrito.
- **Camada Multi-Provedor Desacoplada:** Interface unificada `ProvedorDeIA` com implementações completas para `GeminiProvider`, `ClaudeProvider` e `OpenAIProvider`, orquestradas pela `FabricaProvedorIA`.
- **Endpoint de Síntese Inteligente:** `POST /api/ai/generate-skill` sintetiza:
  - Título canônico e slug normalizado.
  - Categoria, persona e público-alvo recomendado.
  - Prompt de sistema com princípios de atuação técnica e regras operacionais.
  - Instruções de uso passo a passo para o agente.
  - Guardrails e restrições negativas de segurança.
  - Tags de indexação e especificação de formato-alvo (Claude Skill, OpenAI Assistant, Gemini System Instructions, Cursor Rule).
  - Caso de teste inicial para validação no Laboratório de Testes.
- **Modal Interativo no Frontend (`GeradorComIAModal`):**
  - Chips de sugestão de intenção rápida (Engenharia TypeScript/DDD, Auditoria Solidity, SRE Kubernetes, Especialista em SQL).
  - Seletor de modelo/provedor (Gemini 2.5 Flash, Claude 3.5 Sonnet, GPT-4o).
  - Feedback em tempo real com estágios de sintetização.
  - Pré-visualização com abas ("Identidade", "Prompts & Regras", "JSON Completo").
  - Aplicação com 1 clique diretamente no Wizard de Criação da Skill (`SkillCreateView`).

---

## 💻 Editor de Skills & SemVer IDE (Fase 5)

- **Layout de IDE de Alta Densidade (`SkillEditorView.tsx`):**
  - Seletor rápido de skills e transição direta a partir do Dashboard e da Lista de Skills.
  - Alternador dinâmico de status (`DRAFT`, `REVIEW`, `PUBLISHED`, `ARCHIVED`) com persistência imediata.
  - Indicador de alterações não salvas com suporte a atalhos de teclado (`Ctrl+S` / `Cmd+S`).
  - Abas de navegação especializadas:
    - **Prompts & Instruções:** Editor com contador de caracteres, estimativa em tempo real de tokens e cópia rápida.
    - **Parâmetros & Ferramentas:** Editor JSON com validação sintática e botão de autoformatação.
    - **Identidade & Metadados:** Gestão de slug, categoria, tags dinâmicas e público-alvo.
    - **Histórico de Versões:** Linha do tempo dos snapshots gravados no PostgreSQL com changelogs e restauração em 1 clique.
- **Lançador de Releases SemVer (`ReleaseModal.tsx`):**
  - Cálculo automático de versões semânticas (PATCH, MINOR, MAJOR ou personalizado).
  - Campo de changelog para registrar notas de lançamento de cada snapshot imutável.
- **Visualizador Granular de Diffs (`DiffViewerModal.tsx`):**
  - Comparação lado a lado / unificada entre o rascunho ativo e qualquer versão anterior.
  - Destaque sintático de linhas adicionadas (verde), removidas (vermelho) e inalteradas, com contadores de linhas e botão de reversão.
- **Simulador de Inferência em Tempo Real (`SimuladorModal.tsx`):**
  - Teste do prompt ativo diretamente no editor via `@google/genai` (Gemini 2.5 Flash), Claude ou GPT-4o.
  - Medição de tempo de resposta (latência em ms) e consumo granular de tokens (prompt, completion e total).
- **Novos Endpoints REST (`server.ts`):**
  - `PUT /api/skills/:id`: Atualização atômica de metadados e snapshot ativo.
  - `POST /api/skills/:id/versions`: Criação de novo release SemVer imutável.
  - `POST /api/skills/:id/duplicate`: Duplicação e clonagem de skill existente.
  - `DELETE /api/skills/:id`: Remoção segura em cascata de dependências e registros.
  - `POST /api/skills/:id/simulate`: Execução de inferência rápida com cálculo de latência e tokens.

---

## 🏷️ Versionamento SemVer & Linha do Tempo (Fase 6)

- **Central de Versionamento (`VersoesView.tsx`):**
  - **Telemetria de Releases:** Indicadores em tempo real de total de snapshots, skills com múltiplos releases e último release publicado no Cloud SQL.
  - **Validador SemVer 2.0 Interativo:** Testador instantâneo com verificação de conformidade sintática SemVer (Major.Minor.Patch e pre-releases).
  - **Filtros Avançados:** Segmentação por Skill específica, tipo de incremento SemVer (Major, Minor, Patch) e busca textual por notas de release ou título.
  - **Linha do Tempo Visual Estilo Git:**
    - Nós verticais de release com destaque para versão ativa de produção.
    - Metadados completos com data formatada, ID único e autor.
    - Changelog documentado por release com resumo de tokens e caracteres.
    - Ações em 1 clique: Inspecionar Snapshot, Comparar Diffs, Reverter Versão e Abrir no Editor.
- **Gerador de Changelog com IA (`/api/versions/generate-changelog`):**
  - Sintetiza notas de atualização concisas e padronizadas em Markdown analisando diferenças entre o prompt anterior e o novo prompt via `@google/genai`.
- **Mecanismo de Rollback Seguro (`/api/versions/rollback`):**
  - Reversão atômica da versão de produção para qualquer snapshot anterior no PostgreSQL com notificação em tempo real.

---

## 🧪 Laboratório de Testes & Asserções Automatizadas (Fase 7)

- **Ambiente de Testes Contínuos (`LaboratorioView.tsx`):**
  - **Métricas Operacionais:** Casos de teste totais, taxa de aprovação percentual (`%`), latência média real em milissegundos e consumo aproximado de tokens.
  - **Filtros por Escopo:** Segmentação de testes por Skill alvo e por estado (`PASSED`, `FAILED`, `PENDENTE`).
  - **Execução em Lote e Individual:** Disparo de suíte completa (`POST /api/skills/:skillId/run-all-tests`) ou execução isolada de caso de teste com medição de latência em tempo real.
- **Configurador de Casos de Teste (`NovoTesteModal.tsx`):**
  - Definição de estímulo / input de usuário para a skill.
  - Regras de asserção configuráveis:
    - `CONTAINS`: A resposta deve conter o termo obrigatório.
    - `NOT_CONTAINS`: A resposta não pode conter termos proibidos (validação estrita de guardrails de segurança).
    - `REGEX`: Validação sintática por expressão regular.
    - `MAX_LATENCY_MS`: SLA de tempo máximo de resposta tolerado.
    - `NOT_EMPTY` & `EQUALS`: Validações de completude e paridade exata.
- **Inspetor de Resultados e Diagnóstico (`DetalhesResultadoModal.tsx`):**
  - Exibição de pontuação de aprovação (0 a 100%), latência medida, tokens utilizados e timestamp.
  - Detalhamento de cada asserção executada (indicador verde de sucesso ou vermelho de falha com justificativa técnica).
  - Visualização completa da entrada e da saída gerada pelo modelo de IA.
- **Persistência Relacional no Cloud SQL:**
  - `skill_tests`: Casos de teste modelados com regras de asserção em JSONB.
  - `skill_test_results`: Histórico completo de execuções com scores, latência e diagnóstico de asserções.

---

## 🚀 Tecnologias Utilizadas

- **Framework & Runtime:** React 19, TypeScript, Vite
- **Estilização & Design System:** Tailwind CSS v4, Tokens próprios, Variáveis CSS Dark Theme
- **Componentes:** Componentes base acessíveis (Button, Input, Textarea, Select, Checkbox, Switch, Dialog, Card, Badge, Tabs, DropdownMenu, Table, Progress, Alert, Toast, EmptyState, LoadingSpinner, ErrorDisplay)
- **Persistência & ORM:** PostgreSQL configurado via Prisma (`prisma/schema.prisma` com 10 entidades)
- **Abstração de IA:** Camada desacoplada `ProvedorDeIA` com suporte arquitetado para **Google Gemini** (`@google/genai`), **Anthropic Claude** e **OpenAI**
- **Ícones & Animações:** Lucide React, Motion
- **Qualidade & Validação:** TypeScript rigoroso, Suíte de Testes Automatizada

---

## 📁 Estrutura de Arquivos

```text
skill-forge/
├── prisma/
│   └── schema.prisma            # Modelagem PostgreSQL (User, Workspace, Skill, Versões, etc.)
│
├── src/
│   ├── components/
│   │   ├── layout/              # Sidebar, TopBar, AppLayout
│   │   └── ui/                  # 18 Componentes base reutilizáveis (shadcn style)
│   │
│   ├── features/
│   │   ├── dashboard/           # Dashboard inicial com métricas e estado vazio
│   │   ├── skills/              # Lista de Skills e Criador da Fundação
│   │   ├── modelos/             # Catálogo de templates de Skills
│   │   ├── testes/              # Laboratório de testes e asserções
│   │   ├── auditoria/           # Auditor de segurança e conformidade
│   │   ├── versoes/             # Versionador SemVer
│   │   ├── exportacoes/         # Formatos de exportação (ZIP, Claude, OpenAI, Gemini)
│   │   ├── configuracoes/       # Configuração de IA e Workspace
│   │   └── landing/             # Landing page institucional
│   │
│   ├── lib/
│   │   ├── ia/                  # Abstração ProvedorDeIA, Gemini, Claude, OpenAI, Factory
│   │   ├── banco/               # Repositório de dados tipado e templates iniciais
│   │   ├── autenticacao/        # Serviço de Sessão e RBAC (UserRole)
│   │   ├── armazenamento/       # Provedor de storage e empacotamento
│   │   ├── validacao/           # Validadores de Skill, SemVer e formatos
│   │   └── erros/               # Hierarquia de erros e normalização PT-BR
│   │
│   ├── services/
│   │   ├── skills/              # Camada de negócios de Skills
│   │   ├── ia/                  # Serviço de inferência e provedores
│   │   ├── testes/              # Serviço do laboratório de testes
│   │   ├── auditoria/           # Serviço de auditoria
│   │   ├── versoes/             # Serviço de versionamento
│   │   └── exportacoes/         # Serviço de empacotamento
│   │
│   ├── types/                   # Tipagem unificada do domínio
│   ├── utils/                   # Utilitários (cn com clsx + tailwind-merge)
│   ├── App.tsx                  # Roteador mestre e orquestrador de visões
│   ├── index.css                # Tokens visuais e estilos base
│   └── main.tsx                 # Ponto de entrada React
│
├── tests/
│   └── foundation.test.ts       # Testes unitários e de integração da Fase 0
│
├── .env.example                 # Modelo seguro de variáveis de ambiente
├── metadata.json                # Metadados da aplicação AI Studio
└── package.json                 # Dependências e scripts
```

---

## 🛠️ Comandos para Executar

### 1. Instalar Dependências
```bash
npm install
```

### 2. Executar em Desenvolvimento (Porta 3000)
```bash
npm run dev
```

### 3. Executar Suíte de Testes da Fundação
```bash
npm test
```

### 4. Validação de Tipagem (Lint)
```bash
npm run lint
```

### 5. Compilação para Produção (Build)
```bash
npm run build
```

---

## 🔒 Variáveis de Ambiente (`.env.example`)

Copie o arquivo `.env.example` para `.env` e configure suas variáveis:

```env
# Database / PostgreSQL & Prisma
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/skillforge?schema=public"

# AI Providers
GEMINI_API_KEY="SUA_CHAVE_GEMINI"
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Configurações de Sessão e Servidor
DEFAULT_AI_PROVIDER="gemini"
AUTH_SECRET="segredo-de-32-caracteres"
PORT="3000"
```

---

## 🎯 Critérios de Conclusão da FASE 0

- [x] Projeto inicia e compila sem advertências
- [x] TypeScript em modo estrito configurado
- [x] Tailwind CSS v4 configurado com tokens
- [x] 18 componentes base criados, responsivos e acessíveis
- [x] Layout principal com Sidebar e TopBar responsivos
- [x] Roteamento funcional (`/`, `/dashboard`, `/skills`, `/skills/nova`, `/modelos`, etc.)
- [x] Prisma ORM configurado com 10 entidades (`prisma/schema.prisma`)
- [x] Camada de abstração de IA multi-provedor (Gemini, Claude, OpenAI)
- [x] Camada de serviços desacoplada (`Interface -> Service -> Database`)
- [x] Tratamento global de erros em Português do Brasil
- [x] Testes automatizados passando (`npm test`)
- [x] Build de produção passando (`npm run build`)
- [x] Lint passando (`npm run lint`)
