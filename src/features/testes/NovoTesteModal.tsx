import React, { useState } from 'react';
import { Dialog } from '../../components/ui/dialog.tsx';
import { Button } from '../../components/ui/button.tsx';
import { Skill } from '../../types/index.ts';
import { Plus, Trash2, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export interface NovoTesteModalProps {
  aberto: boolean;
  onFechar: () => void;
  skills: Skill[];
  skillIdPadrao?: string;
  onCriarTeste: (dados: {
    skillId: string;
    name: string;
    description?: string;
    inputData: string;
    expectedOutput?: string;
    assertions: Array<{ operator: string; expected: string; field: string }>;
  }) => Promise<void>;
}

export const NovoTesteModal: React.FC<NovoTesteModalProps> = ({
  aberto,
  onFechar,
  skills,
  skillIdPadrao,
  onCriarTeste,
}) => {
  const [skillId, setSkillId] = useState(skillIdPadrao || skills[0]?.id || '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inputData, setInputData] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [assertions, setAssertions] = useState<
    Array<{ id: string; operator: string; expected: string }>
  >([
    { id: '1', operator: 'not_contains', expected: 'any' },
    { id: '2', operator: 'contains', expected: 'TypeScript' },
  ]);

  const adicionarAssercao = () => {
    setAssertions((prev) => [
      ...prev,
      { id: Math.random().toString(), operator: 'contains', expected: '' },
    ]);
  };

  const removerAssercao = (id: string) => {
    setAssertions((prev) => prev.filter((a) => a.id !== id));
  };

  const atualizarAssercao = (id: string, campo: 'operator' | 'expected', valor: string) => {
    setAssertions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [campo]: valor } : a))
    );
  };

  const handleSalvar = async () => {
    if (!name.trim() || !inputData.trim() || !skillId) {
      setErro('Preencha os campos obrigatórios: Skill, Nome e Entrada de Teste.');
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      await onCriarTeste({
        skillId,
        name: name.trim(),
        description: description.trim() || undefined,
        inputData: inputData.trim(),
        expectedOutput: expectedOutput.trim() || undefined,
        assertions: assertions
          .filter((a) => a.expected.trim() || a.operator === 'notEmpty')
          .map((a) => ({
            field: 'output.text',
            operator: a.operator,
            expected: a.expected.trim(),
          })),
      });
      onFechar();
    } catch (e: any) {
      setErro(e.message || 'Falha ao salvar teste.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog
      open={aberto}
      onOpenChange={(op) => !salvando && onFechar()}
      title="Criar Novo Caso de Teste Automatizado"
      description="Configure entradas de estímulo e asserções estritas de conformidade, latência e segurança."
      maxWidth="lg"
    >
      <div className="space-y-4 pt-2">
        {erro && (
          <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-lg">
            {erro}
          </div>
        )}

        {/* Seleção de Skill */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Skill Alvo a ser Testada *
          </label>
          <select
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            className="w-full h-8 text-xs bg-slate-950 border border-slate-800 rounded px-2.5 text-white focus:outline-none focus:border-indigo-500 font-sans"
          >
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} (v{s.currentVersion})
              </option>
            ))}
          </select>
        </div>

        {/* Nome do Teste */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Nome do Caso de Teste *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Validação de Tipagem Estrita e Ausência de 'any'"
            className="w-full h-8 text-xs bg-slate-950 border border-slate-800 rounded px-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Entrada Simulada (Input) */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Entrada do Usuário / Estímulo para a Skill *
          </label>
          <textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            rows={3}
            placeholder="Ex: Refatore esta função JavaScript para TypeScript estrito com tipos genéricos e retornos explícitos: function soma(a, b) { return a + b; }"
            className="w-full rounded border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        {/* Lista de Asserções Automatizadas */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-xs font-bold text-white block">
                Regras de Asserção de Saída
              </label>
              <p className="text-[11px] text-slate-400">
                Condições que a resposta da IA deve cumprir para passar no teste.
              </p>
            </div>
            <button
              type="button"
              onClick={adicionarAssercao}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              <Plus className="h-3 w-3" /> Adicionar Asserção
            </button>
          </div>

          <div className="space-y-2">
            {assertions.map((assert) => (
              <div
                key={assert.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800/80"
              >
                <select
                  value={assert.operator}
                  onChange={(e) => atualizarAssercao(assert.id, 'operator', e.target.value)}
                  className="h-7 text-xs bg-slate-900 border border-slate-700 rounded px-2 text-white font-mono shrink-0"
                >
                  <option value="contains">CONTAINS (Deve Conter)</option>
                  <option value="not_contains">NOT_CONTAINS (Proibido Conter)</option>
                  <option value="regex">REGEX (Expressão Regular)</option>
                  <option value="max_latency">MAX_LATENCY_MS (Latência Máx)</option>
                  <option value="notEmpty">NOT_EMPTY (Não Vazio)</option>
                  <option value="equals">EQUALS (Exatamente Igual)</option>
                </select>

                <input
                  type="text"
                  value={assert.expected}
                  onChange={(e) => atualizarAssercao(assert.id, 'expected', e.target.value)}
                  placeholder={
                    assert.operator === 'max_latency'
                      ? 'Ex: 3000 (ms)'
                      : assert.operator === 'regex'
                      ? 'Ex: function.*return'
                      : 'Texto esperado ou proibido...'
                  }
                  className="flex-1 h-7 rounded border border-slate-800 bg-slate-900 px-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />

                <button
                  type="button"
                  onClick={() => removerAssercao(assert.id)}
                  className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onFechar}
            disabled={salvando}
            className="text-xs text-slate-400 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSalvar}
            disabled={salvando}
            className="text-xs font-semibold"
          >
            {salvando ? 'Salvando Caso de Teste...' : 'Criar Caso de Teste'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
