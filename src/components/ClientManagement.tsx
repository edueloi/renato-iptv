import React, { useState } from 'react';
import { 
  Search, Plus, Filter, RefreshCw, MessageCircle, Edit2, Trash2, 
  CheckCircle2, AlertTriangle, Clock, XCircle, ChevronDown, Download, CheckSquare, UserCheck,
  DollarSign, Lock, ShieldAlert, Sparkles, Send, Calendar, Check,
  TrendingUp, TrendingDown, BarChart2, CalendarRange, ChevronUp
} from 'lucide-react';
import { Client, ClientStatus, ServiceType } from '../types';
import { formatDateBR, formatPhoneBR, maskPhoneInput, parseBRDateToYMD, getFirstName } from '../utils/masks';
import { ConfirmModal } from './ConfirmModal';

interface ClientManagementProps {
  clients: Client[];
  onAddClient: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onRenewBatch: (ids: string[]) => void;
  onRefresh: () => void;
}

export const ClientManagement: React.FC<ClientManagementProps> = ({
  clients,
  onAddClient,
  onEditClient,
  onDeleteClient,
  onRenewBatch,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [serviceFilter, setServiceFilter] = useState<string>('TODOS');
  const [appFilter, setAppFilter] = useState<string>('TODOS');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Date Filters & Growth Analytics States
  const currentYearStr = new Date().getFullYear().toString();
  const [dateFilterField, setDateFilterField] = useState<'DUE_DATE' | 'CREATED_AT'>('DUE_DATE');
  const [filterYear, setFilterYear] = useState<string>('TODOS');
  const [filterMonth, setFilterMonth] = useState<string>('TODOS');
  const [filterDay, setFilterDay] = useState<string>('TODOS');
  const [showGrowthAnalytics, setShowGrowthAnalytics] = useState<boolean>(true);

  // Advance Payment Modal States
  const [payingClient, setPayingClient] = useState<Client | null>(null);
  const [advanceMonths, setAdvanceMonths] = useState<number>(1);
  const [calcBase, setCalcBase] = useState<'DUE_DATE' | 'TODAY'>('DUE_DATE');
  const [customValuePaid, setCustomValuePaid] = useState<string>('');
  const [customDueDateInput, setCustomDueDateInput] = useState<string>('');
  const [isCustomDate, setIsCustomDate] = useState<boolean>(false);
  const [sendReceiptZap, setSendReceiptZap] = useState<boolean>(true);
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);

  // Unique apps list for filter dropdown
  const appsList = Array.from(new Set(clients.map(c => c.appUsed).filter(Boolean)));

  // Available Years list
  const availableYears = Array.from(new Set(clients.map(c => {
    const d = dateFilterField === 'DUE_DATE' ? c.dueDate : (c.createdAt || c.dueDate);
    return d ? d.split('-')[0] : null;
  }).filter(Boolean) as string[])).sort().reverse();

  if (!availableYears.includes(currentYearStr)) {
    availableYears.unshift(currentYearStr);
  }

  const monthsList = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  // Filter clients logic with Date filters (Day, Month, Year)
  const filteredClients = clients.filter(c => {
    const matchSearch = 
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      c.contact.includes(search) ||
      (c.appUsed && c.appUsed.toLowerCase().includes(search.toLowerCase())) ||
      (c.notes && c.notes.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === 'TODOS' || c.status === statusFilter;
    const matchService = serviceFilter === 'TODOS' || c.serviceType === serviceFilter;
    const matchApp = appFilter === 'TODOS' || c.appUsed === appFilter;

    // Date Filtering
    let matchDate = true;
    const targetDate = dateFilterField === 'DUE_DATE' ? c.dueDate : (c.createdAt || c.dueDate);
    if (targetDate) {
      const parts = targetDate.split('-'); // YYYY-MM-DD
      if (parts.length === 3) {
        const [y, m, d] = parts;
        if (filterYear !== 'TODOS' && y !== filterYear) matchDate = false;
        if (filterMonth !== 'TODOS' && m !== filterMonth) matchDate = false;
        if (filterDay !== 'TODOS' && d !== filterDay) matchDate = false;
      }
    }

    return matchSearch && matchStatus && matchService && matchApp && matchDate;
  });

  // MoM Growth Analysis Computation (Mês a Mês e Porcentagens)
  const getMoMGrowthData = () => {
    const targetYear = filterYear !== 'TODOS' ? filterYear : currentYearStr;
    const targetMonthNum = filterMonth !== 'TODOS' ? parseInt(filterMonth, 10) : new Date().getMonth() + 1;

    // Previous month computation
    let prevYearNum = parseInt(targetYear, 10);
    let prevMonthNum = targetMonthNum - 1;
    if (prevMonthNum < 1) {
      prevMonthNum = 12;
      prevYearNum -= 1;
    }

    const currMonthKey = `${targetYear}-${String(targetMonthNum).padStart(2, '0')}`;
    const prevMonthKey = `${prevYearNum}-${String(prevMonthNum).padStart(2, '0')}`;

    const currClients = clients.filter(c => {
      const d = dateFilterField === 'DUE_DATE' ? c.dueDate : (c.createdAt || c.dueDate);
      return d && d.startsWith(currMonthKey);
    });

    const prevClients = clients.filter(c => {
      const d = dateFilterField === 'DUE_DATE' ? c.dueDate : (c.createdAt || c.dueDate);
      return d && d.startsWith(prevMonthKey);
    });

    const currCount = currClients.length;
    const prevCount = prevClients.length;
    const countDiff = currCount - prevCount;

    let growthPercentage = 0;
    if (prevCount > 0) {
      growthPercentage = ((currCount - prevCount) / prevCount) * 100;
    } else if (currCount > 0) {
      growthPercentage = 100;
    }

    const currRevenue = currClients.reduce((acc, c) => acc + (c.value || 0), 0);
    const prevRevenue = prevClients.reduce((acc, c) => acc + (c.value || 0), 0);
    const revenueDiff = currRevenue - prevRevenue;
    let revenueGrowthPct = 0;
    if (prevRevenue > 0) {
      revenueGrowthPct = ((currRevenue - prevRevenue) / prevRevenue) * 100;
    } else if (currRevenue > 0) {
      revenueGrowthPct = 100;
    }

    // Monthly breakdown list for selected year (Jan..Dec)
    const yearMonthlyStats = monthsList.map(m => {
      const mKey = `${targetYear}-${m.value}`;
      const mClients = clients.filter(c => {
        const d = dateFilterField === 'DUE_DATE' ? c.dueDate : (c.createdAt || c.dueDate);
        return d && d.startsWith(mKey);
      });

      const mVal = parseInt(m.value, 10);
      let pY = parseInt(targetYear, 10);
      let pM = mVal - 1;
      if (pM < 1) { pM = 12; pY -= 1; }
      const pKey = `${pY}-${String(pM).padStart(2, '0')}`;

      const pClients = clients.filter(c => {
        const d = dateFilterField === 'DUE_DATE' ? c.dueDate : (c.createdAt || c.dueDate);
        return d && d.startsWith(pKey);
      });

      const mCount = mClients.length;
      const pCount = pClients.length;
      let mPct = 0;
      if (pCount > 0) {
        mPct = ((mCount - pCount) / pCount) * 100;
      } else if (mCount > 0) {
        mPct = 100;
      }

      return {
        monthValue: m.value,
        monthLabel: m.label,
        count: mCount,
        prevCount: pCount,
        diff: mCount - pCount,
        pct: mPct,
        revenue: mClients.reduce((acc, c) => acc + (c.value || 0), 0)
      };
    });

    return {
      currMonthLabel: monthsList.find(m => m.value === String(targetMonthNum).padStart(2, '0'))?.label || '',
      prevMonthLabel: monthsList.find(m => m.value === String(prevMonthNum).padStart(2, '0'))?.label || '',
      currCount,
      prevCount,
      countDiff,
      growthPercentage,
      currRevenue,
      prevRevenue,
      revenueDiff,
      revenueGrowthPct,
      yearMonthlyStats
    };
  };

  const momData = getMoMGrowthData();

  // Select all handler
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredClients.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Quick Status Change API Call
  const handleQuickStatusChange = async (clientId: string, newStatus: ClientStatus) => {
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Open Payment Modal
  const handleOpenPayment = (client: Client) => {
    setPayingClient(client);
    setAdvanceMonths(1);
    setCalcBase('DUE_DATE');
    setIsCustomDate(false);
    setCustomValuePaid(client.value.toString());
    setCustomDueDateInput('');
  };

  // Calculate new due date helper
  const calculateNewDueDate = (client: Client, months: number, base: 'DUE_DATE' | 'TODAY'): string => {
    if (isCustomDate && customDueDateInput) {
      return customDueDateInput;
    }

    let year: number, month: number, day: number;

    if (base === 'TODAY' || !client.dueDate) {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth();
      day = now.getDate();
    } else {
      const parts = client.dueDate.split('-');
      if (parts.length === 3) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth();
        day = now.getDate();
      }
    }

    // Add exact months to calendar date
    const d = new Date(year, month + months, day);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Submit Payment / Extension
  const handleConfirmPayment = async () => {
    if (!payingClient) return;
    setSubmittingPayment(true);

    try {
      const computedDueDate = calculateNewDueDate(payingClient, advanceMonths, calcBase);
      const computedValue = customValuePaid ? parseFloat(customValuePaid) : payingClient.value * advanceMonths;

      const res = await fetch(`/api/clients/${payingClient.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDueDate: computedDueDate,
          valuePaid: computedValue,
          newStatus: 'Ativo'
        })
      });

      if (res.ok) {
        const json = await res.json();
        
        // Open WhatsApp receipt if toggled
        if (sendReceiptZap && payingClient.contact) {
          const cleanPhone = payingClient.contact.replace(/\D/g, '');
          const phone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;
          const text = encodeURIComponent(
            `🚀 *PAGAMENTO CONFIRMADO!*\n\nOlá *${payingClient.username}*,\nRecebemos o valor de *R$ ${computedValue.toFixed(2)}* referente à sua assinatura *${payingClient.appUsed || 'IPTV'}* (${advanceMonths} mês/meses).\n\n📅 *Novo Vencimento:* ${computedDueDate}\n🟢 *Status:* Ativo\n\nAgradecemos a preferência e ótimo entretenimento!`
          );
          window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
        }

        setPayingClient(null);
        onRefresh();
      }
    } catch (err) {
      console.error('Error confirming payment:', err);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Status badge styling helper
  const getStatusBadge = (client: Client) => {
    const status = client.status;
    switch (status) {
      case 'Ativo':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Ativo
          </span>
        );
      case 'Hoje':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse">
            <Clock className="w-3 h-3" /> Vence Hoje
          </span>
        );
      case 'A Vencer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3 h-3" /> A Vencer
          </span>
        );
      case 'Vencido':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-3 h-3" /> Vencido
          </span>
        );
      case 'Bloqueado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-900 text-white dark:bg-slate-950 dark:text-slate-300 border border-slate-700">
            <Lock className="w-3 h-3 text-rose-400" /> Bloqueado
          </span>
        );
      case 'Em Teste':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Sparkles className="w-3 h-3" /> Em Teste
          </span>
        );
      case 'Inativo':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <XCircle className="w-3 h-3" /> Inativo
          </span>
        );
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatWhatsApp = (num: string) => {
    const clean = (num || '').replace(/\D/g, '');
    if (!clean) return '#';
    const phone = clean.startsWith('55') ? clean : '55' + clean;
    return `https://wa.me/${phone}`;
  };

  const getWhatsAppMessage = (client: Client) => {
    const text = encodeURIComponent(
      `Olá ${client.username}! Tudo bem?\nPassando para lembrar referente à sua assinatura ${client.serviceType} (${client.appUsed || 'IPTV'}).\nData de Vencimento: ${client.dueDate}\nValor: R$ ${client.value.toFixed(2)}\n\nQualquer dúvida estamos à disposição!`
    );
    return `${formatWhatsApp(client.contact)}?text=${text}`;
  };

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      {/* Top Header Controls */}
      <div className="flex flex-row items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate">
            Assinantes
          </span>
          <span className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 font-mono shrink-0">
            {clients.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedIds.length > 0 && (
            <button
              onClick={() => onRenewBatch(selectedIds)}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs border border-emerald-500 flex items-center gap-1 transition-colors shadow-2xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">Renovar ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            title="Atualizar lista"
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onAddClient}
            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs border border-indigo-500 flex items-center gap-1 transition-colors shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo</span>
          </button>
        </div>
      </div>

      {/* Filters Bar - Search, Status, Service, App */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        {/* Search Input */}
        <div className="relative col-span-2 sm:col-span-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar nome, fone, app..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-1.5 px-2 text-[11px] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="TODOS">Todos Status</option>
            <option value="Ativo">Ativo</option>
            <option value="Hoje">Vence Hoje</option>
            <option value="A Vencer">A Vencer</option>
            <option value="Vencido">Vencido</option>
            <option value="Bloqueado">Bloqueado</option>
            <option value="Inativo">Inativo</option>
            <option value="Em Teste">Em Teste</option>
          </select>
        </div>

        {/* Service Type Filter */}
        <div>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="w-full py-1.5 px-2 text-[11px] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="TODOS">Todos Serviços</option>
            <option value="IPTV">Somente IPTV</option>
            <option value="P2P">Somente P2P</option>
            <option value="IPTV_P2P">IPTV + P2P</option>
          </select>
        </div>

        {/* App Filter */}
        <div className="col-span-2 sm:col-span-1">
          <select
            value={appFilter}
            onChange={(e) => setAppFilter(e.target.value)}
            className="w-full py-1.5 px-2 text-[11px] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="TODOS">Todos os Apps</option>
            {appsList.map(app => (
              <option key={app} value={app}>{app}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Filters Bar (Ano, Mês, Dia) & MoM Growth Analytics Toggle */}
      <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <CalendarRange className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Filtro de Datas e Crescimento de Assinantes</span>
          </div>

          <button
            onClick={() => setShowGrowthAnalytics(!showGrowthAnalytics)}
            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{showGrowthAnalytics ? 'Ocultar Análise Mês a Mês' : 'Ver Análise Mês a Mês'}</span>
            {showGrowthAnalytics ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Date Filter Inputs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-[11px]">
          {/* Field Selector */}
          <div>
            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 font-medium">Filtrar por Data de</label>
            <select
              value={dateFilterField}
              onChange={(e) => setDateFilterField(e.target.value as any)}
              className="w-full py-1 px-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
            >
              <option value="DUE_DATE">Vencimento</option>
              <option value="CREATED_AT">Cadastro / Início</option>
            </select>
          </div>

          {/* Year Selector */}
          <div>
            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 font-medium">Ano</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full py-1 px-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
            >
              <option value="TODOS">Todos os Anos</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div>
            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 font-medium">Mês</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full py-1 px-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
            >
              <option value="TODOS">Todos os Meses</option>
              {monthsList.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Day Selector */}
          <div>
            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 font-medium">Dia do Mês</label>
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="w-full py-1 px-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
            >
              <option value="TODOS">Todos os Dias</option>
              {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
        </div>

        {/* MoM Growth Analytics Display Panel */}
        {showGrowthAnalytics && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            {/* Cards Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {/* Card 1: Selected Month Count */}
              <div className="p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  Assinantes ({momData.currMonthLabel})
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-base font-bold text-slate-900 dark:text-white">{momData.currCount}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">R$ {momData.currRevenue.toFixed(2)}</span>
                </div>
              </div>

              {/* Card 2: Previous Month Count */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Mês Anterior ({momData.prevMonthLabel})
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-base font-bold text-slate-800 dark:text-slate-200">{momData.prevCount}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">R$ {momData.prevRevenue.toFixed(2)}</span>
                </div>
              </div>

              {/* Card 3: MoM Subscriber Growth Badge */}
              <div className="p-2.5 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                  Crescimento de Assinantes
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  {momData.countDiff >= 0 ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                      <TrendingUp className="w-3 h-3" />
                      +{momData.growthPercentage.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">
                      <TrendingDown className="w-3 h-3" />
                      {momData.growthPercentage.toFixed(1)}%
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {momData.countDiff >= 0 ? `+${momData.countDiff}` : momData.countDiff} clientes
                  </span>
                </div>
              </div>

              {/* Card 4: MoM Revenue Growth Badge */}
              <div className="p-2.5 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                  Variação Financeira Mês
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  {momData.revenueDiff >= 0 ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                      <TrendingUp className="w-3 h-3" />
                      +{momData.revenueGrowthPct.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">
                      <TrendingDown className="w-3 h-3" />
                      {momData.revenueGrowthPct.toFixed(1)}%
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {momData.revenueDiff >= 0 ? `+R$ ${momData.revenueDiff.toFixed(2)}` : `-R$ ${Math.abs(momData.revenueDiff).toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Evolution Grid / Table for Year */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2 sm:p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80">
              <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Evolução Mês a Mês do Ano ({filterYear !== 'TODOS' ? filterYear : currentYearStr})</span>
                <span className="text-slate-600 dark:text-slate-400 font-normal normal-case">Comparação direta com o mês anterior</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                {momData.yearMonthlyStats.map(stat => (
                  <div 
                    key={stat.monthValue}
                    className={`p-1.5 rounded-md border text-center transition-all ${
                      filterMonth === stat.monthValue 
                        ? 'bg-indigo-100/70 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-700' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{stat.monthLabel}</div>
                    <div className="text-xs font-black text-slate-900 dark:text-white my-0.5">
                      {stat.count} <span className="text-[9px] font-normal text-slate-600 dark:text-slate-400">assinantes</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-[10px] font-semibold">
                      {stat.diff >= 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                          <TrendingUp className="w-2.5 h-2.5 mr-0.5" />+{stat.pct.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 flex items-center">
                          <TrendingDown className="w-2.5 h-2.5 mr-0.5" />{stat.pct.toFixed(0)}%
                        </span>
                      )}
                      <span className="text-slate-600 dark:text-slate-400">({stat.diff >= 0 ? `+${stat.diff}` : stat.diff})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADVANCE PAYMENT MODAL */}
      {payingClient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Efetivar Pagamento / Adiantar Assinatura
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cliente: <strong className="text-slate-800 dark:text-slate-200">{payingClient.username}</strong> ({payingClient.appUsed || 'IPTV'})
                </p>
              </div>
              <button
                onClick={() => setPayingClient(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Current status & due date info */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Vencimento Atual</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatDateBR(payingClient.dueDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Valor Mensalidade</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(payingClient.value)}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Status Atual</span>
                {getStatusBadge(payingClient)}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Advance period options */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                  Selecione o Período / Quantidade de Meses Pagos:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: '1 Mês (+30d)', months: 1 },
                    { label: '2 Meses (+60d)', months: 2 },
                    { label: '3 Meses (Trimestral)', months: 3 },
                    { label: '6 Meses (Semestral)', months: 6 },
                    { label: '12 Meses (Anual)', months: 12 },
                  ].map((item) => (
                    <button
                      key={item.months}
                      type="button"
                      onClick={() => {
                        setAdvanceMonths(item.months);
                        setIsCustomDate(false);
                        setCustomValuePaid((payingClient.value * item.months).toString());
                      }}
                      className={`p-2 rounded-lg font-medium text-xs border text-center transition-all ${
                        !isCustomDate && advanceMonths === item.months
                          ? 'bg-emerald-600 text-white font-bold border-emerald-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setIsCustomDate(true)}
                    className={`p-2 rounded-lg font-medium text-xs border text-center transition-all ${
                      isCustomDate
                        ? 'bg-indigo-600 text-white font-bold border-indigo-500 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    📅 Data Personalizada
                  </button>
                </div>
              </div>

              {/* Calculation Base selection */}
              {!isCustomDate && (
                <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 space-y-2">
                  <label className="block font-semibold text-indigo-900 dark:text-indigo-200 text-[11px]">
                    Adiantar a partir de qual referência?
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        name="calcBase"
                        checked={calcBase === 'DUE_DATE'}
                        onChange={() => setCalcBase('DUE_DATE')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>A partir do vencimento atual ({formatDateBR(payingClient.dueDate)})</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        name="calcBase"
                        checked={calcBase === 'TODAY'}
                        onChange={() => setCalcBase('TODAY')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>A partir de HOJE</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Custom Date Picker if selected */}
              {isCustomDate && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Informe a Nova Data de Vencimento
                  </label>
                  <input
                    type="date"
                    value={customDueDateInput}
                    onChange={(e) => setCustomDueDateInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Total Value Paid Input */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Valor Recebido (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={customValuePaid}
                    onChange={(e) => setCustomValuePaid(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Novo Vencimento Calculado
                  </label>
                  <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-lg font-mono font-bold text-emerald-700 dark:text-emerald-300 text-xs">
                    {formatDateBR(calculateNewDueDate(payingClient, advanceMonths, calcBase))}
                  </div>
                </div>
              </div>

              {/* Toggle WhatsApp Receipt */}
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={sendReceiptZap}
                  onChange={(e) => setSendReceiptZap(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  Abrir WhatsApp e enviar comprovante de pagamento ao cliente
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setPayingClient(null)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submittingPayment}
                onClick={handleConfirmPayment}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                {submittingPayment ? 'Gravando...' : 'Confirmar e Renovar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop & Tablet Table View */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="p-2.5 text-center w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredClients.length && filteredClients.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="p-2.5 w-12 text-center">#</th>
                <th className="p-2.5">Usuário / Nome</th>
                <th className="p-2.5">Serviço & App</th>
                <th className="p-2.5">Vencimento</th>
                <th className="p-2.5">Status (Alterar)</th>
                <th className="p-2.5">Valor</th>
                <th className="p-2.5">Contato</th>
                <th className="p-2.5 text-right pr-3">Pagamento & Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-400">
                    Nenhum cliente encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const isSelected = selectedIds.includes(client.id);
                  return (
                    <tr 
                      key={client.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}
                    >
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(client.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-2.5 text-center font-mono text-slate-400 text-[11px]">
                        {client.generalQty || '-'}
                      </td>
                      <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">
                        {client.username}
                      </td>
                      <td className="p-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{client.appUsed || 'XCIPTV'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{client.serviceType}</span>
                        </div>
                      </td>
                      <td className="p-2.5 font-mono text-xs font-semibold">
                        {formatDateBR(client.dueDate)}
                      </td>
                      <td className="p-2.5">
                        {/* Quick Status Selector Dropdown */}
                        <div className="flex items-center gap-1">
                          <select
                            value={client.status}
                            onChange={(e) => handleQuickStatusChange(client.id, e.target.value as ClientStatus)}
                            className="text-[11px] font-semibold bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 focus:outline-none cursor-pointer"
                          >
                            <option value="Ativo">🟢 Ativo</option>
                            <option value="Hoje">🟡 Vence Hoje</option>
                            <option value="A Vencer">🔵 A Vencer</option>
                            <option value="Vencido">🔴 Vencido</option>
                            <option value="Bloqueado">⛔ Bloqueado</option>
                            <option value="Inativo">⚪ Inativo</option>
                            <option value="Em Teste">🧪 Em Teste</option>
                          </select>
                        </div>
                      </td>
                      <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrency(client.value)}
                      </td>
                      <td className="p-2.5">
                        {client.contact ? (
                          <a
                            href={getWhatsAppMessage(client)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            {formatPhoneBR(client.contact)}
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Sem fone</span>
                        )}
                      </td>
                      <td className="p-2.5 text-right pr-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Prominent Payment Button */}
                          <button
                            onClick={() => handleOpenPayment(client)}
                            title="Lançar/Adiantar pagamento da assinatura"
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs border border-emerald-500 flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <DollarSign className="w-3.5 h-3.5" /> Pagar / Adiantar
                          </button>

                          <button
                            onClick={() => onEditClient(client)}
                            title="Editar dados completos"
                            className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setClientToDelete(client)}
                            title="Excluir cliente"
                            className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Responsive Cards List */}
      <div className="block md:hidden space-y-2">
        {filteredClients.length === 0 ? (
          <div className="p-5 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            Nenhum cliente encontrado.
          </div>
        ) : (
          filteredClients.map((client, index) => (
            <div 
              key={client.id}
              className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs"
            >
              {/* Header: Name, App, Status & Actions */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-semibold text-slate-400">#{client.generalQty || (index + 1)}</span>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                      {client.username}
                    </h4>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    App: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{client.appUsed || 'IPTV'}</strong> ({client.serviceType})
                  </p>
                </div>

                {/* Status Dropdown & Action Icons */}
                <div className="flex items-center gap-1 shrink-0">
                  <select
                    value={client.status}
                    onChange={(e) => handleQuickStatusChange(client.id, e.target.value as ClientStatus)}
                    className="text-[10px] font-semibold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 focus:outline-none cursor-pointer max-w-[110px]"
                  >
                    <option value="Ativo">🟢 Ativo</option>
                    <option value="Hoje">🟡 Vence Hoje</option>
                    <option value="A Vencer">🔵 A Vencer</option>
                    <option value="Vencido">🔴 Vencido</option>
                    <option value="Bloqueado">🔒 Bloqueado</option>
                    <option value="Inativo">⚪ Inativo</option>
                    <option value="Em Teste">🧪 Em Teste</option>
                  </select>

                  {/* Edit Button */}
                  <button
                    onClick={() => onEditClient(client)}
                    title="Editar cliente"
                    className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => setClientToDelete(client)}
                    title="Excluir cliente"
                    className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Due Date & Value row */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/70 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60">
                <div>
                  <span className="text-slate-400 text-[9px] block uppercase font-bold tracking-wider">Vencimento</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">{formatDateBR(client.dueDate)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[9px] block uppercase font-bold tracking-wider">Valor Mensal</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">{formatCurrency(client.value)}</span>
                </div>
              </div>

              {/* Action Buttons Row: Pay & WhatsApp */}
              <div className="flex items-center gap-1.5 pt-0.5">
                {/* Pay Button */}
                <button
                  onClick={() => handleOpenPayment(client)}
                  className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-lg text-xs border border-emerald-500/80 flex items-center justify-center gap-1 transition-all shadow-2xs whitespace-nowrap min-w-0"
                >
                  <DollarSign className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Pagar / Adiantar</span>
                </button>

                {/* WhatsApp Button */}
                {client.contact ? (
                  <a
                    href={getWhatsAppMessage(client)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-medium rounded-lg text-xs border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1 transition-colors shrink-0 min-w-0"
                    title={`Enviar WhatsApp para ${formatPhoneBR(client.contact)}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-[11px] font-semibold truncate">{formatPhoneBR(client.contact)}</span>
                  </a>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!clientToDelete}
        title="Excluir Assinante"
        message={`Tem certeza que deseja excluir o cliente "${clientToDelete?.username}"? Esta ação removerá os dados permanentemente.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={() => {
          if (clientToDelete) {
            onDeleteClient(clientToDelete.id);
            setClientToDelete(null);
          }
        }}
        onClose={() => setClientToDelete(null)}
      />
    </div>
  );
};

