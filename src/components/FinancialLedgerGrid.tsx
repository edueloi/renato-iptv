import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, ArrowDownRight, Search, Filter, Calendar, DollarSign, 
  Layers, Download, RefreshCw, FileText, CheckCircle2, TrendingUp, TrendingDown 
} from 'lucide-react';

interface LedgerItem {
  id: string;
  type: 'ENTRADA' | 'SAIDA';
  date: string;
  title: string;
  description: string;
  category: string;
  value: number;
  status: string;
  contact?: string;
  refId: string;
}

interface AggregatedItem {
  date?: string;
  month?: string;
  year?: string;
  totalEntradas: number;
  totalSaidas: number;
  balance: number;
  count: number;
}

export function FinancialLedgerGrid() {
  const [subView, setSubView] = useState<'LINHA_A_LINHA' | 'DIA_A_DIA' | 'MES_A_MES' | 'ANO_A_ANO'>('LINHA_A_LINHA');
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [dailyList, setDailyList] = useState<AggregatedItem[]>([]);
  const [monthlyList, setMonthlyList] = useState<AggregatedItem[]>([]);
  const [yearlyList, setYearlyList] = useState<AggregatedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Linha a Linha
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'TODOS' | 'ENTRADA' | 'SAIDA'>('TODOS');
  const [categoryFilter, setCategoryFilter] = useState<string>('TODAS');

  useEffect(() => {
    fetchLedgerData();
  }, []);

  const fetchLedgerData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/financials/ledger');
      if (res.ok) {
        const json = await res.json();
        setLedger(json.ledger || []);
        setDailyList(json.dailyList || []);
        setMonthlyList(json.monthlyList || []);
        setYearlyList(json.yearlyList || []);
      }
    } catch (err) {
      console.error('Error fetching ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatDateBr = (dStr: string) => {
    if (!dStr) return '-';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dStr;
  };

  // Get unique categories for filter
  const categories = Array.from(new Set(ledger.map(item => item.category))).filter(Boolean);

  // Filtered ledger items
  const filteredLedger = ledger.filter(item => {
    // Type Filter
    if (typeFilter !== 'TODOS' && item.type !== typeFilter) return false;
    // Category Filter
    if (categoryFilter !== 'TODAS' && item.category !== categoryFilter) return false;
    // Search Term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(term);
      const matchDesc = item.description.toLowerCase().includes(term);
      const matchCat = item.category.toLowerCase().includes(term);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  // Calculate overall totals from filtered
  const totalEntradas = filteredLedger.filter(i => i.type === 'ENTRADA').reduce((a, b) => a + b.value, 0);
  const totalSaidas = filteredLedger.filter(i => i.type === 'SAIDA').reduce((a, b) => a + Math.abs(b.value), 0);
  const netBalance = totalEntradas - totalSaidas;

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      {/* View Switcher Header */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Extrato de Faturamento (Entradas & Saídas)
          </h3>
          <p className="text-[11px] text-slate-500">
            Detalhamento financeiro completo por transação, dia, mês e ano
          </p>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 self-start md:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setSubView('LINHA_A_LINHA')}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all whitespace-nowrap ${
              subView === 'LINHA_A_LINHA'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            📋 Linha a Linha
          </button>

          <button
            onClick={() => setSubView('DIA_A_DIA')}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all whitespace-nowrap ${
              subView === 'DIA_A_DIA'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            📅 Dia a Dia
          </button>

          <button
            onClick={() => setSubView('MES_A_MES')}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all whitespace-nowrap ${
              subView === 'MES_A_MES'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            📊 Mês a Mês
          </button>

          <button
            onClick={() => setSubView('ANO_A_ANO')}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all whitespace-nowrap ${
              subView === 'ANO_A_ANO'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            🏛️ Ano a Ano
          </button>
        </div>
      </div>

      {/* KPI Cards Strip for Financial Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
              Total Entradas (Receitas)
            </span>
            <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 font-mono mt-0.5 block">
              {formatBrl(totalEntradas)}
            </span>
          </div>
          <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-xs">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
              Total Saídas (Despesas)
            </span>
            <span className="text-base font-extrabold text-rose-700 dark:text-rose-400 font-mono mt-0.5 block">
              {formatBrl(totalSaidas)}
            </span>
          </div>
          <div className="p-2 bg-rose-600 text-white rounded-lg shadow-xs">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider block">
              Saldo Líquido
            </span>
            <span className={`text-base font-extrabold font-mono mt-0.5 block ${netBalance >= 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-rose-600'}`}>
              {formatBrl(netBalance)}
            </span>
          </div>
          <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          Carregando extrato de movimentações...
        </div>
      ) : (
        <>
          {/* VIEW 1: LINHA A LINHA */}
          {subView === 'LINHA_A_LINHA' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-3 p-3.5">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por cliente, despesa ou fornecedor..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto">
                  {/* Type Filter */}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none"
                  >
                    <option value="TODOS">Todas Movimentações</option>
                    <option value="ENTRADA">🟢 Apenas Entradas</option>
                    <option value="SAIDA">🔴 Apenas Saídas</option>
                  </select>

                  {/* Category Filter */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none"
                  >
                    <option value="TODAS">Todas Categorias</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                {filteredLedger.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    Nenhuma movimentação encontrada com os filtros aplicados.
                  </div>
                ) : (
                  filteredLedger.map((item) => {
                    const isEntrada = item.type === 'ENTRADA';
                    return (
                      <div key={item.id} className="p-3 space-y-1.5 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                                isEntrada
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                              }`}
                            >
                              {isEntrada ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                              {item.type}
                            </span>
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-1">
                              {item.title}
                            </h4>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`font-mono font-bold text-sm block ${isEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {isEntrada ? '+' : ''}{formatBrl(item.value)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatDateBr(item.date)}
                            </span>
                          </div>
                        </div>

                        {item.description && (
                          <p className="text-[11px] text-slate-500">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200/60 dark:border-slate-700 text-[9px] font-medium text-slate-600 dark:text-slate-300">
                            {item.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              item.status === 'Vencido'
                                ? 'bg-rose-500 text-white'
                                : item.status === 'Hoje'
                                ? 'bg-amber-500 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold text-[11px] border-b border-slate-200 dark:border-slate-700">
                      <th className="p-2.5">Tipo</th>
                      <th className="p-2.5">Data</th>
                      <th className="p-2.5">Descrição / Cliente</th>
                      <th className="p-2.5">Categoria</th>
                      <th className="p-2.5 text-right">Valor (R$)</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-sans">
                    {filteredLedger.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          Nenhuma movimentação encontrada com os filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredLedger.map((item) => {
                        const isEntrada = item.type === 'ENTRADA';
                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="p-2.5 font-medium whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isEntrada
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                }`}
                              >
                                {isEntrada ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {item.type}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {formatDateBr(item.date)}
                            </td>
                            <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">
                              <div className="font-semibold">{item.title}</div>
                              <div className="text-[10px] text-slate-500 font-normal">{item.description}</div>
                            </td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-400">
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200/60 dark:border-slate-700 text-[10px]">
                                {item.category}
                              </span>
                            </td>
                            <td className={`p-2.5 font-mono font-bold text-right whitespace-nowrap ${isEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {isEntrada ? '+' : ''}{formatBrl(item.value)}
                            </td>
                            <td className="p-2.5 text-center whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.status === 'Vencido'
                                    ? 'bg-rose-500 text-white'
                                    : item.status === 'Hoje'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-emerald-600 text-white'
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: DIA A DIA */}
          {subView === 'DIA_A_DIA' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-3.5 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                Consolidado de Faturamento - Agrupado Dia a Dia
              </h4>

              <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold text-[11px] border-b border-slate-200 dark:border-slate-700">
                      <th className="p-2.5">Data do Dia</th>
                      <th className="p-2.5 text-center">Registros</th>
                      <th className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">Entradas (+)</th>
                      <th className="p-2.5 text-right text-rose-600 dark:text-rose-400">Saídas (-)</th>
                      <th className="p-2.5 text-right font-bold">Saldo do Dia (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-sans">
                    {dailyList.map((row) => (
                      <tr key={row.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold font-mono text-slate-900 dark:text-slate-100">
                          {formatDateBr(row.date!)}
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-500">{row.count}</td>
                        <td className="p-2.5 font-mono text-emerald-600 dark:text-emerald-400 text-right font-medium">
                          +{formatBrl(row.totalEntradas)}
                        </td>
                        <td className="p-2.5 font-mono text-rose-600 dark:text-rose-400 text-right font-medium">
                          -{formatBrl(row.totalSaidas)}
                        </td>
                        <td className={`p-2.5 font-mono font-bold text-right ${row.balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
                          {formatBrl(row.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 3: MÊS A MÊS */}
          {subView === 'MES_A_MES' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-3.5 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                Consolidado de Faturamento - Agrupado Mês a Mês
              </h4>

              <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold text-[11px] border-b border-slate-200 dark:border-slate-700">
                      <th className="p-2.5">Mês de Referência</th>
                      <th className="p-2.5 text-center">Lançamentos</th>
                      <th className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">Entradas (+)</th>
                      <th className="p-2.5 text-right text-rose-600 dark:text-rose-400">Saídas (-)</th>
                      <th className="p-2.5 text-right font-bold">Lucro Líquido do Mês</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-sans">
                    {monthlyList.map((row) => (
                      <tr key={row.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold font-mono text-slate-900 dark:text-slate-100">
                          {row.month}
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-500">{row.count}</td>
                        <td className="p-2.5 font-mono text-emerald-600 dark:text-emerald-400 text-right font-semibold">
                          +{formatBrl(row.totalEntradas)}
                        </td>
                        <td className="p-2.5 font-mono text-rose-600 dark:text-rose-400 text-right font-semibold">
                          -{formatBrl(row.totalSaidas)}
                        </td>
                        <td className={`p-2.5 font-mono font-bold text-right text-sm ${row.balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
                          {formatBrl(row.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 4: ANO A ANO */}
          {subView === 'ANO_A_ANO' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-3.5 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                Consolidado Anual de Faturamento - Ano a Ano
              </h4>

              <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold text-[11px] border-b border-slate-200 dark:border-slate-700">
                      <th className="p-2.5">Ano</th>
                      <th className="p-2.5 text-center">Total Operações</th>
                      <th className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">Receita Anual Total</th>
                      <th className="p-2.5 text-right text-rose-600 dark:text-rose-400">Custos Anuais Totais</th>
                      <th className="p-2.5 text-right font-bold">Resultado Anual Líquido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-sans">
                    {yearlyList.map((row) => (
                      <tr key={row.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold font-mono text-slate-900 dark:text-slate-100 text-sm">
                          {row.year}
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-500">{row.count}</td>
                        <td className="p-2.5 font-mono text-emerald-600 dark:text-emerald-400 text-right font-bold">
                          +{formatBrl(row.totalEntradas)}
                        </td>
                        <td className="p-2.5 font-mono text-rose-600 dark:text-rose-400 text-right font-bold">
                          -{formatBrl(row.totalSaidas)}
                        </td>
                        <td className={`p-2.5 font-mono font-bold text-right text-sm ${row.balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
                          {formatBrl(row.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
