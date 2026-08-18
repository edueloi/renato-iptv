import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../utils/api';
import { Tv, Plus, Edit2, Trash2, Check, X, Settings, ChevronDown, Search } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface AppDropdownProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  className?: string;
}

export const AppDropdown: React.FC<AppDropdownProps> = ({
  value,
  onChange,
  label,
  className = ''
}) => {
  const [apps, setApps] = useState<string[]>([
    'XCIPTV',
    'IBO Player',
    'IPTV Smarters Pro',
    'SSIPTV',
    'TVK Player',
    'Unitv',
    'WebPlayer',
    'SmartOne',
    'Kodi',
    'GSE Smart IPTV',
    'TiviMate'
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isManageOpen, setIsManageOpen] = useState(false);

  // Management Modal State
  const [newAppName, setNewAppName] = useState('');
  const [editingOldName, setEditingOldName] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [deleteConfirmApp, setDeleteConfirmApp] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchApps();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchApps = async () => {
    try {
      const res = await apiFetch('/api/apps');
      if (res.ok) {
        const json = await res.json();
        if (json.apps && Array.isArray(json.apps) && json.apps.length > 0) {
          setApps(json.apps);
        }
      }
    } catch (err) {
      console.error('Error fetching apps:', err);
    }
  };

  const handleAddApp = async () => {
    if (!newAppName.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAppName.trim() })
      });
      if (res.ok) {
        const json = await res.json();
        setApps(json.apps || []);
        onChange(newAppName.trim());
        setNewAppName('');
      }
    } catch (err) {
      console.error('Error adding app:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditApp = async (oldName: string) => {
    if (!editingValue.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingValue.trim(), oldName })
      });
      if (res.ok) {
        const json = await res.json();
        setApps(json.apps || []);
        if (value === oldName) {
          onChange(editingValue.trim());
        }
        setEditingOldName(null);
        setEditingValue('');
      }
    } catch (err) {
      console.error('Error editing app:', err);
    } finally {
      setSaving(false);
    }
  };

  const executeDeleteApp = async () => {
    if (!deleteConfirmApp) return;
    const appName = deleteConfirmApp;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/apps/${encodeURIComponent(appName)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const json = await res.json();
        setApps(json.apps || []);
        if (value === appName) {
          onChange(json.apps[0] || 'XCIPTV');
        }
      }
    } catch (err) {
      console.error('Error deleting app:', err);
    } finally {
      setSaving(false);
      setDeleteConfirmApp(null);
    }
  };

  const filteredApps = apps.filter(a => a.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={containerRef} className="relative w-full text-xs">
      {label && (
        <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 text-xs">
          {label}
        </label>
      )}

      {/* Combobox Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between text-left text-xs font-medium text-slate-800 dark:text-slate-100 hover:border-indigo-400 dark:hover:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${className}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Tv className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="truncate">{value || 'Selecione o Aplicativo...'}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-50 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Bar */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar ou digitar nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-36 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
            {filteredApps.length === 0 ? (
              <div className="p-2.5 text-center text-slate-400 text-xs">
                {search ? (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(search.trim());
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    Usar "{search}"
                  </button>
                ) : (
                  'Nenhum aplicativo encontrado'
                )}
              </div>
            ) : (
              filteredApps.map((appName) => {
                const isSelected = value === appName;
                return (
                  <button
                    key={appName}
                    type="button"
                    onClick={() => {
                      onChange(appName);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center justify-between text-xs transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span>📺</span>
                      <span>{appName}</span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Action: Manage List */}
          <div className="p-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsManageOpen(true);
              }}
              className="w-full py-1.5 px-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Gerenciar & Adicionar Aplicativos</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE GERENCIAMENTO DE APLICATIVOS */}
      {isManageOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-1.5">
                <Tv className="w-4 h-4 text-indigo-500" />
                Gerenciar Lista de Aplicativos
              </h4>
              <button
                type="button"
                onClick={() => setIsManageOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Add New App */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome do aplicativo (ex: TiviMate Pro)"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddApp();
                  }
                }}
                className="flex-1 h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none text-xs"
              />
              <button
                type="button"
                onClick={handleAddApp}
                disabled={saving || !newAppName.trim()}
                className="px-3 h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cadastrar</span>
              </button>
            </div>

            {/* List of Managed Apps */}
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
              {apps.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  Nenhum aplicativo cadastrado.
                </div>
              ) : (
                apps.map((appName) => (
                  <div key={appName} className="p-2 flex items-center justify-between gap-2 hover:bg-slate-100/60 dark:hover:bg-slate-800/60">
                    {editingOldName === appName ? (
                      <div className="flex items-center gap-1.5 w-full">
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="flex-1 h-7 px-2 bg-white dark:bg-slate-900 border border-indigo-500 rounded text-xs"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleEditApp(appName)}
                          className="p-1 bg-emerald-600 text-white rounded"
                          title="Salvar"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingOldName(null)}
                          className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded"
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium text-slate-800 dark:text-slate-200 text-xs truncate">
                          📺 {appName}
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingOldName(appName);
                              setEditingValue(appName);
                            }}
                            className="p-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                            title="Editar nome"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmApp(appName)}
                            className="p-1 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsManageOpen(false)}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal for App Deletion */}
      <ConfirmModal
        isOpen={!!deleteConfirmApp}
        title="Remover Aplicativo"
        message={`Deseja remover "${deleteConfirmApp}" da lista de aplicativos?`}
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
        isLoading={saving}
        onConfirm={executeDeleteApp}
        onClose={() => setDeleteConfirmApp(null)}
      />
    </div>
  );
};
