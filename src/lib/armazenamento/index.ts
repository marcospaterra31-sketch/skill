// ==============================================================================
// SKILL FORGE — CAMADA DE ARMAZENAMENTO & EXPORTAÇÃO (FASE 0)
// ==============================================================================

export interface ArquivoSkill {
  caminho: string;
  conteudo: string | Uint8Array;
  mimeType: string;
}

export interface PacoteSkillExportado {
  nomeArquivo: string;
  tamanhoEstimadoBytes: number;
  arquivos: ArquivoSkill[];
  criadoEm: string;
}

export interface ProvedorArmazenamento {
  salvarArquivo(caminho: string, conteudo: string | Uint8Array): Promise<string>;
  obterArquivo(caminho: string): Promise<string | Uint8Array | null>;
  excluirArquivo(caminho: string): Promise<boolean>;
  gerarPacoteSkill(titulo: string, versao: string, arquivos: ArquivoSkill[]): Promise<PacoteSkillExportado>;
}

/**
 * Provedor de armazenamento em memória com suporte a empacotamento
 */
export class ArmazenamentoMemoria implements ProvedorArmazenamento {
  private arquivos: Map<string, string | Uint8Array> = new Map();

  async salvarArquivo(caminho: string, conteudo: string | Uint8Array): Promise<string> {
    this.arquivos.set(caminho, conteudo);
    return `memory://${caminho}`;
  }

  async obterArquivo(caminho: string): Promise<string | Uint8Array | null> {
    return this.arquivos.get(caminho) || null;
  }

  async excluirArquivo(caminho: string): Promise<boolean> {
    return this.arquivos.delete(caminho);
  }

  async gerarPacoteSkill(titulo: string, versao: string, arquivos: ArquivoSkill[]): Promise<PacoteSkillExportado> {
    const slug = titulo.toLowerCase().replace(/\s+/g, '-');
    const nomeArquivo = `${slug}-v${versao}.zip`;
    
    let totalBytes = 0;
    arquivos.forEach((arq) => {
      totalBytes += typeof arq.conteudo === 'string' ? arq.conteudo.length : arq.conteudo.byteLength;
    });

    return {
      nomeArquivo,
      tamanhoEstimadoBytes: totalBytes,
      arquivos,
      criadoEm: new Date().toISOString(),
    };
  }
}

export const storage = new ArmazenamentoMemoria();
