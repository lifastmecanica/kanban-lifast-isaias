import React, { useState, useEffect } from 'react';
import { CRMTask, TaskStatus, TaskPriority } from '../types/crm';
import { X, DollarSign, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<CRMTask, 'id' | 'created_at' | 'updated_at'>, existingId?: string) => void;
  initialStatus?: TaskStatus;
  taskToEdit?: CRMTask | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialStatus = 'não iniciado',
  taskToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ title?: string; clientName?: string }>({});

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setClientName(taskToEdit.client_name);
      setContactInfo(taskToEdit.contact_info || '');
      setValue(taskToEdit.value ? taskToEdit.value.toString() : '');
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority || 'media');
      setDueDate(taskToEdit.due_date || '');
      setNotes(taskToEdit.notes || '');
    } else {
      setTitle('');
      setClientName('');
      setContactInfo('');
      setValue('');
      setStatus(initialStatus);
      setPriority('media');
      setDueDate('');
      setNotes('');
    }
    setErrors({});
  }, [taskToEdit, initialStatus, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; clientName?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'O título da tarefa é obrigatório.';
    }
    if (!clientName.trim()) {
      newErrors.clientName = 'O nome do cliente/empresa é obrigatório.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const numericVal = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;

    onSave(
      {
        title: title.trim(),
        client_name: clientName.trim(),
        contact_info: contactInfo.trim(),
        value: numericVal,
        status,
        priority,
        due_date: dueDate,
        notes: notes.trim(),
      },
      taskToEdit ? taskToEdit.id : undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-white">
              {taskToEdit ? 'Editar Tarefa do CRM' : 'Nova Tarefa Manual'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Preencha os dados do cliente e da oportunidade para o Kanban.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Título */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Título da Tarefa / Oportunidade <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Apresentar proposta comercial, Revisão do contrato"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              className={`w-full px-3.5 py-2 text-sm bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                errors.title ? 'border-rose-500' : 'border-slate-800'
              }`}
            />
            {errors.title && <span className="text-xs text-rose-400 mt-1 block">{errors.title}</span>}
          </div>

          {/* Cliente e Contato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Cliente / Empresa <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: TechCorp Brasil, João Silva"
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value);
                  if (errors.clientName) setErrors((prev) => ({ ...prev, clientName: undefined }));
                }}
                className={`w-full px-3.5 py-2 text-sm bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                  errors.clientName ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {errors.clientName && (
                <span className="text-xs text-rose-400 mt-1 block">{errors.clientName}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Contato (WhatsApp / E-mail)
              </label>
              <input
                type="text"
                placeholder="Ex: (11) 98765-4321 ou joao@empresa.com"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Valor e Data Limite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Valor Estimado (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                  R$
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0,00"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-sm font-mono tabular-nums bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Data Limite / Prazo
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Status e Prioridade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Status no Kanban
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3.5 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="não iniciado">Não iniciado</option>
                <option value="em andamento">Em andamento</option>
                <option value="finalizado">Finalizado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Observações / Notas */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Notas do CRM / Histórico
            </label>
            <textarea
              rows={3}
              placeholder="Detalhes da conversa, necessidades do cliente, próximos passos..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              {taskToEdit ? 'Salvar Alterações' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
