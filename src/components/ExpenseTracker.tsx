import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Calendar, DollarSign, Layers, Tag, FileText, AlertCircle, TrendingDown, Edit3, Repeat, RefreshCw, ShieldCheck
} from 'lucide-react';
import { Expense } from '../types';
import { formatDateBR } from '../utils/masks';
import { ConfirmModal } from './ConfirmModal';
import { apiFetch } from '../utils/api';

interface ExpenseTrackerProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({
  selectedMonth,
  onMonthChange
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // New Expense form state
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Expense['category']>('Servidor IPTV');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Editing state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<Expense['category']>('Servidor IPTV');
  const [editNotes, setEditNotes] = useState('');
  const [editIsRecurring, setEditIsRecurring] = useState(true);

  // Delete modal & notice state
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/expenses');
      if (res.ok) {
        const json = await res.json();
        setExpenses(json);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !value) return;

    try {
      const res = await apiFetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthRef: selectedMonth,
          description,
          category,
          value: parseFloat(value),
          date,
          notes,
          isRecurring
        })
      });

      if (res.ok) {
        setDescription('');
        setValue('');
        setNotes('');
        setIsAdding(false);
        fetchExpenses();
      }
    } catch (err) {
      console.error('Error adding expense:', err);
    }
  };

  const handleStartEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setEditDescription(exp.description);
    setEditCategory(exp.category);
    setEditValue(exp.value.toString());
    setEditNotes(exp.notes || '');
    setEditIsRecurring(exp.isRecurring !== false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editValue) return;

    try {
      const res = await apiFetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editDescription,
          category: editCategory,
          value: parseFloat(editValue),
          notes: editNotes,
          isRecurring: editIsRecurring
        })
      });

      if (res.ok) {
        setEditingExpense(null);
        fetchExpenses();
      }
    } catch (err) {
      console.error('Error updating expense:', err);
    }
  };

  const handleCopyRecurrent = async () => {
    try {
      const res = await apiFetch('/api/expenses/copy-recurrent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetMonth: selectedMonth })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.addedCount > 0) {
          setNotice(`${json.addedCount} custos recorrentes foram clonados para ${selectedMonth}.`);
        } else {
          setNotice(`Todos os custos recorrentes já estão cadastrados em ${selectedMonth}.`);
        }
        setTimeout(() => setNotice(null), 4000);
        fetchExpenses();
      }
    } catch (err) {
      console.error('Error copying recurrent expenses:', err);
    }
  };

  const executeDeleteExpense = async () => {
    if (!deleteExpenseId) return;
    try {
      const res = await apiFetch(`/api/expenses/${deleteExpenseId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotice('Despesa removida com sucesso.');
        setTimeout(() => setNotice(null), 3000);
        fetchExpenses();
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
    } finally {
      setDeleteExpenseId(null);
    }
  };

  const formatBrl = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // Filter expenses by selected month
  const filteredExpenses = expenses.filter(e => e.monthRef === selectedMonth);
  const totalMonthExpenses = filteredExpenses.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            Controle de Custos e Despesas
          </h3>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
            Ajuste valores de custos por mês sem afetar fechamentos anteriores.
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="px-2 py-1 text-[11px] bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleCopyRecurrent}
            title="Importa automaticamente os custos recorrentes para o mês selecionado"
            className="px-2 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium rounded-lg text-xs border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition-colors shadow-2xs"
          >
            <Repeat className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Replicar Recorrentes</span>
            <span className="sm:hidden">Replicar</span>
          </button>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs border border-rose-500 flex items-center gap-1 transition-colors shadow-2xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdding ? 'Fechar' : 'Lançar'}</span>
          </button>
        </div>
      </div>

      {/* Safety Banner Explaining Past vs Present Isolation */}
      <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>
          <strong>Proteção do Histórico Financeiro:</strong> As alterações e reajustes de custos aplicam-se exclusivamente ao mês selecionado (<strong>{selectedMonth}</strong>). Os fechamentos de meses passados permanecem 100% congelados e preservados.
        </span>
      </div>

      {/* Add Expense Form Drawer/Box */}
      {isAdding && (
        <form onSubmit={handleAddExpense} className="p-4 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-3">
          <h4 className="font-semibold text-rose-900 dark:text-rose-200 text-xs">Novo Lançamento de Custo / Despesa para {selectedMonth}</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium text-[11px] mb-1">
                Descrição do Custo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Servidor IPTV Primário"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium text-[11px] mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Expense['category'])}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs"
              >
                <option value="Servidor IPTV">Servidor IPTV</option>
                <option value="Servidor P2P">Servidor P2P</option>
                <option value="Painel Master">Painel Master</option>
                <option value="Links/CDN">Links/CDN</option>
                <option value="Marketing">Marketing/Bots</option>
                <option value="Outros">Outros Custos</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium text-[11px] mb-1">
                Valor do Custo (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="150.00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium text-[11px] mb-1">
                Data do Pagamento
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <input
              type="text"
              placeholder="Observação / Referência de fatura (Opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs"
            />

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5 text-indigo-500" /> Custo Recorrente Mensal
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg text-xs border border-rose-500 transition-colors shadow-xs"
            >
              Confirmar Lançamento ({selectedMonth})
            </button>
          </div>
        </form>
      )}

      {/* Edit Expense Modal / Overlay */}
      {editingExpense && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveEdit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Ajustar Custo para {editingExpense.monthRef}
              </h3>
              <span className="text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                ID: {editingExpense.id}
              </span>
            </div>

            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-xs text-amber-800 dark:text-amber-300">
              💡 <strong>Atenção:</strong> Você está alterando o custo especificamente para o mês <strong>{editingExpense.monthRef}</strong>. Os registros de meses passados permanecerão intactos.
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Descrição do Custo
                </label>
                <input
                  type="text"
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Categoria
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                  >
                    <option value="Servidor IPTV">Servidor IPTV</option>
                    <option value="Servidor P2P">Servidor P2P</option>
                    <option value="Painel Master">Painel Master</option>
                    <option value="Links/CDN">Links/CDN</option>
                    <option value="Marketing">Marketing/Bots</option>
                    <option value="Outros">Outros Custos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Novo Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold focus:outline-none text-indigo-600 dark:text-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Observações
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={editIsRecurring}
                  onChange={(e) => setEditIsRecurring(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Custo Recorrente Mensal (pode ser replicado para próximos meses)</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors shadow-xs"
              >
                Salvar Valor no Mês ({editingExpense.monthRef})
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Card for Current Selected Month Expenses */}
      <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-slate-500 text-xs block">Total de Custos & Despesas no Mês ({selectedMonth}):</span>
          <span className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
            {formatBrl(totalMonthExpenses)}
          </span>
        </div>
        <div className="text-right text-xs text-slate-500">
          <span>{filteredExpenses.length} custos cadastrados</span>
        </div>
      </div>

      {/* Expenses History Table / Card List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-100 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
          <span>Custos Lançados no Mês ({selectedMonth})</span>
          <span className="text-[10px] text-slate-500 font-normal">
            Clique em "Ajustar" para alterar o valor sem modificar meses passados.
          </span>
        </div>

        {/* Mobile View: Stacked Cards */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredExpenses.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              Nenhum custo lançado para o mês {selectedMonth}.{' '}
              <button
                onClick={handleCopyRecurrent}
                className="mt-1 block mx-auto text-indigo-600 hover:underline font-semibold"
              >
                Clique aqui para replicar custos.
              </button>
            </div>
          ) : (
            filteredExpenses.map((exp) => (
              <div key={exp.id} className="p-3 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      {exp.description}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="px-2 py-0.5 text-[9px] font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {exp.category}
                      </span>
                      {exp.isRecurring !== false ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-bold rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          <Repeat className="w-2.5 h-2.5" /> Recorrente
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-medium">Pontual</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-rose-600 dark:text-rose-400 font-mono text-sm block">
                      {formatBrl(exp.value)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDateBR(exp.date)}
                    </span>
                  </div>
                </div>

                {exp.notes && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-md border border-slate-100 dark:border-slate-800">
                    {exp.notes}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  <button
                    onClick={() => handleStartEdit(exp)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" /> Ajustar Valor
                  </button>
                  <button
                    onClick={() => setDeleteExpenseId(exp.id)}
                    className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900 transition-colors"
                    title="Excluir Custo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="p-2.5">Descrição</th>
                <th className="p-2.5">Categoria</th>
                <th className="p-2.5">Recorrência</th>
                <th className="p-2.5">Data</th>
                <th className="p-2.5">Valor do Custo</th>
                <th className="p-2.5">Observação</th>
                <th className="p-2.5 text-right pr-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    Nenhum custo lançado para o mês {selectedMonth}. 
                    <button 
                      onClick={handleCopyRecurrent}
                      className="ml-2 text-indigo-600 hover:underline font-semibold"
                    >
                      Clique aqui para replicar custos recorrentes.
                    </button>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 font-semibold text-slate-900 dark:text-slate-100">{exp.description}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-2.5">
                      {exp.isRecurring !== false ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          <Repeat className="w-3 h-3" /> Recorrente
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Pontual</span>
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-xs">{formatDateBR(exp.date)}</td>
                    <td className="p-2.5 font-bold text-rose-600 dark:text-rose-400 font-mono text-sm">
                      {formatBrl(exp.value)}
                    </td>
                    <td className="p-2.5 text-slate-500 text-[11px]">{exp.notes || '-'}</td>
                    <td className="p-2.5 text-right pr-3 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStartEdit(exp)}
                          title="Ajustar valor do custo neste mês"
                          className="px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-md border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" /> Ajustar
                        </button>
                        <button
                          onClick={() => setDeleteExpenseId(exp.id)}
                          title="Remover custo deste mês"
                          className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md border border-rose-200 dark:border-rose-900 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notice Floating Alert */}
      {notice && (
        <div className="fixed bottom-16 md:bottom-5 right-4 z-50 px-3.5 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-medium rounded-lg shadow-lg border border-slate-700 flex items-center gap-2 text-xs animate-in slide-in-from-bottom-2 duration-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Delete Expense Modal */}
      <ConfirmModal
        isOpen={!!deleteExpenseId}
        title="Remover Despesa"
        message="Deseja realmente remover esta despesa deste mês? O histórico de outros meses não será alterado."
        confirmText="Sim, Remover"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={executeDeleteExpense}
        onClose={() => setDeleteExpenseId(null)}
      />
    </div>
  );
};

