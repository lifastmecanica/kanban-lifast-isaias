import React from 'react';
import { CRMTask } from '../types/crm';

interface StatsBarProps {
  tasks: CRMTask[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (p: string) => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  tasks,
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
}) => {
  const totalCount = tasks.length;
  const naoIniciadoCount = tasks.filter((t) => t.status === 'não iniciado').length;
  const emAndamentoCount = tasks.filter((t) => t.status === 'em andamento').length;
  const finalizadoCount = tasks.filter((t) => t.status === 'finalizado').length;

  const totalPipelineValue = tasks.reduce((sum, t) => sum + (t.value || 0), 0);
  const finishedValue = tasks
    .filter((t) => t.status === 'finalizado')
    .reduce((sum, t) => sum + (t.value || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="border-b border-slate-800 bg-[#0c1220] px-6 py-4">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
          <span className="text-xs text-slate-400 block mb-1">Total de Tarefas</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-white">{totalCount}</span>
            <span className="text-xs text-slate-500">registradas</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
          <span className="text-xs text-slate-400 block mb-1">Em Andamento</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-sky-400">{emAndamentoCount}</span>
            <span className="text-xs text-slate-500">ativas</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
          <span className="text-xs text-slate-400 block mb-1">Finalizadas</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-emerald-400">{finalizadoCount}</span>
            <span className="text-xs text-slate-500">concluídas</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
          <span className="text-xs text-slate-400 block mb-1">Valor Total Pipeline</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-slate-100">
              {formatCurrency(totalPipelineValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar por cliente, título ou observação..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3.5 py-1.5 text-xs text-slate-200 bg-slate-900/80 border border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 placeholder-slate-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 whitespace-nowrap">Prioridade:</span>
          <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
            {['todos', 'urgente', 'alta', 'media', 'baixa'].map((p) => (
              <button
                key={p}
                onClick={() => onPriorityFilterChange(p)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                  priorityFilter === p
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p === 'media' ? 'Média' : p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
