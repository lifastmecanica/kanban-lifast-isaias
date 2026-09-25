import React from 'react';
import { CRMTask, TaskStatus } from '../types/crm';
import { Calendar, User, DollarSign, ArrowRight, ArrowLeft, MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface TaskCardProps {
  task: CRMTask;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onEdit: (task: CRMTask) => void;
  onDelete: (id: string) => void;
  onSelect: (task: CRMTask) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  onSelect,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const priorityLabels: Record<string, { label: string; textClass: string }> = {
    urgente: { label: 'Urgente', textClass: 'text-rose-400 font-semibold' },
    alta: { label: 'Alta', textClass: 'text-amber-400 font-medium' },
    media: { label: 'Média', textClass: 'text-sky-400' },
    baixa: { label: 'Baixa', textClass: 'text-slate-400' },
  };

  const priorityInfo = priorityLabels[task.priority] || priorityLabels.media;

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onSelect(task)}
      className="group relative bg-[#131c2e] hover:bg-[#18233a] border border-slate-800/90 hover:border-slate-700 rounded-lg p-3.5 shadow-sm transition-all duration-150 cursor-grab active:cursor-grabbing text-left"
    >
      {/* Header: Client & Menu */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="font-semibold text-slate-200 truncate">{task.client_name}</span>
        </div>

        {/* Action menu trigger */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-slate-500 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
            title="Opções da tarefa"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-6 z-50 w-36 bg-[#0f172a] border border-slate-800 rounded-md shadow-xl py-1 text-xs">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(task);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (window.confirm(`Excluir a tarefa "${task.title}"?`)) {
                      onDelete(task.id);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-400 hover:bg-rose-950/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h4 className="text-sm font-medium text-white mb-2 leading-snug break-words">
        {task.title}
      </h4>

      {/* Contact info or notes snippet if available */}
      {task.contact_info && (
        <p className="text-xs text-slate-400 truncate mb-2">
          {task.contact_info}
        </p>
      )}

      {/* Value & Metadata Row */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
        <div className="font-mono tabular-nums font-semibold text-emerald-400">
          {formatCurrency(task.value)}
        </div>

        {/* Unboxed metadata without pills */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className={priorityInfo.textClass}>{priorityInfo.label}</span>
          {task.due_date && (
            <>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono tabular-nums text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                {task.due_date}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Status quick mover buttons on footer */}
      <div
        className="mt-3 pt-2 border-t border-slate-800/40 flex items-center justify-between text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[11px] text-slate-500 font-medium">Mover:</span>
        <div className="flex items-center gap-1">
          {task.status !== 'não iniciado' && (
            <button
              onClick={() => {
                const prevStatus: TaskStatus =
                  task.status === 'finalizado' ? 'em andamento' : 'não iniciado';
                onStatusChange(task.id, prevStatus);
              }}
              className="px-2 py-0.5 text-[11px] font-medium text-slate-300 bg-slate-800/90 hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
              title="Mover para status anterior"
            >
              <ArrowLeft className="w-2.5 h-2.5" />
              <span>
                {task.status === 'finalizado' ? 'Em andamento' : 'Não iniciado'}
              </span>
            </button>
          )}

          {task.status !== 'finalizado' && (
            <button
              onClick={() => {
                const nextStatus: TaskStatus =
                  task.status === 'não iniciado' ? 'em andamento' : 'finalizado';
                onStatusChange(task.id, nextStatus);
              }}
              className="px-2 py-0.5 text-[11px] font-medium text-slate-300 bg-slate-800/90 hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
              title="Mover para próximo status"
            >
              <span>
                {task.status === 'não iniciado' ? 'Em andamento' : 'Finalizar'}
              </span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
