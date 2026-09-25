import React from 'react';
import { CRMTask, TaskStatus } from '../types/crm';
import { X, Calendar, User, Phone, DollarSign, Clock, Edit2, Trash2, ArrowRight } from 'lucide-react';

interface TaskDetailsModalProps {
  task: CRMTask | null;
  onClose: () => void;
  onEdit: (task: CRMTask) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  if (!task) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const priorityLabels: Record<string, { label: string; textClass: string }> = {
    urgente: { label: 'Urgente', textClass: 'text-rose-400 font-semibold' },
    alta: { label: 'Alta', textClass: 'text-amber-400 font-medium' },
    media: { label: 'Média', textClass: 'text-sky-400' },
    baixa: { label: 'Baixa', textClass: 'text-slate-400' },
  };

  const priorityInfo = priorityLabels[task.priority] || priorityLabels.media;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-200">{task.client_name}</span>
            </div>
            <h3 className="text-lg font-semibold text-white leading-tight">
              {task.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status selector bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
            <span className="text-xs text-slate-400 block mb-2 font-medium">
              Mudar Status no Kanban:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['não iniciado', 'em andamento', 'finalizado'] as TaskStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onStatusChange(task.id, st)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg capitalize transition-colors text-center ${
                    task.status === st
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Key Grid Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 border border-slate-800/60 rounded-lg p-3">
              <span className="text-[11px] text-slate-500 block mb-1">Valor Estimado</span>
              <span className="text-lg font-bold font-mono tabular-nums text-emerald-400">
                {formatCurrency(task.value)}
              </span>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/60 rounded-lg p-3">
              <span className="text-[11px] text-slate-500 block mb-1">Prioridade</span>
              <span className={`text-sm ${priorityInfo.textClass}`}>
                {priorityInfo.label}
              </span>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/60 rounded-lg p-3">
              <span className="text-[11px] text-slate-500 block mb-1">Contato</span>
              <span className="text-xs text-slate-300">
                {task.contact_info || 'Nenhum contato informado'}
              </span>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/60 rounded-lg p-3">
              <span className="text-[11px] text-slate-500 block mb-1">Prazo / Limite</span>
              <span className="text-xs font-mono tabular-nums text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {task.due_date || 'Sem prazo definido'}
              </span>
            </div>
          </div>

          {/* CRM Notes */}
          {task.notes && (
            <div>
              <span className="text-xs font-medium text-slate-400 block mb-1.5">
                Observações / Histórico:
              </span>
              <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {task.notes}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col gap-1">
            <span>Criado em: {formatDate(task.created_at)}</span>
            <span>Última atualização: {formatDate(task.updated_at)}</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/40">
          <button
            onClick={() => {
              if (window.confirm(`Excluir a tarefa "${task.title}"?`)) {
                onDelete(task.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
