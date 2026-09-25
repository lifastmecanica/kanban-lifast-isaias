import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  UploadCloud,
  RefreshCw,
} from 'lucide-react';
import {
  getStoredSupabaseCredentials,
  saveSupabaseCredentials,
  testSupabaseConnection,
  SUPABASE_SQL_SETUP,
  bulkSyncTasksToSupabase,
} from '../lib/supabase';
import { CRMTask } from '../types/crm';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
  localTasks: CRMTask[];
  onTasksSynced: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  isConnected,
  onConnectionChange,
  localTasks,
  onTasksSynced,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tableExists: boolean;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const creds = getStoredSupabaseCredentials();
      setUrl(creds.url);
      setAnonKey(creds.anonKey);
      setTestResult(null);
      setSyncFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection(url, anonKey);
    setIsTesting(false);
    setTestResult(result);
  };

  const handleSave = async () => {
    setIsTesting(true);
    const result = await testSupabaseConnection(url, anonKey);
    setIsTesting(false);
    setTestResult(result);

    if (result.success) {
      saveSupabaseCredentials(url, anonKey);
      onConnectionChange(true);
    }
  };

  const handleDisconnect = () => {
    saveSupabaseCredentials('', '');
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    onConnectionChange(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleBulkSync = async () => {
    if (!isConnected || localTasks.length === 0) return;
    setIsSyncing(true);
    setSyncFeedback(null);

    const result = await bulkSyncTasksToSupabase(localTasks);
    setIsSyncing(false);

    if (result.error) {
      setSyncFeedback(`Erro ao sincronizar: ${result.error}`);
    } else {
      setSyncFeedback(`${result.count} tarefa(s) sincronizada(s) com sucesso no Supabase!`);
      onTasksSynced();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Conectar ao Supabase
              </h3>
              <p className="text-xs text-slate-400">
                Pronto para persistência em nuvem e sincronização em tempo real.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status banner */}
          <div
            className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 ${
              isConnected
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                : 'bg-amber-950/30 border-amber-800/60 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isConnected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div>
                <span className="text-xs font-semibold block">
                  {isConnected ? 'Supabase Conectado' : 'Supabase Pronto para Conectar'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {isConnected
                    ? 'As alterações no Kanban são salvas diretamente no seu banco de dados Supabase.'
                    : 'Cole as credenciais do seu projeto Supabase abaixo para salvar tudo na nuvem.'}
                </span>
              </div>
            </div>

            {isConnected && (
              <button
                onClick={handleDisconnect}
                className="px-2.5 py-1 text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-950/50 rounded border border-rose-800/40 transition-colors whitespace-nowrap"
              >
                Desconectar
              </button>
            )}
          </div>

          {/* Credentials Inputs */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Project URL do Supabase
                </label>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <span>Abrir Supabase Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Chave Pública (anon key)
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* Test result message */}
            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs border ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}
              >
                {testResult.message}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !url || !anonKey}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Testar Conexão</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isTesting || !url || !anonKey}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition-colors"
              >
                Salvar e Conectar
              </button>
            </div>
          </div>

          {/* Sync Local Tasks Button if any exist */}
          {isConnected && localTasks.length > 0 && (
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Sincronizar Tarefas Locais
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Você possui {localTasks.length} tarefa(s) criadas neste navegador.
                  </span>
                </div>
                <button
                  onClick={handleBulkSync}
                  disabled={isSyncing}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{isSyncing ? 'Sincronizando...' : 'Enviar para Nuvem'}</span>
                </button>
              </div>
              {syncFeedback && (
                <div className="mt-2 text-xs text-sky-400 font-medium">
                  {syncFeedback}
                </div>
              )}
            </div>
          )}

          {/* SQL Setup Instruction Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Script SQL para criação da tabela (1-Clique)
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Execute no SQL Editor do Supabase para criar a tabela com os 3 status.
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3.5 text-[11px] font-mono leading-relaxed text-slate-300 bg-[#090d16] border border-slate-800 rounded-lg overflow-x-auto max-h-48 selection:bg-blue-800">
              {SUPABASE_SQL_SETUP}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
