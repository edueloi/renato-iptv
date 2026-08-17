import React, { useState, useEffect } from 'react';
import { 
  Bot, Play, CheckCircle2, AlertCircle, Clock, RefreshCw, Send, Settings, 
  FileText, MessageSquare, Trash2, Filter, Zap, PauseCircle 
} from 'lucide-react';
import { BotConfig, BotLog } from '../types';
import { formatDateTimeBR, formatPhoneBR } from '../utils/masks';
import { ConfirmModal } from './ConfirmModal';

export const BotAutomationCenter: React.FC = () => {
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logFilter, setLogFilter] = useState<'TODOS' | 'ENVIADO' | 'ERRO'>('TODOS');
  const [isConfirmClearLogsOpen, setIsConfirmClearLogsOpen] = useState(false);
  const [secondsToNextRun, setSecondsToNextRun] = useState(300);
  const [msgStatus, setMsgStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchBotData();
  }, []);

  // Timer countdown for 5 minute cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsToNextRun(prev => (prev <= 1 ? 300 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchBotData = async () => {
    setLoading(true);
    try {
      const [resConf, resLogs] = await Promise.all([
        fetch('/api/bot/config'),
        fetch('/api/bot/logs')
      ]);

      if (resConf.ok) {
        const confJson = await resConf.json();
        setConfig(confJson);
      }
      if (resLogs.ok) {
        const logsJson = await resLogs.json();
        setLogs(logsJson);
      }
    } catch (err) {
      console.error('Error loading bot data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBot = async () => {
    if (!config) return;
    try {
      const updated = { ...config, enabled: !config.enabled };
      const res = await fetch('/api/bot/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setConfig(updated);
      }
    } catch (err) {
      console.error('Error toggling bot:', err);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    try {
      const res = await fetch('/api/bot/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setMsgStatus('Configurações do Bot salvas com sucesso!');
        setTimeout(() => setMsgStatus(null), 3000);
      }
    } catch (err) {
      console.error('Error saving bot config:', err);
    }
  };

  const handleTriggerNow = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bot/trigger', { method: 'POST' });
      if (res.ok) {
        setSecondsToNextRun(300);
        fetchBotData();
        setMsgStatus('Disparo manual executado com sucesso!');
        setTimeout(() => setMsgStatus(null), 3000);
      }
    } catch (err) {
      console.error('Error triggering bot manually:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeClearLogs = async () => {
    try {
      const res = await fetch('/api/bot/logs', { method: 'DELETE' });
      if (res.ok) {
        fetchBotData();
      }
    } catch (err) {
      console.error('Error clearing bot logs:', err);
    } finally {
      setIsConfirmClearLogsOpen(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const filteredLogs = logs.filter(l => logFilter === 'TODOS' || l.status === logFilter);
  const successCount = logs.filter(l => l.status === 'ENVIADO').length;
  const errorCount = logs.filter(l => l.status === 'ERRO').length;

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      {/* Bot Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${config?.enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                Central de Bot & Disparo de Clientes Inativos
              </h3>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                config?.enabled 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 animate-pulse' 
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 border border-slate-200'
              }`}>
                {config?.enabled ? 'BOT ATIVO (a cada 5 min)' : 'BOT PAUSADO'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Próximo disparo automático em: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatTimer(secondsToNextRun)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleBot}
            className={`px-3 py-1.5 font-medium rounded-md text-xs border flex items-center gap-1.5 transition-colors shadow-xs ${
              config?.enabled
                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
            }`}
          >
            {config?.enabled ? <PauseCircle className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {config?.enabled ? 'Pausar Bot' : 'Ativar Bot'}
          </button>

          <button
            onClick={handleTriggerNow}
            disabled={loading}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md text-xs border border-indigo-500 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" /> Disparar Agora
          </button>
        </div>
      </div>

      {msgStatus && (
        <div className="p-2.5 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msgStatus}</span>
        </div>
      )}

      {/* Bot KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[11px] block">Total de Disparos</span>
            <span className="text-base font-bold text-slate-800 dark:text-slate-100 font-mono">{logs.length}</span>
          </div>
          <MessageSquare className="w-4 h-4 text-slate-400" />
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[11px] block">Enviados com Sucesso</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">{successCount}</span>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[11px] block">Falhas / Não Enviados</span>
            <span className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono">{errorCount}</span>
          </div>
          <AlertCircle className="w-4 h-4 text-rose-500" />
        </div>
      </div>

      {/* Template Settings & Target Rules */}
      {config && (
        <form onSubmit={handleSaveConfig} className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-indigo-500" /> Modelos de Mensagem WhatsApp Automáticas
            </h4>
            <button
              type="submit"
              className="px-2.5 py-1 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-md text-xs font-medium transition-colors"
            >
              Salvar Modelos
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Target Inactive */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Clientes Inativos</span>
                <input
                  type="checkbox"
                  checked={config.targetInactive}
                  onChange={(e) => setConfig({ ...config, targetInactive: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600"
                />
              </div>
              <textarea
                rows={4}
                value={config.templateInactive}
                onChange={(e) => setConfig({ ...config, templateInactive: e.target.value })}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Target Overdue */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Clientes Vencidos</span>
                <input
                  type="checkbox"
                  checked={config.targetOverdue}
                  onChange={(e) => setConfig({ ...config, targetOverdue: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600"
                />
              </div>
              <textarea
                rows={4}
                value={config.templateOverdue}
                onChange={(e) => setConfig({ ...config, templateOverdue: e.target.value })}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Target Upcoming */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Lembrete A Vencer</span>
                <input
                  type="checkbox"
                  checked={config.targetUpcoming}
                  onChange={(e) => setConfig({ ...config, targetUpcoming: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600"
                />
              </div>
              <textarea
                rows={4}
                value={config.templateUpcoming}
                onChange={(e) => setConfig({ ...config, templateUpcoming: e.target.value })}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic">
            Tags disponíveis para substituição automática: <code className="text-indigo-600 dark:text-indigo-400 font-bold">{`{nome}`}</code>, <code className="text-indigo-600 dark:text-indigo-400 font-bold">{`{vencimento}`}</code>, <code className="text-indigo-600 dark:text-indigo-400 font-bold">{`{valor}`}</code>, <code className="text-indigo-600 dark:text-indigo-400 font-bold">{`{app}`}</code>.
          </p>
        </form>
      )}

      {/* Bot Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs space-y-2">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
              Relatório de Disparos do Bot
            </h4>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
              {filteredLogs.length}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="ENVIADO">Enviados com Sucesso</option>
              <option value="ERRO">Erros / Não Enviados</option>
            </select>

            <button
              onClick={() => setIsConfirmClearLogsOpen(true)}
              title="Limpar histórico"
              className="px-2.5 py-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          </div>
        </div>

        {/* Mobile View: Clean Card List (< sm screens) */}
        <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[420px] overflow-y-auto p-2 space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              Nenhum disparo registrado no histórico até o momento.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50/70 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {log.clientUsername}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                    log.status === 'ENVIADO' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' 
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                  }`}>
                    {log.status === 'ENVIADO' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {log.status === 'ENVIADO' ? 'Enviado' : 'Falha'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">Contato WhatsApp:</span>
                    <span>{formatPhoneBR(log.contact)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">Data/Hora:</span>
                    <span>{formatDateTimeBR(log.timestamp)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px]">
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {log.messageType}
                  </span>
                  <p className="text-[11px] text-slate-500 truncate max-w-[180px]" title={log.messageContent}>
                    {log.errorMessage ? <span className="text-rose-500 font-semibold">{log.errorMessage}</span> : log.messageContent}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Responsive Table (>= sm screens) */}
        <div className="hidden sm:block overflow-x-auto max-h-[420px]">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                <th className="p-2.5 whitespace-nowrap">Data / Hora</th>
                <th className="p-2.5 whitespace-nowrap">Cliente</th>
                <th className="p-2.5 whitespace-nowrap">Contato</th>
                <th className="p-2.5 whitespace-nowrap">Tipo</th>
                <th className="p-2.5 whitespace-nowrap">Status</th>
                <th className="p-2.5">Mensagem Enviada / Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                    Nenhum disparo registrado no histórico até o momento.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                      {formatDateTimeBR(log.timestamp)}
                    </td>
                    <td className="p-2.5 whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                      {log.clientUsername}
                    </td>
                    <td className="p-2.5 whitespace-nowrap font-mono text-[11px]">
                      {formatPhoneBR(log.contact)}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {log.messageType}
                      </span>
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      {log.status === 'ENVIADO' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Enviado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" /> Falha
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 max-w-xs truncate text-slate-600 dark:text-slate-400 text-[11px]" title={log.messageContent}>
                      {log.errorMessage ? <span className="text-rose-500 font-semibold">{log.errorMessage}</span> : log.messageContent}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Clear Logs Modal */}
      <ConfirmModal
        isOpen={isConfirmClearLogsOpen}
        title="Limpar Histórico do Bot"
        message="Deseja realmente limpar todo o histórico de disparos executados pelo Bot? Os registros serão removidos permanentemente."
        confirmText="Sim, Limpar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={executeClearLogs}
        onClose={() => setIsConfirmClearLogsOpen(false)}
      />
    </div>
  );
};
