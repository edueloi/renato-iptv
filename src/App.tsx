import React, { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, TrendingDown, FileSpreadsheet, Bot,
  Tv, Sun, Moon, Menu, X, ShieldCheck, CheckCircle2, LogOut, User as UserIcon, Mail, MessageSquare
} from 'lucide-react';
import { Client, ClientStatus } from './types';
import { apiFetch, clearSession } from './utils/api';
import { ClientManagement } from './components/ClientManagement';
import { FinancialDashboard } from './components/FinancialDashboard';
import { ExpenseTracker } from './components/ExpenseTracker';
import { SpreadsheetImporter } from './components/SpreadsheetImporter';
import { BotAutomationCenter } from './components/BotAutomationCenter';
import { MessageTemplatesCenter } from './components/MessageTemplatesCenter';
import { EmailMarketingCenter } from './components/EmailMarketingCenter';
import { ClientModal } from './components/ClientModal';
import { LoginScreen, UserAuth } from './components/LoginScreen';
import { MobileNavigation, TabType } from './components/MobileNavigation';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('clients');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('iptv_pro_theme');
      if (saved !== null) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAuth | null>(() => {
    try {
      const saved = localStorage.getItem('iptv_pro_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setMobileMenuOpen(false);
  };

  // Clients state
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Client Modal state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Financial month selection (default current YYYY-MM)
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);

  // Notification Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, text, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showToast = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    addToast(msg, type);
  };

  useEffect(() => {
    if (currentUser) {
      fetchClients();
    }
  }, [currentUser]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('iptv_pro_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('iptv_pro_theme', 'light');
    }
  }, [darkMode]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/clients');
      if (res.ok) {
        const json = await res.json();
        setClients(json);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClient = async (data: Partial<Client>) => {
    try {
      if (data.id) {
        // Edit
        const res = await apiFetch(`/api/clients/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          showToast('Cliente atualizado com sucesso!');
          fetchClients();
        }
      } else {
        // Create
        const res = await apiFetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          showToast('Novo cliente cadastrado com sucesso!');
          fetchClients();
        }
      }
    } catch (err) {
      console.error('Error saving client:', err);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      const res = await apiFetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Cliente removido.');
        fetchClients();
      }
    } catch (err) {
      console.error('Error deleting client:', err);
    }
  };

  const handleRenewBatch = async (clientIds: string[]) => {
    try {
      const res = await apiFetch('/api/clients/batch-renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientIds, addDaysCount: 30 })
      });
      if (res.ok) {
        const json = await res.json();
        showToast(`Renovados ${json.renewedCount} clientes por +30 dias!`);
        fetchClients();
      }
    } catch (err) {
      console.error('Error renewing clients in batch:', err);
    }
  };

  // Metrics summary for top bar
  const activeCount = clients.filter(c => c.status === 'Ativo' || c.status === 'Hoje' || c.status === 'A Vencer' || c.status === 'Pendente Pagamento' || c.status === 'Ativo Parceiro').length;
  const overdueCount = clients.filter(c => c.status === 'Vencido').length;
  const inactiveCount = clients.filter(c => c.status === 'Inativo').length;
  const totalRevenue = clients
    .filter(c => c.status === 'Ativo' || c.status === 'Hoje' || c.status === 'A Vencer' || c.status === 'Pendente Pagamento' || c.status === 'Ativo Parceiro')
    .reduce((sum, c) => sum + (c.value || 0), 0);

  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // If user is not logged in, present Login Screen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors text-xs sm:text-sm pb-16 md:pb-6">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-13 flex items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-lg shadow-xs">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-tight flex items-center gap-1.5">
                IPTV & P2P <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">Pro 2026</span>
              </h1>
              <p className="text-[10px] text-slate-500 hidden sm:block">
                Controle de Vendas, Fechamento Financeiro e Bot Automático
              </p>
            </div>
          </div>

          {/* Quick Stats Pill (Desktop) */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono bg-slate-50 dark:bg-slate-800/60 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Ativos: <strong>{activeCount}</strong>
            </div>
            <div className="w-px h-3 bg-slate-300 dark:bg-slate-700"></div>
            <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Vencidos: <strong>{overdueCount}</strong>
            </div>
            <div className="w-px h-3 bg-slate-300 dark:bg-slate-700"></div>
            <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
              Faturamento: <strong>{formatBrl(totalRevenue)}</strong>
            </div>
          </div>

          {/* Desktop User Profile Badge & Theme Toggle */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 pl-2 pr-1 py-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left text-[11px] leading-tight">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[110px]">
                  {currentUser.name}
                </span>
                <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-medium">
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="ml-1 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Sair do Sistema"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-800 transition-colors"
              title="Alternar Modo Escuro / Claro"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-800"
              title="Abrir Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Desktop) */}
        <div className="hidden md:block border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-1">
            <button
              onClick={() => setActiveTab('clients')}
              className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'clients'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Clientes IPTV/P2P
            </button>

            <button
              onClick={() => setActiveTab('financials')}
              className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'financials'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Faturamento Ciclo
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'expenses'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" /> Custos e Despesas
            </button>

            <button
              onClick={() => setActiveTab('import')}
              className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'import'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Importar Planilha
            </button>

            <button
              onClick={() => setActiveTab('bot')}
              className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'bot'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-emerald-500" /> Central do Bot
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'templates'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> Mensagens Prontas
            </button>

            <button
              onClick={() => setActiveTab('email')}
              className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'email'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-indigo-500" /> E-mail & Backups
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Side Drawer & Bottom Bar Navigation */}
      <MobileNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={mobileMenuOpen}
        setIsOpen={setMobileMenuOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        onLogout={handleLogout}
        metrics={{ activeCount, overdueCount, inactiveCount, totalRevenue }}
      />

      {/* Main Container Content */}
      <main className="max-w-7xl mx-auto p-3 sm:p-4">
        {activeTab === 'clients' && (
          <ClientManagement
            clients={clients}
            onAddClient={() => { setEditingClient(null); setIsClientModalOpen(true); }}
            onEditClient={(client) => { setEditingClient(client); setIsClientModalOpen(true); }}
            onDeleteClient={handleDeleteClient}
            onRenewBatch={handleRenewBatch}
            onRefresh={fetchClients}
          />
        )}

        {activeTab === 'financials' && (
          <FinancialDashboard
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            clients={clients}
            onRefreshClients={fetchClients}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpenseTracker
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        )}

        {activeTab === 'import' && (
          <SpreadsheetImporter
            onImportSuccess={fetchClients}
          />
        )}

        {activeTab === 'bot' && (
          <BotAutomationCenter />
        )}

        {activeTab === 'templates' && (
          <MessageTemplatesCenter
            clients={clients}
            onRefreshClients={fetchClients}
          />
        )}

        {activeTab === 'email' && (
          <EmailMarketingCenter />
        )}
      </main>

      {/* Client Edit / Add Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveClient}
        initialData={editingClient}
      />

      {/* Responsive Toast System */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
