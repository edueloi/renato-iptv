import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Users, 
  Send, CheckCircle2, AlertCircle, RefreshCw, Phone, Filter, Sparkles 
} from 'lucide-react';
import { Client } from '../types';
import { formatDateBR, formatPhoneBR, getFirstName } from '../utils/masks';

interface CalendarAgendaProps {
  clients: Client[];
  onRenewClient?: (clientId: string) => void;
  onRefreshData?: () => void;
}

export function CalendarAgenda({ clients, onRenewClient, onRefreshData }: CalendarAgendaProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'HOJE' | 'VENCIDO' | 'A_VENCER'>('TODOS');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDayStr(today.toISOString().split('T')[0]);
  };

  // Helper formatting
  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Calendar matrix calculation
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon...
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create grid cells
  const daysGrid: ({ dayNum: number; dateStr: string; isCurrentMonth: boolean } | null)[] = [];

  // Padding days from previous month
  for (let i = 0; i < startingDayOfWeek; i++) {
    daysGrid.push(null);
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysGrid.push({
      dayNum: d,
      dateStr: dStr,
      isCurrentMonth: true
    });
  }

  // Group clients by due date (YYYY-MM-DD)
  const clientsByDate: Record<string, Client[]> = {};
  clients.forEach(c => {
    if (c.dueDate) {
      const d = c.dueDate.slice(0, 10);
      if (!clientsByDate[d]) clientsByDate[d] = [];
      clientsByDate[d].push(c);
    }
  });

  // Clients for selected day
  let selectedDayClients = clientsByDate[selectedDayStr] || [];
  if (statusFilter !== 'TODOS') {
    selectedDayClients = selectedDayClients.filter(c => {
      if (statusFilter === 'HOJE') return c.status === 'Hoje';
      if (statusFilter === 'VENCIDO') return c.status === 'Vencido';
      if (statusFilter === 'A_VENCER') return c.status === 'A Vencer';
      return true;
    });
  }

  const [warningNotice, setWarningNotice] = useState<string | null>(null);

  // WhatsApp reminder generator
  const sendWhatsAppReminder = (client: Client) => {
    if (!client.contact) {
      setWarningNotice(`O cliente ${client.username} não possui número de WhatsApp cadastrado.`);
      setTimeout(() => setWarningNotice(null), 3500);
      return;
    }
    const cleanPhone = client.contact.replace(/\D/g, '');
    const firstName = getFirstName(client.username);
    const message = `Olá ${firstName}! Lembrete de renovação IPTV/P2P (${client.appUsed || 'App'}). Vencimento: ${client.dueDate}. Valor: R$ ${client.value.toFixed(2)}. Digite SIM para renovar!`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      {/* Top Header Controls */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              Agenda de Vencimentos IPTV / P2P
            </h3>
            <p className="text-[11px] text-slate-500">
              Visualização por calendário de cobranças e renovações por data
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-bold text-slate-800 dark:text-slate-200 px-3 py-1 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-xs min-w-[120px] text-center">
            {monthNames[month]} {year}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleToday}
            className="ml-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs transition-colors shadow-xs"
          >
            Hoje
          </button>
        </div>
      </div>

      {/* Main Calendar + Day Agenda Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Calendar Grid (8 cols on LG) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-[11px] text-slate-400 dark:text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800">
            <span>DOM</span>
            <span>SEG</span>
            <span>TER</span>
            <span>QUA</span>
            <span>QUI</span>
            <span>SEX</span>
            <span>SÁB</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysGrid.map((item, idx) => {
              if (!item) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="h-16 sm:h-20 bg-slate-50/40 dark:bg-slate-950/20 rounded-lg border border-transparent opacity-30"
                  />
                );
              }

              const { dayNum, dateStr } = item;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDayStr;
              const dayClients = clientsByDate[dateStr] || [];

              // Status metrics for badges
              const todayCount = dayClients.filter(c => c.status === 'Hoje').length;
              const overdueCount = dayClients.filter(c => c.status === 'Vencido').length;
              const activeCount = dayClients.filter(c => c.status === 'Ativo' || c.status === 'A Vencer').length;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDayStr(dateStr)}
                  className={`h-16 sm:h-20 p-1 rounded-xl text-left border flex flex-col justify-between transition-all relative overflow-hidden ${
                    isSelected
                      ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm'
                      : isToday
                      ? 'border-emerald-500 dark:border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-900'
                  }`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold leading-none ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]'
                          : isSelected
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {dayClients.length > 0 && (
                      <span className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 px-1 bg-slate-100 dark:bg-slate-800 rounded">
                        {dayClients.length}
                      </span>
                    )}
                  </div>

                  {/* Badges for Due Clients on this day */}
                  <div className="space-y-0.5 mt-auto">
                    {overdueCount > 0 && (
                      <div className="px-1 py-0.2 bg-rose-500 text-white text-[9px] font-medium rounded truncate leading-tight flex items-center justify-between">
                        <span>Vencido</span>
                        <span className="font-bold">{overdueCount}</span>
                      </div>
                    )}

                    {todayCount > 0 && (
                      <div className="px-1 py-0.2 bg-amber-500 text-white text-[9px] font-medium rounded truncate leading-tight flex items-center justify-between">
                        <span>Hoje</span>
                        <span className="font-bold">{todayCount}</span>
                      </div>
                    )}

                    {activeCount > 0 && overdueCount === 0 && todayCount === 0 && (
                      <div className="px-1 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[9px] font-medium rounded truncate leading-tight flex items-center justify-between border border-emerald-200 dark:border-emerald-800">
                        <span>Ativos</span>
                        <span className="font-bold">{activeCount}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend Strip */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Hoje / Selecionado
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Vencidos
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Vence Hoje
              </span>
            </div>
            <span className="text-[10px] text-indigo-500 font-medium">Clique no dia para filtrar</span>
          </div>
        </div>

        {/* Right Column: Selected Day Agenda Drawer (5 cols on LG) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-full min-h-[350px]">
          {/* Header for Day Agenda */}
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Agenda do Dia Selecionado
              </span>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                {selectedDayStr ? new Date(selectedDayStr + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'Selecione uma data'}
              </h4>
            </div>

            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs rounded-full border border-indigo-200 dark:border-indigo-800">
              {selectedDayClients.length} cliente(s)
            </span>
          </div>

          {/* Filter Status Pills */}
          <div className="my-2.5 flex items-center gap-1 text-[10px] overflow-x-auto pb-1">
            <button
              onClick={() => setStatusFilter('TODOS')}
              className={`px-2 py-0.5 rounded-md border font-medium whitespace-nowrap transition-colors ${
                statusFilter === 'TODOS'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              Todos ({clientsByDate[selectedDayStr]?.length || 0})
            </button>
            <button
              onClick={() => setStatusFilter('HOJE')}
              className={`px-2 py-0.5 rounded-md border font-medium whitespace-nowrap transition-colors ${
                statusFilter === 'HOJE'
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              Vence Hoje
            </button>
            <button
              onClick={() => setStatusFilter('VENCIDO')}
              className={`px-2 py-0.5 rounded-md border font-medium whitespace-nowrap transition-colors ${
                statusFilter === 'VENCIDO'
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              Vencidos
            </button>
          </div>

          {/* Day Clients List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
            {selectedDayClients.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 my-auto">
                <Clock className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                <p className="font-semibold text-xs text-slate-600 dark:text-slate-300">
                  Nenhum vencimento agendado nesta data
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Selecione outro dia no calendário para visualizar os clientes.
                </p>
              </div>
            ) : (
              selectedDayClients.map((client) => {
                const isOverdue = client.status === 'Vencido';
                const isTodayDue = client.status === 'Hoje';

                return (
                  <div
                    key={client.id}
                    className={`p-3 rounded-xl border transition-all space-y-2 ${
                      isOverdue
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                        : isTodayDue
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {client.username}
                          </span>
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {client.serviceType || 'IPTV'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          App: <strong className="text-slate-700 dark:text-slate-300">{client.appUsed}</strong> • Servidor: {client.extraField || 'Geral'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs block">
                          {formatBrl(client.value)}
                        </span>
                        <span
                          className={`inline-block px-1.5 py-0.2 text-[9px] font-bold rounded-full mt-0.5 ${
                            isOverdue
                              ? 'bg-rose-600 text-white'
                              : isTodayDue
                              ? 'bg-amber-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {client.status}
                        </span>
                      </div>
                    </div>

                    {/* Contact & Actions Row */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 truncate font-mono">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        {client.contact ? formatPhoneBR(client.contact) : 'Sem Zap'}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => sendWhatsAppReminder(client)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-[10px] flex items-center gap-1 transition-colors shadow-xs"
                          title="Cobrar via WhatsApp"
                        >
                          <Send className="w-3 h-3" />
                          <span>Cobrar</span>
                        </button>

                        {onRenewClient && (
                          <button
                            onClick={() => onRenewClient(client.id)}
                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-[10px] flex items-center gap-1 transition-colors shadow-xs"
                            title="Renovar +30 dias"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Renovar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }))}
          </div>

          {/* Agenda Total Summary Footer */}
          {selectedDayClients.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/80 dark:bg-slate-950/40 p-2 rounded-lg">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Total Previsto no Dia:
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {formatBrl(selectedDayClients.reduce((acc, c) => acc + (c.value || 0), 0))}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Warning Toast Floating Notice */}
      {warningNotice && (
        <div className="fixed bottom-16 md:bottom-5 right-4 z-50 px-3.5 py-2 bg-amber-950 text-amber-100 font-medium rounded-lg shadow-lg border border-amber-700 flex items-center gap-2 text-xs animate-in slide-in-from-bottom-2 duration-200">
          <span>{warningNotice}</span>
        </div>
      )}
    </div>
  );
}
