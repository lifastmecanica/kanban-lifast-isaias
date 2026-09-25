export type TaskStatus = 'não iniciado' | 'em andamento' | 'finalizado';

export type TaskPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export interface CRMTask {
  id: string;
  title: string;
  client_name: string;
  contact_info?: string;
  value: number;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseConfigState {
  url: string;
  anonKey: string;
  isConnected: boolean;
  statusMessage: string;
  isTesting: boolean;
}
