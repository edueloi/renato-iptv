import React from 'react';
import { 
  Users, TrendingUp, TrendingDown, FileSpreadsheet, Bot, Database, 
  Sun, Moon, X, LogOut, ShieldCheck, ChevronRight, Tv, CheckCircle2, AlertCircle, Mail, MessageSquare
} from 'lucide-react';
import { UserAuth } from './LoginScreen';

export type TabType = 'clients' | 'financials' | 'expenses' | 'import' | 'bot' | 'templates' | 'email' | 'docs';

interface MobileNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  currentUser: UserAuth | null;
  onLogout: () => void;
  metrics: {
    activeCount: number;
    overdueCount: number;
    inactiveCount: number;
    totalRevenue: number;
  };
}

export function MobileNavigation({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  darkMode,
  setDarkMode,
  currentUser,
  onLogout,
  metrics,
}: MobileNavigationProps) {
  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const navItems = [
    {
      id: 'clients' as TabType,
      label: 'Clientes IPTV / P2P',
      shortLabel: 'Clientes',
      icon: Users,
      badge: metrics.activeCount > 0 ? `${metrics.activeCount} ativos` : null,
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    },
    {
      id: 'financials' as TabType,
      label: 'Faturamento Ciclo',
      shortLabel: 'Financeiro',
      icon: TrendingUp,
      badge: formatBrl(metrics.totalRevenue),
      badgeColor: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    },
    {
      id: 'expenses' as TabType,
      label: 'Custos e Despesas',
      shortLabel: 'Despesas',
      icon: TrendingDown,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'bot' as TabType,
      label: 'Central de Automação Bot',
      shortLabel: 'Bot',
      icon: Bot,
      badge: 'ON',
      badgeColor: 'bg-emerald-500 text-white font-bold',
    },
    {
      id: 'templates' as TabType,
      label: 'Mensagens Prontas & WhatsApp Direct',
      shortLabel: 'Mensagens',
      icon: MessageSquare,
      badge: 'Novo',
      badgeColor: 'bg-indigo-600 text-white font-bold',
    },
    {
      id: 'email' as TabType,
      label: 'E-mail SMTP & Backups',
      shortLabel: 'E-mail & Backup',
      icon: Mail,
      badge: 'SMTP',
      badgeColor: 'bg-indigo-500 text-white font-bold',
    },
    {
      id: 'import' as TabType,
      label: 'Importar Planilha Excel/CSV',
      shortLabel: 'Importar',
      icon: FileSpreadsheet,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'docs' as TabType,
      label: 'Arquitetura & Diagrama Prisma',
      shortLabel: 'Docs',
      icon: Database,
      badge: null,
      badgeColor: '',
    },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[90] transition-opacity duration-200 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Side Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[80%] max-w-xs bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-[100] flex flex-col shadow-2xl transition-all duration-300 ease-out md:hidden ${
          isOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-full opacity-0 pointer-events-none invisible'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-lg shadow-xs">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block leading-tight">
                IPTV & P2P Pro
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Menu de Navegação
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Profile Card */}
        {currentUser && (
          <div className="p-3 mx-3 mt-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs border border-white/20">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="inline-block px-1.5 py-0.2 bg-indigo-600 text-white text-[9px] font-bold rounded uppercase tracking-wider">
                    {currentUser.role}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    @{currentUser.username}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Quick Strip */}
        <div className="mx-3 mt-3 p-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
          <div>
            <span className="text-slate-400 block text-[9px]">ATIVOS</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">{metrics.activeCount}</span>
          </div>
          <div className="border-x border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 block text-[9px]">VENCIDOS</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 text-xs">{metrics.overdueCount}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9px]">FATUR.</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-[11px] truncate block">{formatBrl(metrics.totalRevenue)}</span>
          </div>
        </div>

        {/* Drawer Menu Links */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 my-1">
          <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-2 mb-1.5 tracking-wider">
            Módulos do Sistema
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between text-xs border ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold border-indigo-500 shadow-sm shadow-indigo-600/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-slate-200/40 dark:border-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white/80' : 'text-slate-400'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-950/30">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full py-2 px-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              <span>{darkMode ? 'Modo Escuro Ativo' : 'Modo Claro Ativo'}</span>
            </span>
            <span className="text-[10px] text-slate-400">Alternar</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full py-2 px-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão (Sair)</span>
          </button>
        </div>
      </div>

      {/* Fixed Bottom Mobile Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around md:hidden shadow-lg">
        <button
          onClick={() => setActiveTab('clients')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
            activeTab === 'clients' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[10px]">Clientes</span>
        </button>

        <button
          onClick={() => setActiveTab('financials')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
            activeTab === 'financials' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span className="text-[10px]">Financeiro</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
            activeTab === 'expenses' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span className="text-[10px]">Custos</span>
        </button>

        <button
          onClick={() => setActiveTab('bot')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors relative ${
            activeTab === 'bot' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Bot className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px]">Bot</span>
          <span className="absolute top-0.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        </button>

        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <div className="p-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">
            <Tv className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </div>
    </>
  );
}
