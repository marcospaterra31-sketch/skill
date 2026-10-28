import { QAReport } from '../../types/index.ts';

export class QAService {
  /**
   * Executa a suíte de testes de homologação e garantia de qualidade (QA) de ponta a ponta.
   */
  async executarSuiteQA(): Promise<QAReport> {
    const res = await fetch('/api/qa/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha na suíte de QA' }));
      throw new Error(err.error || 'Não foi possível rodar a homologação de QA.');
    }

    return res.json();
  }

  /**
   * Obtém o último relatório consolidado de QA.
   */
  async obterRelatorioQA(): Promise<QAReport> {
    const res = await fetch('/api/qa/suite');
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha ao buscar relatório de QA' }));
      throw new Error(err.error || 'Não foi possível obter o relatório de QA.');
    }
    return res.json();
  }
}

export const qaService = new QAService();
