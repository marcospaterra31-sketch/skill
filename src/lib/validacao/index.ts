// ==============================================================================
// SKILL FORGE — CAMADA DE VALIDAÇÃO (FASE 0)
// ==============================================================================

import { ValidationError } from '../erros/index.ts';
import { ExportFormat } from '../../types/index.ts';

export interface NovaSkillInput {
  title: string;
  slug?: string;
  description: string;
  category: string;
  tags?: string[];
  targetAudience?: string;
  systemPrompt?: string;
}

export interface NovaSkillValidada {
  title: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  targetAudience: string;
  systemPrompt?: string;
}

export function validarNovaSkill(input: Partial<NovaSkillInput>): NovaSkillValidada {
  const erros: Record<string, string> = {};

  if (!input.title || input.title.trim().length < 3) {
    erros.title = 'O título da Skill deve conter no mínimo 3 caracteres.';
  } else if (input.title.trim().length > 120) {
    erros.title = 'O título da Skill não pode exceder 120 caracteres.';
  }

  if (!input.description || input.description.trim().length < 10) {
    erros.description = 'A descrição deve conter no mínimo 10 caracteres explicando o propósito da Skill.';
  }

  if (!input.category || input.category.trim().length < 2) {
    erros.category = 'Selecione ou informe uma categoria válida.';
  }

  if (input.systemPrompt && input.systemPrompt.trim().length < 10) {
    erros.systemPrompt = 'Se fornecido, o System Prompt deve ter no mínimo 10 caracteres.';
  }

  if (Object.keys(erros).length > 0) {
    throw new ValidationError('Existem inconsistências nos dados da Skill.', erros);
  }

  const generatedSlug = input.slug?.trim() || gerarSlug(input.title!);

  return {
    title: input.title!.trim(),
    slug: generatedSlug,
    description: input.description!.trim(),
    category: input.category!.trim(),
    tags: input.tags?.map((t) => t.trim().toLowerCase()).filter(Boolean) || [],
    targetAudience: input.targetAudience?.trim() || 'Desenvolvedores e Usuários de IA',
    systemPrompt: input.systemPrompt?.trim(),
  };
}

export function validarSemver(versao: string): boolean {
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return semverRegex.test(versao.trim());
}

export function validarFormatoExportacao(formato: string): ExportFormat {
  const formatosValidos = Object.values(ExportFormat);
  if (!formatosValidos.includes(formato as ExportFormat)) {
    throw new ValidationError(`Formato de exportação inválido: "${formato}". Formatos suportados: ${formatosValidos.join(', ')}`);
  }
  return formato as ExportFormat;
}

export function gerarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
