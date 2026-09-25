import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CRMTask, TaskStatus } from '../types/crm';

const STORAGE_KEY_URL = 'crm_supabase_url';
const STORAGE_KEY_KEY = 'crm_supabase_anon_key';

export const SUPABASE_SQL_SETUP = `-- ============================================================
-- SCRIPT COMPLETO DE CONFIGURAÇÃO DO CRM KANBAN NO SUPABASE
-- Execute no SQL Editor do Supabase (Dashboard > SQL Editor > New query)
-- ============================================================

-- 1. TABELA DE TAREFAS / OPORTUNIDADES DO CRM
create table if not exists public.crm_tasks (
  id text primary key,
  title text not null,
  client_name text not null,
  contact_info text,
  value numeric default 0,
  status text not null check (status in ('não iniciado', 'em andamento', 'finalizado')),
  priority text default 'media' check (priority in ('baixa', 'media', 'alta', 'urgente')),
  due_date text,
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Índices para buscas rápidas
create index if not exists idx_crm_tasks_status on public.crm_tasks(status);
create index if not exists idx_crm_tasks_created on public.crm_tasks(created_at desc);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS) NA TABELA
alter table public.crm_tasks enable row level security;

-- Políticas de Armazenamento de Dados (RLS) - Permissões Granulares
drop policy if exists "crm_tasks_select_policy" on public.crm_tasks;
create policy "crm_tasks_select_policy"
  on public.crm_tasks for select
  using (true);

drop policy if exists "crm_tasks_insert_policy" on public.crm_tasks;
create policy "crm_tasks_insert_policy"
  on public.crm_tasks for insert
  with check (true);

drop policy if exists "crm_tasks_update_policy" on public.crm_tasks;
create policy "crm_tasks_update_policy"
  on public.crm_tasks for update
  using (true)
  with check (true);

drop policy if exists "crm_tasks_delete_policy" on public.crm_tasks;
create policy "crm_tasks_delete_policy"
  on public.crm_tasks for delete
  using (true);

-- 3. BUCKET DE ARMAZENAMENTO DE ARQUIVOS (SUPABASE STORAGE)
-- Cria o bucket 'crm_anexos' para propostas, comprovantes e documentos do cliente
insert into storage.buckets (id, name, public)
values ('crm_anexos', 'crm_anexos', true)
on conflict (id) do update set public = true;

-- Políticas de Armazenamento de Objetos (Storage Objects RLS)
-- Permite leitura/download de arquivos do bucket crm_anexos
drop policy if exists "Permitir leitura de arquivos crm_anexos" on storage.objects;
create policy "Permitir leitura de arquivos crm_anexos"
  on storage.objects for select
  using (bucket_id = 'crm_anexos');

-- Permite upload de arquivos no bucket crm_anexos
drop policy if exists "Permitir upload de arquivos crm_anexos" on storage.objects;
create policy "Permitir upload de arquivos crm_anexos"
  on storage.objects for insert
  with check (bucket_id = 'crm_anexos');

-- Permite atualização de arquivos no bucket crm_anexos
drop policy if exists "Permitir atualizar arquivos crm_anexos" on storage.objects;
create policy "Permitir atualizar arquivos crm_anexos"
  on storage.objects for update
  using (bucket_id = 'crm_anexos');

-- Permite exclusão de arquivos no bucket crm_anexos
drop policy if exists "Permitir deletar arquivos crm_anexos" on storage.objects;
create policy "Permitir deletar arquivos crm_anexos"
  on storage.objects for delete
  using (bucket_id = 'crm_anexos');

-- 4. HABILITAR SINCRONIZAÇÃO EM TEMPO REAL (REALTIME)
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table public.crm_tasks;
commit;
`;

let cachedClient: SupabaseClient | null = null;
let currentUrl: string = '';
let currentKey: string = '';

export function getStoredSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  const storedUrl = localStorage.getItem(STORAGE_KEY_URL) || envUrl;
  const storedKey = localStorage.getItem(STORAGE_KEY_KEY) || envKey;

  return {
    url: storedUrl.trim(),
    anonKey: storedKey.trim(),
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  if (cleanUrl) {
    localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
  }

  if (cleanKey) {
    localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
  } else {
    localStorage.removeItem(STORAGE_KEY_KEY);
  }

  cachedClient = null;
  currentUrl = '';
  currentKey = '';
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseCredentials();

  if (!url || !anonKey) {
    return null;
  }

  if (cachedClient && currentUrl === url && currentKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentUrl = url;
    currentKey = anonKey;
    return cachedClient;
  } catch (error) {
    console.error('Falha ao inicializar Supabase Client:', error);
    return null;
  }
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  tableExists: boolean;
}

export async function testSupabaseConnection(
  url?: string,
  anonKey?: string
): Promise<ConnectionTestResult> {
  const creds = url && anonKey ? { url: url.trim(), anonKey: anonKey.trim() } : getStoredSupabaseCredentials();

  if (!creds.url || !creds.anonKey) {
    return {
      success: false,
      message: 'Insira a URL e a Chave Anon do projeto Supabase.',
      tableExists: false,
    };
  }

  if (!creds.url.startsWith('https://')) {
    return {
      success: false,
      message: 'A URL do Supabase deve começar com https:// (ex: https://xxx.supabase.co).',
      tableExists: false,
    };
  }

  try {
    const testClient = createClient(creds.url, creds.anonKey);
    // Tentar consultar a tabela crm_tasks
    const { data, error } = await testClient.from('crm_tasks').select('id').limit(1);

    if (error) {
      // Se o erro for de tabela inexistente (42P01)
      if (error.code === '42P01' || error.message.includes('relation "public.crm_tasks" does not exist')) {
        return {
          success: true,
          tableExists: false,
          message: 'Conectado ao Supabase com sucesso! Porém a tabela "crm_tasks" ainda não foi criada. Execute o script SQL fornecido abaixo.',
        };
      }
      return {
        success: false,
        tableExists: false,
        message: `Erro do Supabase: ${error.message}`,
      };
    }

    return {
      success: true,
      tableExists: true,
      message: 'Conectado com sucesso ao Supabase e tabela "crm_tasks" pronta!',
    };
  } catch (err: any) {
    return {
      success: false,
      tableExists: false,
      message: `Falha na requisição: ${err.message || 'Verifique a URL e chave'}`,
    };
  }
}

export async function fetchTasksFromSupabase(): Promise<{ tasks: CRMTask[]; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { tasks: [], error: 'Supabase não configurado' };
  }

  try {
    const { data, error } = await client
      .from('crm_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { tasks: [], error: error.message };
    }

    const tasks: CRMTask[] = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      client_name: row.client_name,
      contact_info: row.contact_info || '',
      value: Number(row.value) || 0,
      status: row.status as TaskStatus,
      priority: row.priority || 'media',
      due_date: row.due_date || '',
      notes: row.notes || '',
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
    }));

    return { tasks, error: null };
  } catch (err: any) {
    return { tasks: [], error: err.message || 'Erro ao carregar do Supabase' };
  }
}

export async function insertTaskToSupabase(task: CRMTask): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase não conectado' };
  }

  try {
    const { error } = await client.from('crm_tasks').insert([
      {
        id: task.id,
        title: task.title,
        client_name: task.client_name,
        contact_info: task.contact_info || null,
        value: task.value || 0,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date || null,
        notes: task.notes || null,
        created_at: task.created_at,
        updated_at: task.updated_at,
      },
    ]);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateTaskStatusInSupabase(
  id: string,
  status: TaskStatus
): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase não conectado' };
  }

  try {
    const { error } = await client
      .from('crm_tasks')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateTaskInSupabase(task: CRMTask): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase não conectado' };
  }

  try {
    const { error } = await client
      .from('crm_tasks')
      .update({
        title: task.title,
        client_name: task.client_name,
        contact_info: task.contact_info || null,
        value: task.value || 0,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date || null,
        notes: task.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', task.id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteTaskFromSupabase(id: string): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase não conectado' };
  }

  try {
    const { error } = await client.from('crm_tasks').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function bulkSyncTasksToSupabase(
  tasks: CRMTask[]
): Promise<{ count: number; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { count: 0, error: 'Supabase não conectado' };
  }

  if (tasks.length === 0) {
    return { count: 0, error: null };
  }

  try {
    const rows = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      client_name: task.client_name,
      contact_info: task.contact_info || null,
      value: task.value || 0,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || null,
      notes: task.notes || null,
      created_at: task.created_at,
      updated_at: task.updated_at,
    }));

    const { error } = await client.from('crm_tasks').upsert(rows, { onConflict: 'id' });

    if (error) {
      return { count: 0, error: error.message };
    }
    return { count: rows.length, error: null };
  } catch (err: any) {
    return { count: 0, error: err.message };
  }
}

export function subscribeToSupabaseRealtime(
  onPayload: (payload: any) => void
): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const channel = client
      .channel('crm_tasks_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_tasks' },
        (payload) => {
          onPayload(payload);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription not available:', err);
    return null;
  }
}
