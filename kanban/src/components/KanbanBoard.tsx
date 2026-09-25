import React, { useState } from 'react';
import { CRMTask, TaskStatus } from '../types/crm';
import { TaskCard } from './TaskCard';
import { Plus, Inbox } from 'lucide-react';

interface KanbanBoardProps {
  tasks: CRMTask[];
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onEditTask: (task: CRMTask) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask: (task: CRMTask) => void;
  onNewTaskWithStatus: (status: TaskStatus) => void;
}

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  dotColor: string;
  badgeBg: string;
  accentBorder: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'não iniciado',
    title: 'Não iniciado',
    dotColor: 'bg-zinc-400',
    badgeBg: 'bg-zinc-800 text-zinc-300',
    accentBorder: 'border-t-zinc-400',
  },
  {
    id: 'em andamento',
    title: 'Em andamento',
    dotColor: 'bg-sky-400',
    badgeBg: 'bg-sky-950 text-sky-300',
    accentBorder: 'border-t-sky-400',
  },
  {
    id: 'finalizado',
    title: 'Finalizado',
    dotColor: 'bg-emerald-400',
    badgeBg: 'bg-emerald-950 text-emerald-300',
    accentBorder: 'border-t-emerald-400',
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  onSelectTask,
  onNewTaskWithStatus,
}) => {
  const [activeDragCol, setActiveDragCol] = useState<TaskStatus | null>(null);

  const handleDragOver = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDragCol !== colId) {
      setActiveDragCol(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the column element itself
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setActiveDragCol(null);
  };

  const handleDrop = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    setActiveDragCol(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onStatusChange(taskId, colId);
    }
  };

  const formatTotalValue = (items: CRMTask[]) => {
    const sum = items.reduce((acc, cur) => acc + (cur.value || 0), 0);
    if (sum === 0) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(sum);
  };

  return (
    <div className="flex-1 p-6 overflow-x-auto min-h-[calc(100vh-210px)]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-[860px] h-full items-start">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          const totalVal = formatTotalValue(colTasks);
          const isDragOver = activeDragCol === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col bg-[#0b101c] rounded-xl border border-slate-800/80 border-t-2 ${col.accentBorder} transition-all duration-150 min-h-[480px] ${
                isDragOver ? 'ring-2 ring-blue-500/80 bg-[#101728]' : ''
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    {col.title}
                  </h3>
                  <span className="font-mono tabular-nums text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {totalVal && (
                    <span className="font-mono tabular-nums text-xs text-slate-400">
                      {totalVal}
                    </span>
                  )}
                  <button
                    onClick={() => onNewTaskWithStatus(col.id)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                    title={`Adicionar tarefa em "${col.title}"`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tasks List */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-800/60 rounded-lg">
                    <Inbox className="w-7 h-7 text-slate-600 mb-2" />
                    <p className="text-xs font-medium text-slate-400 mb-1">
                      Nenhuma tarefa neste status
                    </p>
                    <p className="text-[11px] text-slate-500 mb-3 max-w-[200px]">
                      Arraste um card até aqui ou crie manualmente uma nova tarefa.
                    </p>
                    <button
                      onClick={() => onNewTaskWithStatus(col.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Criar tarefa</span>
                    </button>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={onStatusChange}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      onSelect={onSelectTask}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
