import React, { useState } from 'react';
import { Dialog } from '../../components/ui/dialog.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Textarea } from '../../components/ui/textarea.tsx';
import { Select } from '../../components/ui/select.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { useToast } from '../../components/ui/toast.tsx';
import { iaService } from '../../services/ia/ia.service.ts';
import { AIProviderType, ExportFormat, SkillGeradaComIA } from '../../types/index.ts';
import { Sparkles, Cpu, Check, Layers, ArrowRight, RefreshCw, Shield, FileText } from 'lucide-react';

export interface GeradorComIAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSkillGerada: (skill: SkillGeradaComIA) => void;
}

const SUGESTOES_PROMPT = [
  'Auditor de Contratos Inteligentes Solidity focado em vulnerabilidades de Reentrancy e Integer Overflow.',
  'Arquiteto de Microsserviços Node.js & TypeScript com foco em mensageria RabbitMQ e Clean Architecture.',
  'Especialista em Acessibilidade Web (WCAG 2.2 AA) para auditoria ótica de interfaces e contraste.',
  'Sentinela de Segurança para Agentes de IA, prevenção de Jailbreaks e injeção de prompt adversarial.',
];

export const GeradorComIAModal: React.FC<GeradorComIAModalProps> = ({
  open,
  onOpenChange,
  onSkillGerada,
}) => {
  const { adicionarToast } = useToast();
  const [intencao, setIntencao] = useState('');
  const [provedor, setProvedor] = useState<AIProviderType>(AIProviderType.GEMINI);
  const [formato, setFormato] = useState<ExportFormat>(ExportFormat.CLAUDE_SKILL);
  const [gerando, setGerando] = useState(false);
  const [etapaGeracao, setEtapaGeracao] = useState('');
  const [resultadoPreview, setResultadoPreview] = useState<SkillGeradaComIA | null>(null);

  const handleGerar = async () => {
    if (!intencao.trim()) {
      adicionarToast('error', 'Descreva o objetivo', 'Informe o que a Skill deve fazer antes de iniciar a síntese.');
      return;
    }

    setGerando(true);
    setResultadoPreview(null);
    setEtapaGeracao('Analisando intenção e requisitos técnicos...');

    try {
      setTimeout(() => setEtapaGeracao('Projetando personas e system prompt especializado...'), 600);
      setTimeout(() => setEtapaGeracao('Estruturando salvaguardas e diretrizes negativas...'), 1200);

      const skill = await iaService.gerarSkillComIA(
        intencao,
        { formato },
        provedor
      );

      setResultadoPreview(skill);
      adicionarToast('success', 'Skill sintetizada com sucesso!', `A IA arquitetou "${skill.title}".`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na geração com IA.';
      adicionarToast('error', 'Falha no motor de IA', msg);
    } finally {
      setGerando(false);
      setEtapaGeracao('');
    }
  };

  const handleAplicar = () => {
    if (resultadoPreview) {
      onSkillGerada(resultadoPreview);
      onOpenChange(false);
      adicionarToast('success', 'Campos Preenchidos', 'A arquitetura gerada pela IA foi carregada no Criador.');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Gerador de Skills com Inteligência Artificial"
      description="Descreva em linguagem natural a especialidade desejada e o Motor de IA (Fase 4) sintetizará toda a arquitetura, system prompt e regras de segurança."
      maxWidth="lg"
    >
      <div className="space-y-5">
        {!resultadoPreview ? (
          <>
            {/* Suggestions Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-400">Sugestões de Alta Precisão:</span>
              <div className="flex flex-wrap gap-1.5">
                {SUGESTOES_PROMPT.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIntencao(sug)}
                    className="rounded bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 transition-colors text-left border border-slate-700/60 cursor-pointer"
                  >
                    "{sug.substring(0, 48)}..."
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              label="Descreva o Objetivo da Skill *"
              value={intencao}
              onChange={(e) => setIntencao(e.target.value)}
              placeholder="Ex: Crie um especialista em auditoria de segurança de APIs GraphQL, verificando profundidade de consulta (query depth), complexidade e vazamento de introspecção..."
              rows={4}
              hint="Quanto mais específico o contexto, mais rica será a engenharia de prompts gerada."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Motor de IA para Síntese"
                value={provedor}
                onChange={(e) => setProvedor(e.target.value as AIProviderType)}
                options={[
                  { value: AIProviderType.GEMINI, label: 'Google Gemini 2.5 Flash (Recomendado)' },
                  { value: AIProviderType.CLAUDE, label: 'Anthropic Claude 3.7 Sonnet' },
                  { value: AIProviderType.OPENAI, label: 'OpenAI GPT-4o' },
                ]}
              />

              <Select
                label="Formato de Empacotamento Alvo"
                value={formato}
                onChange={(e) => setFormato(e.target.value as ExportFormat)}
                options={[
                  { value: ExportFormat.CLAUDE_SKILL, label: 'Claude Skill (SKILL.md)' },
                  { value: ExportFormat.OPENAI_ASSISTANT, label: 'OpenAI Assistant Spec' },
                  { value: ExportFormat.GEMINI_EXTENSION, label: 'Gemini Extension' },
                  { value: ExportFormat.ZIP, label: 'Pacote Universal ZIP' },
                ]}
              />
            </div>

            {gerando && (
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-4 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-indigo-300 text-xs font-semibold">
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
                  <span>{etapaGeracao || 'Processando com motor de IA...'}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Gerando System Prompt, instruções operacionais e diretrizes negativas de segurança.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={gerando}
              >
                Cancelar
              </Button>

              <Button
                variant="primary"
                size="md"
                isLoading={gerando}
                onClick={handleGerar}
                className="gap-2 font-bold px-5 shadow-lg shadow-indigo-600/20"
              >
                <Sparkles className="h-4 w-4 text-indigo-200" />
                Sintetizar com Motor de IA
              </Button>
            </div>
          </>
        ) : (
          /* Result Preview Mode */
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Skill Arquitetada com Sucesso</span>
              </div>
              <Badge variant="default">{resultadoPreview.category}</Badge>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">{resultadoPreview.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{resultadoPreview.description}</p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                System Prompt Gerado
              </span>
              <pre className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-300 max-h-36 overflow-y-auto border border-slate-800">
                {resultadoPreview.systemPrompt}
              </pre>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Shield className="h-3 w-3 text-amber-400" />
                Salvaguardas & Regras Negativas
              </span>
              <pre className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-amber-200/90 max-h-24 overflow-y-auto border border-slate-800">
                {resultadoPreview.negativeRules}
              </pre>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {resultadoPreview.tags.map((t) => (
                <span key={t} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-mono">
                  #{t}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResultadoPreview(null)}
              >
                &larr; Refazer Geração
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleAplicar}
                className="gap-2 font-bold px-6 shadow-lg shadow-indigo-600/25"
              >
                <Check className="h-4 w-4" />
                Carregar no Criador de Skills
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
