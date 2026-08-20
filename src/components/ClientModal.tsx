import React, { useState, useEffect } from 'react';
import { X, Save, User, Calendar, DollarSign, Phone, Tv, FileText, Server } from 'lucide-react';
import { Client, ClientStatus, ServiceType } from '../types';
import { maskPhoneInput, parseCurrencyToNumber } from '../utils/masks';
import { DatePicker } from './DatePicker';
import { AppDropdown } from './AppDropdown';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Partial<Client>) => void;
  initialData?: Client | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [username, setUsername] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<ClientStatus>('Ativo');
  const [value, setValue] = useState('35.00');
  const [contact, setContact] = useState('');
  const [appUsed, setAppUsed] = useState('XCIPTV');
  const [serviceType, setServiceType] = useState<ServiceType>('IPTV');
  const [extraField, setExtraField] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setUsername(initialData.username || '');
      setDueDate(initialData.dueDate || new Date().toISOString().split('T')[0]);
      setStatus(initialData.status || 'Ativo');
      setValue(initialData.value ? Number(initialData.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '35,00');
      setContact(initialData.contact ? maskPhoneInput(initialData.contact) : '');
      setAppUsed(initialData.appUsed || 'XCIPTV');
      setServiceType(initialData.serviceType || 'IPTV');
      setExtraField(initialData.extraField || '');
      setNotes(initialData.notes || '');
    } else {
      setUsername('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setStatus('Ativo');
      setValue('35,00');
      setContact('');
      setAppUsed('XCIPTV');
      setServiceType('IPTV');
      setExtraField('');
      setNotes('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialData?.id,
      username,
      dueDate,
      status,
      value: parseCurrencyToNumber(value) || 35.00,
      contact,
      appUsed,
      serviceType,
      extraField,
      notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl relative text-xs animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 rounded-t-xl">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xs sm:text-sm">
            <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {initialData ? 'Editar Cliente IPTV/P2P' : 'Novo Cliente IPTV/P2P'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-visible">
          {/* Nome do Cliente */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 text-xs">
              Nome do Cliente / Usuário *
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="Ex: João da Silva"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-9 pl-8 pr-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Vencimento e Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <DatePicker
                label="Data de Vencimento *"
                value={dueDate}
                onChange={(val) => setDueDate(val)}
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 text-xs">
                Valor do Plano (R$) *
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="35,00"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onBlur={() => {
                    const parsed = parseCurrencyToNumber(value);
                    if (parsed) {
                      setValue(parsed.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                    }
                  }}
                  className="w-full h-9 pl-8 pr-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Status e Tipo de Serviço */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 text-xs">
                Status Atual
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ClientStatus)}
                className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800 dark:text-slate-100"
              >
                <option value="Ativo">Ativo</option>
                <option value="Hoje">Vence Hoje</option>
                <option value="A Vencer">A Vencer</option>
                <option value="Vencido">Vencido</option>
                <option value="Pendente Pagamento">Pendente Pagamento</option>
                <option value="Ativo Parceiro">Ativo Parceiro</option>
                <option value="Bloqueado">Bloqueado</option>
                <option value="Inativo">Inativo</option>
                <option value="Em Teste">Em Teste</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 text-xs">
                Tipo de Serviço
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800 dark:text-slate-100"
              >
                <option value="IPTV">IPTV</option>
                <option value="P2P">P2P</option>
                <option value="IPTV_P2P">IPTV + P2P Combo</option>
              </select>
            </div>
          </div>

          {/* Contato e Aplicativo Usado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 text-xs">
                Número WhatsApp (Mascara)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="(11) 99999-8888"
                  value={contact}
                  onChange={(e) => setContact(maskPhoneInput(e.target.value))}
                  className="w-full h-9 pl-8 pr-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <AppDropdown
                label="Aplicativo Usado"
                value={appUsed}
                onChange={(val) => setAppUsed(val)}
              />
            </div>
          </div>

          {/* Servidor / Campo Extra (Coluna F) */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 text-xs">
              Servidor / Linha Extra (Coluna F)
            </label>
            <div className="relative">
              <Server className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Servidor 01 - Fast, Painel X..."
                value={extraField}
                onChange={(e) => setExtraField(e.target.value)}
                className="w-full h-9 pl-8 pr-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1 text-xs">
              Observações
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
              <textarea
                rows={2}
                placeholder="Plano Mensal Completo HD/FHD/4K..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800 dark:text-slate-100 resize-none"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg border border-indigo-500 flex items-center gap-1.5 transition-colors shadow-xs text-xs"
            >
              <Save className="w-3.5 h-3.5" /> Salvar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
