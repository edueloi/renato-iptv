import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Calendar, ArrowUpRight, 
  ArrowDownRight, Layers, FileSpreadsheet, PieChart, AlertCircle, Sparkles, FileText, Clock
} from 'lucide-react';
import { CycleReport, Client } from '../types';
import { FinancialLedgerGrid } from './FinancialLedgerGrid';
import { CalendarAgenda } from './CalendarAgenda';

interface FinancialDashboardProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  clients?: Client[];
  onRefreshClients?: () => void;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  selectedMonth,
  onMonthChange,
  clients = [],
  onRefreshClients
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LEDGER' | 'AGENDA'>('OVERVIEW');
  const [data, setData] = useState<CycleReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, [selectedMonth]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/financials?month=${selectedMonth}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching financial report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRenewSingleClient = async (clientId: string) => {
    try {
      const res = await fetch('/api/clients/batch-renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientIds: [clientId], addDaysCount: 30 })
      });
      if (res.ok) {
        if (onRefreshClients) onRefreshClients();
        fetchFinancialData();
      }
    } catch (err) {
      console.error('Error renewing client:', err);
    }
  };

  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      {/* Tab Header Selector */}
      <div className="bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-2 sm:px-3 py-1.5 rounded-lg font-medium text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'OVERVIEW'
                ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>Resumo <span className="hidden sm:inline">do Ciclo</span></span>
          </button>

          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-2 sm:px-3 py-1.5 rounded-lg font-medium text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'LEDGER'
                ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>Extrato <span className="hidden sm:inline">Entradas & Saídas</span></span>
          </button>

          <button
            onClick={() => setActiveTab('AGENDA')}
            className={`px-2 sm:px-3 py-1.5 rounded-lg font-medium text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
              activeTab === 'AGENDA'
                ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Agenda <span className="hidden sm:inline">& Calendário</span></span>
          </button>
        </div>

        {/* Month Picker (Only relevant for overview or reference) */}
        {activeTab === 'OVERVIEW' && (
          <div className="flex items-center justify-between sm:justify-start gap-2 self-stretch sm:self-auto pt-1 sm:pt-0">
            <label className="text-slate-600 dark:text-slate-400 font-medium text-xs flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ciclo Mês:
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* TAB 1: OVERVIEW CICLO 19 A 19 */}
      {activeTab === 'OVERVIEW' && (
        <>
          {loading ? (
            <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              Calculando métricas do ciclo financeiro...
            </div>
          ) : data ? (
            <div className="space-y-4">
              {/* Cycle Info Bar */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-3.5 rounded-xl border border-indigo-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">
                    Período do Fechamento
                  </span>
                  <p className="font-semibold text-xs sm:text-sm text-slate-100 mt-0.5">
                    Ciclo Vigente: <span className="text-emerald-400 font-mono">{data.cycleLabel}</span>
                  </p>
                </div>
                <div className="text-[11px] text-slate-300 font-mono bg-indigo-950/80 px-3 py-1 rounded-lg border border-indigo-700/60 self-start sm:self-auto">
                  {data.activeCount} Clientes Pagos • {data.inactiveCount} Inativos
                </div>
              </div>

              {/* Main Financial KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                {/* Card 1: Faturamento Bruto (Assinaturas) */}
                <div className="p-2.5 sm:p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-[10px] sm:text-[11px]">
                    <span className="truncate">Faturamento</span>
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  </div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {formatBrl(data.totalRevenue)}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Users className="w-3 h-3 shrink-0" /> {data.activeCount} Ativos
                  </div>
                </div>

                {/* Card 2: Despesas e Custos */}
                <div className="p-2.5 sm:p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-[10px] sm:text-[11px]">
                    <span className="truncate">Custos e Despesas</span>
                    <TrendingDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  </div>
                  <div className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
                    {formatBrl(data.totalExpenses)}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                    Mês {selectedMonth}
                  </div>
                </div>

                {/* Card 3: Lucro Líquido do Ciclo */}
                <div className="p-2.5 sm:p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-[10px] sm:text-[11px]">
                    <span className="truncate">Lucro Líquido</span>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  </div>
                  <div className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {formatBrl(data.netProfit)}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                    Ciclo Vigente
                  </div>
                </div>

                {/* Card 4: Crescimento do Lucro (Comparativo R$ e %) */}
                <div className="p-2.5 sm:p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-[10px] sm:text-[11px]">
                    <span className="truncate">Crescimento Lucro</span>
                    {data.profitGrowthValue >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )}
                  </div>
                  <div className={`text-base sm:text-lg font-bold font-mono ${data.profitGrowthValue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {data.profitGrowthValue >= 0 ? '+' : ''}{formatBrl(data.profitGrowthValue)}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                    Variação: <span className={data.profitGrowthPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {data.profitGrowthPercent >= 0 ? '+' : ''}{data.profitGrowthPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Growth & Churn Message Banner */}
              <div className="p-3 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-indigo-200 dark:border-indigo-950 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-semibold text-indigo-900 dark:text-indigo-200 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Análise de Desempenho no Ciclo:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 text-xs">
                    Seu lucro líquido {data.profitGrowthValue >= 0 ? 'aumentou' : 'diminuiu'}{' '}
                    <strong className={data.profitGrowthValue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                      {formatBrl(Math.abs(data.profitGrowthValue))} ({data.profitGrowthPercent >= 0 ? '+' : ''}{data.profitGrowthPercent.toFixed(1)}%)
                    </strong> em relação ao fechamento anterior ({formatBrl(data.prevCycleProfit)}).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                    Perdas (Churn): <strong className="text-rose-600">{data.lossesCount} clientes ({data.churnRatePercent.toFixed(1)}%)</strong>
                  </span>
                </div>
              </div>

              {/* Gains & Losses Detailed Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Ganhos de Clientes no Mês */}
                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="font-semibold text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                      <ArrowUpRight className="w-4 h-4" /> Ganhos do Mês (Novas Assinaturas)
                    </h4>
                    <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      +{data.gainsCount} novos
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    Foram adicionados <strong>{data.gainsCount} novos clientes</strong> no período atual, gerando um impacto positivo direto na receita recorrente mensal.
                  </p>
                </div>

                {/* Perdas de Clientes no Mês */}
                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="font-semibold text-rose-700 dark:text-rose-400 text-xs flex items-center gap-1.5">
                      <ArrowDownRight className="w-4 h-4" /> Perdas do Mês (Inativações/Cancelamentos)
                    </h4>
                    <span className="text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                      -{data.lossesCount} cancelados
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    Total de <strong>{data.lossesCount} clientes inativos ou não renovados</strong>. Taxa de Churn calculada em <strong>{data.churnRatePercent.toFixed(1)}%</strong>.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* TAB 2: EXTRATO COMPLETO (ENTRADAS & SAÍDAS) */}
      {activeTab === 'LEDGER' && (
        <FinancialLedgerGrid />
      )}

      {/* TAB 3: CALENDÁRIO & AGENDA DE VENCIMENTOS */}
      {activeTab === 'AGENDA' && (
        <CalendarAgenda
          clients={clients}
          onRenewClient={handleRenewSingleClient}
          onRefreshData={onRefreshClients}
        />
      )}
    </div>
  );
};
