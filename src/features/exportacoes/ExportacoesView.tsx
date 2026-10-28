import React, { useState, useEffect, useCallback } from 'react';
import { RoutePath, ExportFormat, Skill } from '../../types/index.ts';
import { Button } from '../../components/ui/button.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { useToast } from '../../components/ui/toast.tsx';
import { skillService } from '../../services/skills/skill.service.ts';
import {
  exportacaoService,
  OpcaoFormatoExportacao,
  PreviewPacoteResultado,
  ExportacaoItemPersistido,
  ArquivoPreview,
} from '../../services/exportacoes/exportacao.service.ts';
import {
  Package,
  Download,
  FileArchive,
  Check,
  Layers,
  FileCode,
  FolderArchive,
  RotateCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  FlaskConical,
  Eye,
  Calendar,
  HardDrive,
  FileText,
  Terminal,
} from 'lucide-react';

export interface ExportacoesViewProps {
  onNavegar: (caminho: RoutePath, paramSkillId?: string) => void;
}

export const ExportacoesView: React.FC<ExportacoesViewProps> = ({ onNavegar }) => {
  const { adicionarToast } = useToast();
  const formatos: OpcaoFormatoExportacao[] = exportacaoService.obterFormatosDisponiveis();

  // Estados de Dados
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillSelecionadaId, setSkillSelecionadaId] = useState<string>('');
  const [formatoSelecionado, setFormatoSelecionado] = useState<ExportFormat>(ExportFormat.ZIP);
  const [includeTests, setIncludeTests] = useState(true);
  const [includeAudit, setIncludeAudit] = useState(true);

  // Estados de Pré-visualização & Download
  const [carregandoSkills, setCarregandoSkills] = useState(true);
  const [carregandoPreview, setCarregandoPreview] = useState(false);
  const [previewPacote, setPreviewPacote] = useState<PreviewPacoteResultado | null>(null);
  const [arquivoAtivo, setArquivoAtivo] = useState<ArquivoPreview | null>(null);
  const [baixandoZip, setBaixandoZip] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Histórico de Exportações Salvas no Cloud SQL
  const [historico, setHistorico] = useState<ExportacaoItemPersistido[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  // 1. Carrega lista de Skills
  const carregarSkills = useCallback(async () => {
    setCarregandoSkills(true);
    try {
      const lista = await skillService.listarSkills();
      setSkills(lista);
      if (lista.length > 0 && !skillSelecionadaId) {
        setSkillSelecionadaId(lista[0].id);
      }
    } catch (e: any) {
      adicionarToast('error', 'Erro ao carregar skills', e.message);
    } finally {
      setCarregandoSkills(false);
    }
  }, [skillSelecionadaId, adicionarToast]);

  // 2. Carrega histórico de exportações do PostgreSQL
  const carregarHistorico = useCallback(async () => {
    setCarregandoHistorico(true);
    try {
      const itens = await exportacaoService.listarExportacoes();
      setHistorico(itens);
    } catch {
      // Ignora erro inicial
    } finally {
      setCarregandoHistorico(false);
    }
  }, []);

  useEffect(() => {
    carregarSkills();
    carregarHistorico();
  }, [carregarSkills, carregarHistorico]);

  // 3. Atualiza pré-visualização quando a skill ou opções mudarem
  const carregarPreview = useCallback(async () => {
    if (!skillSelecionadaId) return;
    setCarregandoPreview(true);
    try {
      const res = await exportacaoService.preverPacote(skillSelecionadaId, undefined, {
        includeTests,
        includeAudit,
      });
      setPreviewPacote(res);
      if (res.arquivos.length > 0) {
        setArquivoAtivo(res.arquivos[0]);
      }
    } catch (e: any) {
      adicionarToast('error', 'Falha ao pré-visualizar pacote', e.message);
    } finally {
      setCarregandoPreview(false);
    }
  }, [skillSelecionadaId, includeTests, includeAudit, adicionarToast]);

  useEffect(() => {
    if (skillSelecionadaId) {
      carregarPreview();
    }
  }, [skillSelecionadaId, carregarPreview]);

  // 4. Download do Pacote ZIP Real
  const handleBaixarPacote = async () => {
    if (!skillSelecionadaId) return;
    setBaixandoZip(true);
    try {
      // Gera registro no PostgreSQL
      const gerado = await exportacaoService.gerarExportacao(
        skillSelecionadaId,
        undefined,
        formatoSelecionado,
        { includeTests, includeAudit }
      );

      // Dispara streaming do arquivo no browser
      if (formatoSelecionado === ExportFormat.ZIP) {
        await exportacaoService.baixarZipDireto(skillSelecionadaId, undefined, {
          includeTests,
          includeAudit,
        });
      } else {
        // Para formato individual, baixa o arquivo ativo
        window.open(gerado.downloadUrl, '_blank');
      }

      adicionarToast(
        'success',
        'Download Concluído!',
        `Arquivo ${gerado.fileName} gerado e salvo no histórico com sucesso.`
      );
      carregarHistorico();
    } catch (e: any) {
      adicionarToast('error', 'Erro no empacotamento', e.message);
    } finally {
      setBaixandoZip(false);
    }
  };

  const copiarConteudoArquivo = () => {
    if (!arquivoAtivo) return;
    navigator.clipboard.writeText(arquivoAtivo.content);
    setCopiado(true);
    adicionarToast('success', 'Copiado', `${arquivoAtivo.path} copiado para a área de transferência.`);
    setTimeout(() => setCopiado(false), 2000);
  };

  const skillAtual = skills.find((s) => s.id === skillSelecionadaId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FolderArchive className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100 font-sans">
              Exportações & Empacotamento Multi-Plataforma
            </h1>
            <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs">
              Fase 10 Real
            </Badge>
          </div>
          <p className="text-sm text-slate-400">
            Geração de pacotes ZIP binários, formatos canônicos Claude Code (`SKILL.md`), Cursor Rules (`.cursorrules`), OpenAI Assistants e Gemini Extensions.
          </p>
        </div>

        {/* Seletor de Skill Ativa */}
        <div className="flex items-center gap-3">
          <label htmlFor="skill-selector" className="text-xs font-medium text-slate-400">
            Skill:
          </label>
          <select
            id="skill-selector"
            value={skillSelecionadaId}
            onChange={(e) => setSkillSelecionadaId(e.target.value)}
            disabled={carregandoSkills || baixandoZip}
            className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs font-medium text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.currentVersion}) · {s.category}
              </option>
            ))}
          </select>

          <Button
            variant="primary"
            size="sm"
            onClick={handleBaixarPacote}
            disabled={baixandoZip || !skillSelecionadaId}
            className="text-xs h-9 font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
          >
            <Download className={`h-3.5 w-3.5 ${baixandoZip ? 'animate-bounce' : ''}`} />
            {baixandoZip ? 'Gerando Pacote...' : 'Baixar ZIP Universal'}
          </Button>
        </div>
      </div>

      {/* Grid Principal: Formatos e Opções */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lado Esquerdo: Seleção de Formato e Opções (5 colunas) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="h-4 w-4 text-slate-500" />
            1. Formato do Pacote
          </h2>

          <div className="space-y-2">
            {formatos.map((fmt) => (
              <button
                key={fmt.formato}
                type="button"
                onClick={() => setFormatoSelecionado(fmt.formato)}
                className={`w-full rounded-xl border p-3.5 text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  formatoSelecionado === fmt.formato
                    ? 'border-indigo-500 bg-indigo-950/25 shadow-md shadow-indigo-500/10'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-100">{fmt.rotulo}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-400">
                      {fmt.extensao}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{fmt.descricao}</p>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Alvo: {fmt.compatibilidade}
                  </span>
                </div>

                <div className="mt-1">
                  {formatoSelecionado === fmt.formato ? (
                    <div className="h-4 w-4 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                      <Check className="h-2.5 w-2.5" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-slate-700" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Opções de Inclusão no Pacote */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
              Opções de Empacotamento
            </span>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTests}
                onChange={(e) => setIncludeTests(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <div className="flex items-center gap-1.5">
                <FlaskConical className="h-3.5 w-3.5 text-indigo-400" />
                <span>Incluir Casos de Teste (`test_cases.json`)</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAudit}
                onChange={(e) => setIncludeAudit(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Incluir Laudo de Auditoria OWASP (`audit_report.json`)</span>
              </div>
            </label>
          </div>
        </div>

        {/* Lado Direito: Pré-visualizador Interativo do Pacote ZIP (7 colunas) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Eye className="h-4 w-4 text-slate-500" />
              2. Pré-visualizador do Pacote ({previewPacote?.totalArquivos || 0} arquivos)
            </h2>
            {previewPacote && (
              <span className="text-xs text-slate-500 font-mono">
                Tamanho estimado: {Math.round(previewPacote.totalSizeBytes / 1024 * 10) / 10} KB
              </span>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            {/* Abas dos Arquivos Contidos */}
            <div className="flex items-center gap-1 border-b border-slate-800 px-3 py-2 bg-slate-900/70 overflow-x-auto">
              {carregandoPreview ? (
                <div className="py-1 text-xs text-slate-500 flex items-center gap-2">
                  <RotateCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                  Montando manifesto do pacote...
                </div>
              ) : previewPacote?.arquivos.map((arq) => (
                <button
                  key={arq.path}
                  onClick={() => setArquivoAtivo(arq)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    arquivoAtivo?.path === arq.path
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <FileText className="h-3 w-3" />
                  {arq.path}
                </button>
              ))}
            </div>

            {/* Código / Conteúdo do Arquivo Ativo */}
            <div className="p-4">
              {arquivoAtivo ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
                    <span className="font-mono text-indigo-300 font-semibold">{arquivoAtivo.path}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-slate-500">
                        {arquivoAtivo.sizeBytes} bytes · {arquivoAtivo.mimeType}
                      </span>
                      <button
                        onClick={copiarConteudoArquivo}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        title="Copiar código do arquivo"
                      >
                        {copiado ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        {copiado ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80 selection:bg-indigo-600 selection:text-white">
                    {arquivoAtivo.content}
                  </pre>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500">
                  Selecione uma skill para inspecionar os arquivos gerados.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Exportações Salvas no Cloud SQL (PostgreSQL) */}
      <div className="space-y-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-slate-400" />
              Histórico de Exportações Persistidas (Cloud SQL)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Registro imutável de pacotes e arquivos binários gerados pelo Skill Forge.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={carregarHistorico}
            disabled={carregandoHistorico}
            className="text-xs h-8 border-slate-700 bg-slate-900 text-slate-300"
          >
            <RotateCw className={`h-3.5 w-3.5 ${carregandoHistorico ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {historico.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-500">
            Nenhuma exportação registrada ainda. Selecione uma Skill acima e clique em &quot;Baixar ZIP Universal&quot;.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                  <tr>
                    <th className="py-3 px-4">Arquivo</th>
                    <th className="py-3 px-4">Skill</th>
                    <th className="py-3 px-4">Formato</th>
                    <th className="py-3 px-4">Tamanho</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {historico.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-200">
                        {item.fileName}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {item.skillTitle || item.skillId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                          {item.format}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 tabular-nums">
                        {item.fileSizeBytes ? `${Math.round(item.fileSizeBytes / 1024 * 10) / 10} KB` : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(item.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={item.downloadUrl || `/api/exports/${item.id}/download`}
                          download={item.fileName}
                          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          <Download className="h-3 w-3" />
                          Baixar
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
