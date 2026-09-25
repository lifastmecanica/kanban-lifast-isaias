import React from 'react';
import { Database, Plus, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TopNavProps {
  onOpenNewTask: () => void;
  onOpenSupabaseConfig: () => void;
  isSupabaseConnected: boolean;
  isSyncing: boolean;
  onRefresh: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenNewTask,
  onOpenSupabaseConfig,
  isSupabaseConnected,
  isSyncing,
  onRefresh,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-[#090d16]/95 backdrop-blur-md">
      {/* Zone 1: Single element Brand Wordmark */}
      <div className="flex items-center gap-3">
        <a href="/" className="text-lg font-bold tracking-tight text-white hover:text-slate-200 transition-colors">
          CRM Kanban
        </a>
      </div>

      {/* Zone 2: Navigation / Workspace indicators */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <span className="text-slate-200 font-semibold">Quadro Operacional</span>
        <span className="text-slate-600">/</span>
        <span>Fluxo de Oportunidades</span>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          title="Recarregar e sincronizar"
          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-lg transition-colors"
          disabled={isSyncing}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
        </button>

        <button
          onClick={onOpenSupabaseConfig}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            isSupabaseConnected
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {isSupabaseConnected ? 'Supabase Conectado' : 'Conectar Supabase'}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
        </button>

        <button
          onClick={onOpenNewTask}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Tarefa</span>
        </button>
      </div>
    </header>
  );
};
