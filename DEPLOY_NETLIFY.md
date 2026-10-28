# 🚀 GUIA OFICIAL DE DEPLOY NO NETLIFY — SKILL FORGE

Este guia detalha o processo completo para colocar o **Skill Forge** em produção no **Netlify**, aproveitando a infraestrutura global de CDN para o frontend React 19 / Vite e a arquitetura Serverless (Netlify Functions) para as rotas de API Express conectadas ao PostgreSQL (Cloud SQL) e à IA (Google Gemini).

---

## 📋 Pré-requisitos
- Conta ativa no [Netlify](https://www.netlify.com).
- Repositório Git (GitHub, GitLab ou Bitbucket) com o código do projeto **OU** Netlify CLI instalado localmente.
- Variáveis de ambiente configuradas no painel do Netlify.

---

## 🛠️ Configurações Já Integradas no Repositório

O projeto já inclui todos os arquivos de configuração necessários:
1. **`netlify.toml`**:
   - Build automático: `npm run build`
   - Diretório de publicação: `dist`
   - Funções serverless: `netlify/functions`
   - Roteamento inteligente de SPA (`/* -> /index.html 200`)
   - Encaminhamento de API (`/api/* -> /.netlify/functions/api/api/:splat 200!`)
   - Cabeçalhos de segurança HTTP (nosniff, SAMEORIGIN, CSP, Permissions-Policy)
   - Cache imutável de 1 ano para bundles em `/assets/*`
2. **`netlify/functions/api.ts`**:
   - Handler Serverless com `serverless-http` conectado ao Express.
   - Reuso de conexões com PostgreSQL / Cloud SQL via `callbackWaitsForEmptyEventLoop = false`.
3. **`public/_redirects`**:
   - Fallback redundante de redirecionamento para o Netlify.

---

## 🌐 Opção 1: Deploy Contínuo via Git (Recomendado)

1. Faça o commit e push dos arquivos para o seu repositório no GitHub/GitLab:
   ```bash
   git add .
   git commit -m "feat(deploy): adiciona configuracao completa para Netlify"
   git push origin main
   ```

2. Acesse o [Netlify Dashboard](https://app.netlify.com) e clique em **"Add new site" > "Import an existing project"**.

3. Selecione o provedor (GitHub / GitLab) e escolha o repositório `skill-forge`.

4. O Netlify detectará automaticamente o arquivo `netlify.toml`:
   - **Base directory:** *(deixe em branco / raiz)*
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`

5. Clique em **"Deploy site"**.

---

## ⚡ Opção 2: Deploy Direto via Netlify CLI

Se preferir fazer o deploy diretamente do terminal sem passar pelo Git:

1. Instale o Netlify CLI globalmente:
   ```bash
   npm install -g netlify-cli
   ```

2. Autentique-se na sua conta Netlify:
   ```bash
   netlify login
   ```

3. Vincule ou crie o projeto:
   ```bash
   netlify init
   ```

4. Execute o build e deploy em produção:
   ```bash
   npm run build
   netlify deploy --prod
   ```

---

## 🔐 Variáveis de Ambiente no Netlify

No painel do Netlify, navegue até:
**Site configuration > Environment variables > Add a variable**

Adicione as seguintes variáveis essenciais:

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `DATABASE_URL` | Conexão PostgreSQL (Cloud SQL ou Neon/Supabase) | `postgresql://postgres:SENHA@IP:5432/skillforge?sslmode=require` |
| `GEMINI_API_KEY` | Chave da API do Google Gemini (IA) | `AIzaSy...` |
| `NODE_ENV` | Ambiente de execução | `production` |
| `VITE_FIREBASE_API_KEY` | Chave pública do Firebase Auth | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domínio de autenticação Firebase | `projeto.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ID do projeto Firebase | `seu-projeto-id` |

> 💡 **Dica de Banco de Dados:** Como as funções do Netlify são executadas em modelo serverless efêmero, certifique-se de que a instância do Cloud SQL / PostgreSQL permita conexões SSL públicas (`sslmode=require`) ou utilize o Cloud SQL Auth Proxy / pooler de conexões.

---

## ✅ Como Validar o Deploy em Produção

Após a conclusão do deploy pelo Netlify (gerando uma URL como `https://skill-forge-xxx.netlify.app`):

1. **Testar Liveness & Healthcheck:**
   - Acesse: `https://seu-app.netlify.app/healthz` (deve retornar `OK`)
   - Acesse: `https://seu-app.netlify.app/api/health` (deve retornar JSON com status `HEALTHY` e PostgreSQL `CONNECTED`)

2. **Testar Aplicação Web:**
   - Abra a URL principal `https://seu-app.netlify.app/`.
   - Navegue pelo Dashboard, crie uma Skill, execute a geração por IA, adicione testes e exporte o pacote ZIP.
   - Recarregue a página em qualquer rota interna (ex: `/skills`, `/configuracoes`) para confirmar o roteamento SPA 200 OK sem tela 404.

3. **Configurar Domínio Personalizado (Opcional):**
   - No Netlify, vá em **Domain management > Add custom domain** (ex: `app.skillforge.io`).
   - O Netlify gerará automaticamente o certificado SSL/TLS gratuito Let's Encrypt com renovação automática.
