// ==============================================================================
// SKILL FORGE — SERVIÇO DE EXPORTAÇÃO & EMPACOTAMENTO ZIP (FASE 10)
// ==============================================================================

import { ExportFormat, SkillExport } from '../../types/index.ts';
import { storage } from '../../lib/armazenamento/index.ts';
import { db } from '../../lib/banco/index.ts';
import { DatabaseError } from '../../lib/erros/index.ts';

export interface OpcaoFormatoExportacao {
  formato: ExportFormat;
  rotulo: string;
  extensao: string;
  descricao: string;
  compatibilidade: string;
}

export interface ArquivoPreview {
  path: string;
  content: string;
  mimeType: string;
  sizeBytes: number;
}

export interface PreviewPacoteResultado {
  skillId: string;
  skillTitle: string;
  versionNumber: string;
  nomeArquivoBase: string;
  totalArquivos: number;
  totalSizeBytes: number;
  arquivos: ArquivoPreview[];
}

export interface ExportacaoItemPersistido extends SkillExport {
  skillTitle?: string;
  skillCategory?: string;
  currentVersion?: string;
}

export class ExportacaoService {
  private exportacoes: Map<string, SkillExport> = new Map();

  obterFormatosDisponiveis(): OpcaoFormatoExportacao[] {
    return [
      {
        formato: ExportFormat.ZIP,
        rotulo: 'Pacote Universal ZIP',
        extensao: '.zip',
        descricao: 'Pacote ZIP com SKILL.md, .cursorrules, manifest.json, schemas e testes.',
        compatibilidade: 'Todos os agentes, IDEs e CLIs',
      },
      {
        formato: ExportFormat.CLAUDE_SKILL,
        rotulo: 'Anthropic Claude Skill',
        extensao: '.md',
        descricao: 'Formato SKILL.md com frontmatter YAML otimizado para Claude Projects & Code.',
        compatibilidade: 'Claude Desktop, Claude Code, Anthropic API',
      },
      {
        formato: ExportFormat.OPENAI_ASSISTANT,
        rotulo: 'OpenAI Assistant Spec',
        extensao: '.json',
        descricao: 'Definição compatível com a API de Assistants e Tools (JSON Schema estrito).',
        compatibilidade: 'OpenAI GPTs, Assistants API',
      },
      {
        formato: ExportFormat.GEMINI_EXTENSION,
        rotulo: 'Google Gemini Extension',
        extensao: '.json',
        descricao: 'Configuração de extensões e ferramentas para ecossistema Google AI Studio.',
        compatibilidade: 'Gemini API, Google AI Studio',
      },
      {
        formato: ExportFormat.MARKDOWN,
        rotulo: 'Documentação Markdown',
        extensao: '.md',
        descricao: 'Documento limpo com instruções, prompts e convenções para desenvolvedores.',
        compatibilidade: 'Cursor, Windsurf, GitHub Copilot',
      },
    ];
  }

  /**
   * Pré-visualiza os arquivos e conteúdos do pacote antes do download.
   */
  async preverPacote(
    skillId: string,
    versionId?: string,
    options: { includeTests?: boolean; includeAudit?: boolean } = {}
  ): Promise<PreviewPacoteResultado> {
    const res = await fetch('/api/exports/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, versionId, ...options }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha na pré-visualização' }));
      throw new Error(err.error || 'Erro ao carregar pré-visualização do pacote.');
    }

    return res.json();
  }

  /**
   * Gera o pacote e registra no histórico de exportações do PostgreSQL.
   */
  async gerarExportacao(
    skillId: string,
    versionId?: string,
    format: ExportFormat | string = 'ZIP',
    options: { includeTests?: boolean; includeAudit?: boolean } = {}
  ): Promise<{
    success: boolean;
    exportId: string;
    fileName: string;
    fileSizeBytes: number;
    downloadUrl: string;
  }> {
    const res = await fetch('/api/exports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skillId,
        versionId,
        format,
        ...options,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha na geração' }));
      throw new Error(err.error || 'Erro ao gerar pacote de exportação.');
    }

    return res.json();
  }

  /**
   * Dispara o download direto do ZIP binário no navegador.
   */
  async baixarZipDireto(
    skillId: string,
    versionId?: string,
    options: { includeTests?: boolean; includeAudit?: boolean } = {}
  ): Promise<void> {
    const res = await fetch('/api/exports/download-direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, versionId, ...options }),
    });

    if (!res.ok) {
      throw new Error('Falha ao baixar arquivo ZIP do servidor.');
    }

    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    let fileName = 'skill-package.zip';
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      fileName = match[1];
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  /**
   * Lista o histórico de exportações salvas no banco.
   */
  async listarExportacoes(skillId?: string): Promise<ExportacaoItemPersistido[]> {
    try {
      const res = await fetch('/api/exports');
      if (res.ok) {
        const itens: ExportacaoItemPersistido[] = await res.json();
        if (skillId) {
          return itens.filter((i) => i.skillId === skillId);
        }
        return itens;
      }
    } catch {
      // Fallback em ambiente de teste ou sem rede
    }

    const todas = Array.from(this.exportacoes.values());
    if (skillId) {
      return todas.filter((e) => e.skillId === skillId);
    }
    return todas;
  }

  /**
   * Método de compatibilidade com os testes de fundação (Fase 0).
   */
  async prepararPacoteExportacao(skillId: string, formato: ExportFormat): Promise<SkillExport> {
    const skill = await db.obterSkillPorId(skillId);
    if (!skill) throw new DatabaseError('Skill não encontrada para exportação.');

    const pacote = await storage.gerarPacoteSkill(skill.title, skill.currentVersion, [
      {
        caminho: 'SKILL.md',
        conteudo: `# ${skill.title}\n\n${skill.description}\n\n## Categoria\n${skill.category}`,
        mimeType: 'text/markdown',
      },
      {
        caminho: 'metadata.json',
        conteudo: JSON.stringify(
          {
            id: skill.id,
            versao: skill.currentVersion,
            formato,
            geradoEm: new Date().toISOString(),
          },
          null,
          2
        ),
        mimeType: 'application/json',
      },
    ]);

    const id = `exp_${Math.random().toString(36).substring(2, 9)}`;
    const exportacao: SkillExport = {
      id,
      skillId: skill.id,
      versionId: `ver_${skill.currentVersion}`,
      format: formato,
      fileName: pacote.nomeArquivo,
      fileSizeBytes: pacote.tamanhoEstimadoBytes,
      downloadUrl: `#download-${pacote.nomeArquivo}`,
      metadata: { totalArquivos: pacote.arquivos.length },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.exportacoes.set(id, exportacao);
    return exportacao;
  }
}

export const exportacaoService = new ExportacaoService();
