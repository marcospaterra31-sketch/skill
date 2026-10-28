import React, { useEffect, useState } from 'react';
import { RoutePath, Skill, SkillStatus } from '../../types/index.ts';
import { skillService } from '../../services/skills/skill.service.ts';
import { Button } from '../../components/ui/button.tsx';
import { EmptyState } from '../../components/ui/empty-state.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { Plus, Search, BookOpen, Sparkles, Filter, Wand2 } from 'lucide-react';

export interface SkillsListViewProps {
  onNavegar: (caminho: RoutePath, paramSkillId?: string) => void;
}

export const SkillsListView: React.FC<SkillsListViewProps> = ({ onNavegar }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    skillService.listarSkills().then((itens) => {
      setSkills(itens);
      setCarregando(false);
    });
  }, []);

  const skillsFiltradas = skills.filter((skill) => {
    const correspondeBusca =
      skill.title.toLowerCase().includes(busca.toLowerCase()) ||
      skill.description.toLowerCase().includes(busca.toLowerCase()) ||
      skill.category.toLowerCase().includes(busca.toLowerCase());

    const correspondeStatus =
      filtroStatus === 'todos' || skill.status.toLowerCase() === filtroStatus.toLowerCase();

    return correspondeBusca && correspondeStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-sans">
            Minhas Skills
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Gerencie e versione suas habilidades e prompts customizados para agentes de IA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setCarregando(true);
              skillService.listarSkills().then((itens) => {
                setSkills(itens);
                setCarregando(false);
              });
            }}
            size="sm"
            variant="secondary"
            className="text-xs h-8 text-slate-300 hover:text-white"
          >
            Atualizar
          </Button>

          <Button
            onClick={() => onNavegar('/skills/nova')}
            size="sm"
            variant="primary"
            className="font-semibold gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Criar Nova Skill
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, categoria ou tag..."
            className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/80 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800/80">
          {['todos', 'draft', 'review', 'published'].map((st) => (
            <button
              key={st}
              onClick={() => setFiltroStatus(st)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                filtroStatus === st
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'todos' ? 'Todas' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {skillsFiltradas.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-8 w-8 text-slate-500" />}
          title="Nenhuma Skill encontrada"
          description={
            busca
              ? 'Nenhum resultado corresponde à sua pesquisa. Tente ajustar os termos de busca.'
              : 'Seu workspace ainda não possui nenhuma Skill cadastrada. Crie a primeira para começar.'
          }
          actionLabel="Criar Nova Skill"
          onAction={() => onNavegar('/skills/nova')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {skillsFiltradas.map((skill) => (
            <div
              key={skill.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:bg-slate-900/90"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-medium text-slate-400">{skill.category}</span>
                  <Badge
                    variant={
                      skill.status === SkillStatus.PUBLISHED
                        ? 'success'
                        : skill.status === SkillStatus.REVIEW
                        ? 'warning'
                        : 'secondary'
                    }
                  >
                    {skill.status}
                  </Badge>
                </div>

                <h3 className="text-sm font-semibold text-white">{skill.title}</h3>
                <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {skill.description}
                </p>

                {skill.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {skill.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300 font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">v{skill.currentVersion}</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onNavegar('/otimizacao', skill.id)}
                    title="Otimizar automaticamente com IA"
                    className="text-amber-400 hover:text-amber-300 font-medium cursor-pointer flex items-center gap-1"
                  >
                    <Wand2 className="h-3 w-3" />
                    <span>Otimizar</span>
                  </button>
                  <button
                    onClick={() => onNavegar('/skills/editor', skill.id)}
                    className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    Editor &rarr;
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
