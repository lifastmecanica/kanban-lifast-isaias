import React, { useState, useEffect, useCallback } from 'react';
import { CRMTask, TaskStatus } from './types/crm';
import { TopNav } from './components/TopNav';
import { StatsBar } from './components/StatsBar';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskModal } from './components/TaskModal';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import {
  getStoredSupabaseCredentials,
  testSupabaseConnection,
  fetchTasksFromSupabase,
  insertTaskToSupabase,
  updateTaskStatusInSupabase,
  updateTaskInSupabase,
  deleteTaskFromSupabase,
  subscribeToSupabaseRealtime,
} from './lib/supabase';
import { AlertCircle, PlusCircle, CheckCircle } from 'lucide-react';

const LOCAL_STORAGE_TASKS_KEY = 'crm_kanban_local_tasks';

export default function App() {
  // "(não crie informações de modelo)" -> Starts completely empty!
  const [tasks, setTasks] = useState<CRMTask[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('todos');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalInitialStatus, setTaskModalInitialStatus] = useState<TaskStatus>('não iniciado');
  const [taskToEdit, setTaskToEdit] = useState<CRMTask | null>(null);

  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<CRMTask | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 3500);
  };

  // Helper to persist locally
  const saveTasksLocally = (newTasks: CRMTask[]) => {
    setTasks(newTasks);
    try {
      localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(newTasks));
    } catch (e) {
      console.error('Falha ao salvar no localStorage:', e);
    }
  };

  // Check Supabase connection on mount
  const checkSupabase = useCallback(async () => {
    const creds = getStoredSupabaseCredentials();
    if (!creds.url || !creds.anonKey) {
      setIsSupabaseConnected(false);
      return;
    }

    setIsSyncing(true);
    const testResult = await testSupabaseConnection();
    if (testResult.success && testResult.tableExists) {
      setIsSupabaseConnected(true);
      // Fetch latest tasks from Supabase
      const { tasks: remoteTasks, error } = await fetchTasksFromSupabase();
      if (!error && remoteTasks) {
        setTasks(remoteTasks);
        localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(remoteTasks));
      }
    } else if (testResult.success) {
      // Supabase is reachable, but table is pending creation
      setIsSupabaseConnected(true);
      showNotification('Conectado ao Supabase! Execute o script SQL para criar a tabela "crm_tasks".', 'info');
    } else {
      setIsSupabaseConnected(false);
    }
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    checkSupabase();
  }, [checkSupabase]);

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!isSupabaseConnected) return;

    const unsubscribe = subscribeToSupabaseRealtime((payload) => {
      if (payload.eventType === 'INSERT') {
        const newTask = payload.new as CRMTask;
        setTasks((prev) => {
          if (prev.some((t) => t.id === newTask.id)) return prev;
          const updated = [newTask, ...prev];
          localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(updated));
          return updated;
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedTask = payload.new as CRMTask;
        setTasks((prev) => {
          const updated = prev.map((t) => (t.id === updatedTask.id ? updatedTask : t));
          localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(updated));
          return updated;
        });
      } else if (payload.eventType === 'DELETE') {
        const deletedId = payload.old.id;
        setTasks((prev) => {
          const updated = prev.filter((t) => t.id !== deletedId);
          localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isSupabaseConnected]);

  // Handle Create or Edit Task
  const handleSaveTask = async (
    taskData: Omit<CRMTask, 'id' | 'created_at' | 'updated_at'>,
    existingId?: string
  ) => {
    const nowIso = new Date().toISOString();

    if (existingId) {
      // Edit existing
      const updatedTask: CRMTask = {
        ...taskData,
        id: existingId,
        created_at: taskToEdit?.created_at || nowIso,
        updated_at: nowIso,
      };

      const updatedList = tasks.map((t) => (t.id === existingId ? updatedTask : t));
      saveTasksLocally(updatedList);
      showNotification('Tarefa atualizada com sucesso!', 'success');

      if (isSupabaseConnected) {
        const res = await updateTaskInSupabase(updatedTask);
        if (res.error) {
          showNotification(`Aviso: salvo localmente. Erro no Supabase: ${res.error}`, 'error');
        }
      }
    } else {
      // Create new
      const newTask: CRMTask = {
        ...taskData,
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `task_${Date.now()}`,
        created_at: nowIso,
        updated_at: nowIso,
      };

      const updatedList = [newTask, ...tasks];
      saveTasksLocally(updatedList);
      showNotification('Nova tarefa criada no Kanban!', 'success');

      if (isSupabaseConnected) {
        const res = await insertTaskToSupabase(newTask);
        if (res.error) {
          showNotification(`Aviso: salvo localmente. Erro no Supabase: ${res.error}`, 'error');
        }
      }
    }

    setTaskToEdit(null);
  };

  // Handle Drag or Quick Status Change
  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === newStatus) return;

    const updatedTask = { ...task, status: newStatus, updated_at: new Date().toISOString() };
    const updatedList = tasks.map((t) => (t.id === id ? updatedTask : t));
    saveTasksLocally(updatedList);

    if (selectedTaskForDetails && selectedTaskForDetails.id === id) {
      setSelectedTaskForDetails(updatedTask);
    }

    if (isSupabaseConnected) {
      const res = await updateTaskStatusInSupabase(id, newStatus);
      if (res.error) {
        showNotification(`Status alterado localmente. Supabase: ${res.error}`, 'error');
      }
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (id: string) => {
    const updatedList = tasks.filter((t) => t.id !== id);
    saveTasksLocally(updatedList);
    showNotification('Tarefa excluída.', 'info');

    if (isSupabaseConnected) {
      await deleteTaskFromSupabase(id);
    }
  };

  // Filter tasks based on search & priority
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.notes && task.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.contact_info && task.contact_info.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority =
      priorityFilter === 'todos' || task.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Top Bar Contract */}
      <TopNav
        onOpenNewTask={() => {
          setTaskToEdit(null);
          setTaskModalInitialStatus('não iniciado');
          setIsTaskModalOpen(true);
        }}
        onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        isSyncing={isSyncing}
        onRefresh={checkSupabase}
      />

      {/* Floating Notification */}
      {notification && (
        <div className="fixed top-16 right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-2.5 rounded-lg border text-xs font-medium shadow-xl flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
                : notification.type === 'error'
                ? 'bg-rose-950/90 border-rose-800 text-rose-200'
                : 'bg-slate-900/90 border-slate-700 text-slate-200'
            }`}
          >
            {notification.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Stats Bar & Filtering */}
      <StatsBar
        tasks={tasks}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
      />

      {/* Supabase Status Prompt if disconnected and user has no keys */}
      {!isSupabaseConnected && (
        <div className="mx-6 mt-4 p-3 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span>
              O sistema está pronto para salvar no <strong>Supabase</strong>. Conecte sua URL e Chave Anon ou continue usando o armazenamento local.
            </span>
          </div>
          <button
            onClick={() => setIsSupabaseModalOpen(true)}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 underline whitespace-nowrap"
          >
            Configurar Supabase
          </button>
        </div>
      )}

      {/* Empty board state prompt if 0 tasks overall */}
      {tasks.length === 0 && (
        <div className="mx-6 mt-6 p-6 border border-slate-800/80 bg-[#0d1424] rounded-xl text-center">
          <div className="inline-flex p-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-3">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-white mb-1">
            Nenhuma tarefa cadastrada no CRM
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            O quadro está limpo sem dados de modelo, conforme solicitado. Crie manualmente suas tarefas para os status <strong>não iniciado</strong>, <strong>em andamento</strong> e <strong>finalizado</strong>.
          </p>
          <button
            onClick={() => {
              setTaskToEdit(null);
              setTaskModalInitialStatus('não iniciado');
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
          >
            <span>+ Criar Primeira Tarefa Manualmente</span>
          </button>
        </div>
      )}

      {/* Main Kanban Board with 3 explicit statuses */}
      <main className="flex-1 flex flex-col">
        <KanbanBoard
          tasks={filteredTasks}
          onStatusChange={handleStatusChange}
          onEditTask={(task) => {
            setTaskToEdit(task);
            setIsTaskModalOpen(true);
          }}
          onDeleteTask={handleDeleteTask}
          onSelectTask={(task) => setSelectedTaskForDetails(task)}
          onNewTaskWithStatus={(status) => {
            setTaskToEdit(null);
            setTaskModalInitialStatus(status);
            setIsTaskModalOpen(true);
          }}
        />
      </main>

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={handleSaveTask}
        initialStatus={taskModalInitialStatus}
        taskToEdit={taskToEdit}
      />

      {/* Task Details Drawer/Modal */}
      <TaskDetailsModal
        task={selectedTaskForDetails}
        onClose={() => setSelectedTaskForDetails(null)}
        onEdit={(task) => {
          setSelectedTaskForDetails(null);
          setTaskToEdit(task);
          setIsTaskModalOpen(true);
        }}
        onDelete={(id) => {
          handleDeleteTask(id);
          setSelectedTaskForDetails(null);
        }}
        onStatusChange={(id, newStatus) => {
          handleStatusChange(id, newStatus);
        }}
      />

      {/* Supabase Configuration Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        isConnected={isSupabaseConnected}
        onConnectionChange={(connected) => {
          setIsSupabaseConnected(connected);
          if (connected) {
            checkSupabase();
          }
        }}
        localTasks={tasks}
        onTasksSynced={() => {
          checkSupabase();
          showNotification('Tarefas sincronizadas com o Supabase!', 'success');
        }}
      />
    </div>
  );
}
