import React, { useState, useEffect } from 'react';
import { RoutePath, AIProviderType, ExportFormat, SkillTemplate } from '../../types/index.ts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Input } from '../../components/ui/input.tsx';
import { Textarea } from '../../components/ui/textarea.tsx';
import { Select } from '../../components/ui/select.tsx';
import { Switch } from '../../components/ui/switch.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { Alert } from '../../components/ui/alert.tsx';
import { useToast } from '../../components/ui/toast.tsx';
import { useAuth } from '../../lib/autenticacao/index.ts';
import { skillService } from '../../services/skills/skill.service.ts';
import { GeradorComIAModal } from './GeradorComIAModal.tsx';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Layers,
  Sparkles,
  FileCode,
  Shield,
  Sliders,
  Copy,
  Eye,
  CheckCircle2,
  AlertCircle,
  Cpu,
  BookOpen,
} from 'lucide-react';

export interface SkillCreateViewProps {
  onNavegar: (caminho: RoutePath) => void;
  templateInicialId?: string;
}

type EtapaCriador = 1 | 2 | 3 | 4;

export const SkillCreateView: React.FC<SkillCreateViewProps> = ({ onNavegar }) => {
  const { adicionarToast } = useToast();
  const { obterTokenAuth, usuario } = useAuth();

  const [etapaAtual, setEtapaAtual] = useState<EtapaCriador>(1);
  const [salvando, setSalvando] = useState(false);
  const [modalIAAberto, setModalIAAberto] = useState(false);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);
  const [templatesDisponiveis, setTemplatesDisponiveis] = useState<SkillTemplate[]>([]);

  // ----------------------------------------------------------------------------
  // Estado dos Campos do Criador
  // ----------------------------------------------------------------------------
  // Etapa 1: Identidade & Escopo
  const [titulo, setTitulo] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false);
  const [categoria, setCategoria] = useState('Engenharia de Software');
  const [descricao, setDescricao] = useState('');
  const [publicoAlvo, setPublicoAlvo] = useState('Desenvolvedores e Agentes de IA');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['ia', 'engenharia']);
  const [isPublic, setIsPublic] = useState(false);

  // Etapa 2: Arquitetura & Instruções
  const [provedorIA, setProvedorIA] = useState<AIProviderType>(AIProviderType.GEMINI);
  const [formatoAlvo, setFormatoAlvo] = useState<ExportFormat>(ExportFormat.CLAUDE_SKILL);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userInstructions, setUserInstructions] = useState('');
  const [regrasNegativas, setRegrasNegativas] = useState(
    '- Nunca vazar credenciais ou tokens em texto plano.\n- Nunca executar comandos destrutivos sem confirmação explícita.\n- Não inventar dependências inexistentes.'
  );

  // Etapa 3: Ferramentas & Esquema
  const [ativarTools, setAtivarTools] = useState(true);
  const [tipoSaida, setTipoSaida] = useState<'markdown' | 'json' | 'texto'>('markdown');
  const [schemaJson, setSchemaJson] = useState('{\n  "status": "success | error",\n  "resultado": "string"\n}');

  // Carrega templates disponíveis para o atalho de carregamento rápido
  useEffect(() => {
    fetch('/api/templates')
      .then((r) => (r.ok ? r.json() : []))
      .then(setTemplatesDisponiveis)
      .catch(() => {});
  }, []);

  // Geração reativa de slug
  const handleTituloChange = (novoTitulo: string) => {
    setTitulo(novoTitulo);
    if (!slugEditadoManualmente) {
      const autoSlug = novoTitulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(autoSlug);
    }
  };

  const adicionarTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const removerTag = (tagRemover: string) => {
    setTags(tags.filter((t) => t !== tagRemover));
  };

  const carregarTemplate = (tmpl: SkillTemplate) => {
    setTitulo(tmpl.title);
    setSlug(tmpl.slug);
    setSlugEditadoManualmente(true);
    setCategoria(tmpl.category);
    setDescricao(tmpl.description);
    setSystemPrompt(tmpl.defaultPrompt);
    setTags(tmpl.tags || []);
    setFormatoAlvo(tmpl.targetFormat || ExportFormat.CLAUDE_SKILL);
    adicionarToast('info', 'Modelo aplicado', `Campos pré-preenchidos a partir de "${tmpl.title}".`);
  };

  const handleSkillGeradaPelaIA = (gerada: any) => {
    setTitulo(gerada.title);
    setSlug(gerada.slug);
    setSlugEditadoManualmente(true);
    setCategoria(gerada.category);
    setDescricao(gerada.description);
    setPublicoAlvo(gerada.targetAudience || 'Desenvolvedores e Agentes de IA');
    setTags(gerada.tags || []);
    setSystemPrompt(gerada.systemPrompt);
    setUserInstructions(gerada.userInstructions || '');
    setRegrasNegativas(gerada.negativeRules || '');
    if (gerada.targetFormat) {
      setFormatoAlvo(gerada.targetFormat as ExportFormat);
    }
    setEtapaAtual(4); // Vai direto para revisão com prévia do manifesto pronta!
  };

  // ----------------------------------------------------------------------------
  // Geração Dinâmica da Prévia do Manifesto SKILL.md
  // ----------------------------------------------------------------------------
  const gerarManifestoPreview = () => {
    return `---
name: "${titulo || 'minha-skill'}"
slug: "${slug || 'minha-skill'}"
category: "${categoria}"
version: "1.0.0"
target_format: "${formatoAlvo}"
public: ${isPublic}
author: "${usuario?.email || 'arquiteto@skillforge.dev'}"
tags: [${tags.map((t) => `"${t}"`).join(', ')}]
---

# ${titulo || 'Título da Habilidade'}

${descricao || 'Descrição da finalidade e atuação da habilidade.'}

## Papel & Persona do Agente (System Prompt)
${systemPrompt || 'Definição das diretrizes do modelo.'}

## Instruções Operacionais
${userInstructions || 'Diretrizes passo a passo de execução.'}

## Diretrizes Negativas & Restrições
${regrasNegativas || 'Sem restrições adicionais.'}

## Formato de Saída Esperado
- Modo: ${tipoSaida.toUpperCase()}
`;
  };

  // ----------------------------------------------------------------------------
  // Validação por Etapa
  // ----------------------------------------------------------------------------
  const validarEtapa = (etapa: EtapaCriador): boolean => {
    setErroValidacao(null);

    if (etapa === 1) {
      if (!titulo.trim() || titulo.trim().length < 3) {
        setErroValidacao('O título deve conter pelo menos 3 caracteres.');
        return false;
      }
      if (!descricao.trim() || descricao.trim().length < 10) {
        setErroValidacao('A descrição deve conter no mínimo 10 caracteres explicando a utilidade da Skill.');
        return false;
      }
    }

    if (etapa === 2) {
      if (!systemPrompt.trim()) {
        // Preenche automaticamente uma base se o usuário não escreveu
        setSystemPrompt(`Você é ${titulo}. Especialista em ${categoria}.\n\nSua responsabilidade principal é ${descricao}`);
      }
    }

    return true;
  };

  const avancar = () => {
    if (validarEtapa(etapaAtual)) {
      setEtapaAtual((prev) => Math.min(prev + 1, 4) as EtapaCriador);
    }
  };

  const voltar = () => {
    setErroValidacao(null);
    setEtapaAtual((prev) => Math.max(prev - 1, 1) as EtapaCriador);
  };

  // ----------------------------------------------------------------------------
  // Gravação Real no Banco PostgreSQL
  // ----------------------------------------------------------------------------
  const handleFinalizar = async () => {
    if (!validarEtapa(1) || !validarEtapa(2)) return;

    setSalvando(true);
    setErroValidacao(null);

    try {
      const token = await obterTokenAuth();

      const payload = {
        title: titulo.trim(),
        slug: slug.trim(),
        description: descricao.trim(),
        category: categoria,
        targetAudience: publicoAlvo.trim(),
        tags,
        systemPrompt: systemPrompt.trim(),
        userInstructions: userInstructions.trim(),
        negativeRules: regrasNegativas.trim(),
        toolsConfig: ativarTools ? { enabled: true, mode: tipoSaida } : null,
        schemaConfig: tipoSaida === 'json' ? { schema: schemaJson } : null,
        targetFormat: formatoAlvo,
        isPublic,
      };

      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const erroJson = await res.json();
        throw new Error(erroJson.error || 'Falha ao registrar a Skill no banco.');
      }

      const skillCriada = await res.json();
      adicionarToast('success', 'Skill Criada no PostgreSQL!', `"${skillCriada.title}" salva com versão 1.0.0.`);
      onNavegar('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao gravar a Skill.';
      setErroValidacao(msg);
      adicionarToast('error', 'Erro na criação', msg);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavegar('/skills')}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Voltar para lista de Skills"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
              Criador de Skills
              <Badge variant="default">Fase 3</Badge>
            </h1>
            <p className="text-xs text-slate-400">
              Arquitete e versione uma nova habilidade para Claude, OpenAI e Gemini.
            </p>
          </div>
        </div>

        {/* AI Generator Button and Quick Template Picker */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            onClick={() => setModalIAAberto(true)}
            size="sm"
            variant="primary"
            className="text-xs font-semibold gap-1.5 shadow-md shadow-indigo-600/25 bg-indigo-600 hover:bg-indigo-500"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
            Gerar com IA
          </Button>

          {templatesDisponiveis.length > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Modelo:</span>
              <select
                onChange={(e) => {
                  const escolhido = templatesDisponiveis.find((t) => t.id === e.target.value);
                  if (escolhido) carregarTemplate(escolhido);
                }}
                defaultValue=""
                className="h-8 rounded-lg border border-slate-800 bg-slate-900 px-2.5 text-xs text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              >
                <option value="" disabled>
                  Importar...
                </option>
                {templatesDisponiveis.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <GeradorComIAModal
        open={modalIAAberto}
        onOpenChange={setModalIAAberto}
        onSkillGerada={handleSkillGeradaPelaIA}
      />

      {/* Stepper Navigation */}
      <div className="grid grid-cols-4 gap-2 border-b border-slate-800/60 pb-4 text-xs select-none">
        {[
          { num: 1, rotulo: 'Identidade' },
          { num: 2, rotulo: 'Instruções' },
          { num: 3, rotulo: 'Ferramentas' },
          { num: 4, rotulo: 'Revisão' },
        ].map((s) => {
          const ativo = etapaAtual === s.num;
          const completo = etapaAtual > s.num;
          return (
            <button
              key={s.num}
              onClick={() => {
                if (s.num < etapaAtual || validarEtapa(etapaAtual)) {
                  setEtapaAtual(s.num as EtapaCriador);
                }
              }}
              className={`flex items-center justify-center sm:justify-start gap-2 py-2 px-3 rounded-lg border transition-all text-left cursor-pointer ${
                ativo
                  ? 'border-indigo-500 bg-indigo-950/30 text-white font-semibold'
                  : completo
                  ? 'border-emerald-500/30 bg-emerald-950/10 text-emerald-300'
                  : 'border-slate-800 text-slate-400 bg-slate-900/40'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  ativo
                    ? 'bg-indigo-600 text-white'
                    : completo
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {completo ? <Check className="h-3 w-3" /> : s.num}
              </span>
              <span className="hidden sm:inline truncate">{s.rotulo}</span>
            </button>
          );
        })}
      </div>

      {erroValidacao && (
        <Alert variant="destructive" title="Atenção aos campos">
          {erroValidacao}
        </Alert>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* ETAPA 1: Identidade & Escopo */}
      {/* ------------------------------------------------------------------------ */}
      {etapaAtual === 1 && (
        <Card className="space-y-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>01. Identidade & Escopo da Skill</CardTitle>
              <span className="text-[11px] text-slate-400">Passo 1 de 4</span>
            </div>
            <CardDescription>
              Defina como a habilidade será catalogada, descoberta e identificada no workspace.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Título da Skill *"
                value={titulo}
                onChange={(e) => handleTituloChange(e.target.value)}
                placeholder="Ex: Auditor de Código Seguro"
                required
              />

              <div className="space-y-1.5">
                <Input
                  label="Identificador Único (Slug) *"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugEditadoManualmente(true);
                  }}
                  placeholder="auditor-de-codigo-seguro"
                  hint="Utilizado no nome dos arquivos e rotas de exportação."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Categoria *"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                options={[
                  { value: 'Engenharia de Software', label: 'Engenharia de Software' },
                  { value: 'Segurança & Auditoria', label: 'Segurança & Auditoria' },
                  { value: 'Design & Acessibilidade', label: 'Design & Acessibilidade' },
                  { value: 'Automação & Integrações', label: 'Automação & Integrações' },
                  { value: 'Ciência & Pesquisa', label: 'Ciência & Pesquisa' },
                  { value: 'Produtividade & Escrita', label: 'Produtividade & Escrita' },
                ]}
              />

              <Input
                label="Público-Alvo ou Agente Alvo"
                value={publicoAlvo}
                onChange={(e) => setPublicoAlvo(e.target.value)}
                placeholder="Ex: Agentes autônomos, Engenheiros Backend"
              />
            </div>

            <Textarea
              label="Descrição Funcional *"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o propósito da Skill, suas atribuições e contexto ideal de acionamento..."
              rows={3}
              required
              hint={`${descricao.length} caracteres (mínimo 10)`}
            />

            {/* Tags Management */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Tags & Palavras-Chave
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      adicionarTag();
                    }
                  }}
                  placeholder="Adicione uma tag e pressione Enter..."
                  className="h-9 flex-1 rounded-lg border border-slate-700/80 bg-slate-900 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
                <Button type="button" size="sm" variant="secondary" onClick={adicionarTag}>
                  Adicionar
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300 border border-slate-700"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removerTag(tag)}
                      className="text-slate-500 hover:text-white"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Public toggle */}
            <div className="pt-2">
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
                label="Visibilidade Pública da Skill"
                description="Se desmarcado, a Skill permanecerá visível apenas para os membros do workspace."
              />
            </div>
          </CardContent>

          <CardFooter className="justify-between">
            <Button variant="ghost" size="sm" onClick={() => onNavegar('/skills')}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" onClick={avancar} className="gap-2">
              Próximo: Instruções
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* ETAPA 2: Arquitetura & Instruções */}
      {/* ------------------------------------------------------------------------ */}
      {etapaAtual === 2 && (
        <Card className="space-y-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>02. Arquitetura & Instruções Base</CardTitle>
              <span className="text-[11px] text-slate-400">Passo 2 de 4</span>
            </div>
            <CardDescription>
              Configure o motor de IA alvo e as diretrizes que nortearão a execução do modelo.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Provedor de IA Alvo"
                value={provedorIA}
                onChange={(e) => setProvedorIA(e.target.value as AIProviderType)}
                options={[
                  { value: AIProviderType.GEMINI, label: 'Google Gemini (gemini-2.5-flash)' },
                  { value: AIProviderType.CLAUDE, label: 'Anthropic Claude (claude-3-7-sonnet)' },
                  { value: AIProviderType.OPENAI, label: 'OpenAI (gpt-4o)' },
                ]}
              />

              <Select
                label="Formato de Empacotamento Alvo"
                value={formatoAlvo}
                onChange={(e) => setFormatoAlvo(e.target.value as ExportFormat)}
                options={[
                  { value: ExportFormat.CLAUDE_SKILL, label: 'Claude Skill (SKILL.md)' },
                  { value: ExportFormat.OPENAI_ASSISTANT, label: 'OpenAI Assistant Spec (JSON)' },
                  { value: ExportFormat.GEMINI_EXTENSION, label: 'Google Gemini Extension' },
                  { value: ExportFormat.ZIP, label: 'Pacote Universal ZIP' },
                  { value: ExportFormat.MARKDOWN, label: 'Documentação Markdown' },
                ]}
              />
            </div>

            <Textarea
              label="System Prompt (Papel & Persona) *"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Você é uma autoridade em... Suas diretrizes fundamentais são: 1. ..."
              rows={4}
              hint="Instruções de sistema imutáveis injetadas no contexto mestre."
            />

            <Textarea
              label="Diretrizes Operacionais de Execução (Opcional)"
              value={userInstructions}
              onChange={(e) => setUserInstructions(e.target.value)}
              placeholder="Instruções complementares de como o modelo deve conduzir cada interação..."
              rows={3}
            />

            <Textarea
              label="Regras Negativas (Restrições Estritas / O que NÃO fazer) *"
              value={regrasNegativas}
              onChange={(e) => setRegrasNegativas(e.target.value)}
              placeholder="- Nunca assumir parâmetros sem validar..."
              rows={3}
              hint="Essenciais para proteção contra jailbreaks e alucinações."
            />
          </CardContent>

          <CardFooter className="justify-between">
            <Button variant="secondary" size="sm" onClick={voltar}>
              Voltar
            </Button>
            <Button variant="primary" size="md" onClick={avancar} className="gap-2">
              Próximo: Ferramentas
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* ETAPA 3: Ferramentas & Esquema */}
      {/* ------------------------------------------------------------------------ */}
      {etapaAtual === 3 && (
        <Card className="space-y-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>03. Ferramentas & Formato de Saída</CardTitle>
              <span className="text-[11px] text-slate-400">Passo 3 de 4</span>
            </div>
            <CardDescription>
              Defina os esquemas de entrada e saída e se a Skill terá capacidade de invocar ferramentas.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <Switch
              checked={ativarTools}
              onCheckedChange={setAtivarTools}
              label="Habilitar Chamadas de Ferramentas (Function Calling)"
              description="Permite que a Skill acione endpoints, execute comandos ou consulte APIs externas."
            />

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Modo de Formato de Saída
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'markdown', rotulo: 'Markdown Puro', desc: 'Respostas textuais com títulos e listas' },
                  { id: 'json', rotulo: 'JSON Estruturado', desc: 'Conformidade rígida com JSON Schema' },
                  { id: 'texto', rotulo: 'Texto Livre', desc: 'Respostas curtas e conversacionais' },
                ].map((modo) => (
                  <button
                    key={modo.id}
                    type="button"
                    onClick={() => setTipoSaida(modo.id as any)}
                    className={`rounded-lg border p-3 text-left transition-all cursor-pointer ${
                      tipoSaida === modo.id
                        ? 'border-indigo-500 bg-indigo-950/20 text-white'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block text-xs font-semibold">{modo.rotulo}</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{modo.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {tipoSaida === 'json' && (
              <Textarea
                label="JSON Schema de Saída Esperada"
                value={schemaJson}
                onChange={(e) => setSchemaJson(e.target.value)}
                rows={4}
                hint="Validação de saída que será aplicada pelo laboratório e auditor."
              />
            )}
          </CardContent>

          <CardFooter className="justify-between">
            <Button variant="secondary" size="sm" onClick={voltar}>
              Voltar
            </Button>
            <Button variant="primary" size="md" onClick={avancar} className="gap-2">
              Próximo: Revisão
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* ETAPA 4: Revisão & Publicação no PostgreSQL */}
      {/* ------------------------------------------------------------------------ */}
      {etapaAtual === 4 && (
        <Card className="space-y-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>04. Revisão & Prévia do Manifesto</CardTitle>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Pronto para gravar
              </span>
            </div>
            <CardDescription>
              Confira os dados consolidados e a prévia estruturada do arquivo SKILL.md antes de persistir no Cloud SQL.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-400 block text-[10px]">Título</span>
                <span className="font-semibold text-white truncate block">{titulo}</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-400 block text-[10px]">Categoria</span>
                <span className="font-semibold text-white truncate block">{categoria}</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-400 block text-[10px]">Provedor / Formato</span>
                <span className="font-semibold text-indigo-300 truncate block">
                  {provedorIA.toUpperCase()} / {formatoAlvo}
                </span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-400 block text-[10px]">Versão Inicial</span>
                <span className="font-mono font-bold text-emerald-400 block">v1.0.0</span>
              </div>
            </div>

            {/* Generated SKILL.md Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <FileCode className="h-4 w-4 text-indigo-400" />
                  Manifesto SKILL.md Gerado
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Pronto para exportação
                </span>
              </div>
              <pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 max-h-64 overflow-y-auto leading-relaxed">
                {gerarManifestoPreview()}
              </pre>
            </div>
          </CardContent>

          <CardFooter className="justify-between">
            <Button variant="secondary" size="sm" onClick={voltar}>
              Voltar
            </Button>
            <Button
              variant="primary"
              size="lg"
              isLoading={salvando}
              onClick={handleFinalizar}
              className="gap-2 font-bold px-6 shadow-lg shadow-indigo-600/25"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              Gravar Skill no PostgreSQL
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};
